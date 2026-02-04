import { WebSocketServer, WebSocket } from "ws";
import express, { Request, Response } from "express";
import { z } from "zod";
import { IntentDecryptor } from "./crypto.js";
import { OrderBookService } from "./orderbook.js";
import { ProverClient } from "./prover.js";
import { SettlementService } from "./settlement.js";
import { logger } from "./logger.js";
import type {
  DecryptedIntent,
  EncryptedIntent,
  SolverConfig,
} from "./types.js";

const EncryptedIntentSchema = z.object({
  ciphertext: z.string(),
  ephemeralPublicKey: z.string(),
  nonce: z.string(),
  commitment: z.string(),
  userAddress: z.string(),
});

export class Solver {
  private readonly config: SolverConfig;
  private readonly decryptor: IntentDecryptor;
  private readonly orderBook: OrderBookService;
  private readonly prover: ProverClient;
  private readonly settlement: SettlementService;
  private readonly pendingIntents: Map<string, DecryptedIntent> = new Map();
  private wss: WebSocketServer | null = null;

  constructor(config: SolverConfig) {
    this.config = config;
    this.decryptor = new IntentDecryptor(config.privateKey);
    this.orderBook = new OrderBookService(config.suiRpcUrl);
    this.prover = new ProverClient(config.proverServiceUrl);
    this.settlement = new SettlementService(
      config.suiRpcUrl,
      config.privateKey,
    );
  }

  async start(): Promise<void> {
    this.startWebSocketServer();
    this.startHttpServer();
    this.startIntentProcessor();

    logger.info("Solver started", {
      wsPort: this.config.websocketPort,
      httpPort: this.config.httpPort,
      solverAddress: this.settlement.getSolverAddress(),
      publicKey: this.decryptor.getPublicKeyHex(),
    });
  }

  private startWebSocketServer(): void {
    this.wss = new WebSocketServer({ port: this.config.websocketPort });

    this.wss.on("connection", (ws: WebSocket) => {
      logger.info("New WebSocket connection");

      ws.on("message", (data: Buffer) => {
        this.handleWebSocketMessage(ws, data);
      });

      ws.on("close", () => {
        logger.info("WebSocket connection closed");
      });

      ws.on("error", (error) => {
        logger.error("WebSocket error", { error });
      });
    });
  }

  private handleWebSocketMessage(ws: WebSocket, data: Buffer): void {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case "submit_intent":
          this.handleIntentSubmission(ws, message.payload);
          break;
        case "get_status":
          this.handleStatusRequest(ws, message.commitment);
          break;
        case "get_public_key":
          ws.send(
            JSON.stringify({
              type: "public_key",
              publicKey: this.decryptor.getPublicKeyHex(),
            }),
          );
          break;
        default:
          ws.send(
            JSON.stringify({ type: "error", message: "Unknown message type" }),
          );
      }
    } catch (error) {
      logger.error("Failed to process WebSocket message", { error });
      ws.send(
        JSON.stringify({ type: "error", message: "Invalid message format" }),
      );
    }
  }

  private handleIntentSubmission(ws: WebSocket, payload: unknown): void {
    try {
      const validated = EncryptedIntentSchema.parse(payload);
      const encrypted: EncryptedIntent = {
        ciphertext: validated.ciphertext,
        ephemeralPublicKey: validated.ephemeralPublicKey,
        nonce: validated.nonce,
        commitment: validated.commitment,
      };

      const decrypted = this.decryptor.decrypt(
        encrypted,
        validated.userAddress,
      );

      this.pendingIntents.set(decrypted.commitment, decrypted);

      logger.info("Intent received and decrypted", {
        commitment: decrypted.commitment,
        inputToken: decrypted.intent.inputToken,
        outputToken: decrypted.intent.outputToken,
      });

      ws.send(
        JSON.stringify({
          type: "intent_accepted",
          commitment: decrypted.commitment,
          status: "pending",
        }),
      );
    } catch (error) {
      logger.error("Failed to process intent", { error });
      ws.send(
        JSON.stringify({
          type: "intent_rejected",
          error: error instanceof Error ? error.message : "Unknown error",
        }),
      );
    }
  }

  private handleStatusRequest(ws: WebSocket, commitment: string): void {
    const intent = this.pendingIntents.get(commitment);

    if (intent) {
      ws.send(
        JSON.stringify({
          type: "status",
          commitment,
          status: "pending",
          receivedAt: intent.timestamp,
        }),
      );
    } else {
      ws.send(
        JSON.stringify({
          type: "status",
          commitment,
          status: "unknown",
        }),
      );
    }
  }

  private startHttpServer(): void {
    const app = express();
    app.use(express.json());

    app.get("/health", (_req: Request, res: Response) => {
      res.json({
        status: "healthy",
        pendingIntents: this.pendingIntents.size,
        solverAddress: this.settlement.getSolverAddress(),
      });
    });

    app.get("/public-key", (_req: Request, res: Response) => {
      res.json({ publicKey: this.decryptor.getPublicKeyHex() });
    });

    app.post("/submit", (req: Request, res: Response) => {
      try {
        const validated = EncryptedIntentSchema.parse(req.body);
        const encrypted: EncryptedIntent = {
          ciphertext: validated.ciphertext,
          ephemeralPublicKey: validated.ephemeralPublicKey,
          nonce: validated.nonce,
          commitment: validated.commitment,
        };

        const decrypted = this.decryptor.decrypt(
          encrypted,
          validated.userAddress,
        );
        this.pendingIntents.set(decrypted.commitment, decrypted);

        res.json({
          success: true,
          commitment: decrypted.commitment,
          status: "pending",
        });
      } catch (error) {
        logger.error("HTTP submit failed", { error });
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    app.get("/status/:commitment", (req: Request, res: Response) => {
      const commitment = req.params.commitment as string;
      const intent = this.pendingIntents.get(commitment);

      if (intent) {
        res.json({
          commitment,
          status: "pending",
          intent: {
            inputToken: intent.intent.inputToken,
            outputToken: intent.intent.outputToken,
          },
        });
      } else {
        res.status(404).json({ commitment, status: "not_found" });
      }
    });

    app.listen(this.config.httpPort, () => {
      logger.info(`HTTP server listening on port ${this.config.httpPort}`);
    });
  }

  private startIntentProcessor(): void {
    const processInterval = 5000;

    setInterval(async () => {
      for (const [commitment, intent] of this.pendingIntents) {
        try {
          await this.processIntent(intent);
          this.pendingIntents.delete(commitment);
        } catch (error) {
          logger.error("Failed to process intent", { commitment, error });
        }
      }
    }, processInterval);

    logger.info(
      `Intent processor started, checking every ${processInterval}ms`,
    );
  }

  private async processIntent(intent: DecryptedIntent): Promise<void> {
    logger.info("Processing intent", { commitment: intent.commitment });

    const orderBook = await this.orderBook.getOrderBook(
      intent.intent.inputToken,
      intent.intent.outputToken,
    );

    const execution = this.orderBook.computeOptimalExecution(intent, orderBook);

    if (!execution) {
      logger.warn("Could not find satisfactory execution", {
        commitment: intent.commitment,
      });
      return;
    }

    logger.info("Computed execution", {
      commitment: intent.commitment,
      executedOutput: execution.executedOutputAmount,
    });

    const proof = await this.prover.generateProof(
      {
        ...intent.intent,
        userAddress: intent.userAddress,
      },
      execution,
      this.settlement.getSolverAddress(),
    );

    logger.info("Proof generated", {
      commitment: intent.commitment,
      proofSize: proof.proof.length,
    });

    const registryId = process.env.REGISTRY_ID || "0x0";
    const verifierConfigId = process.env.VERIFIER_CONFIG_ID || "0x0";
    const vaultId = process.env.VAULT_ID || "0x0";

    const txDigest = await this.settlement.submitSettlement(
      registryId,
      verifierConfigId,
      vaultId,
      execution,
      proof,
    );

    logger.info("Settlement completed", {
      commitment: intent.commitment,
      txDigest,
    });

    this.broadcastSettlement(intent.commitment, txDigest);
  }

  private broadcastSettlement(commitment: string, txDigest: string): void {
    if (!this.wss) return;

    const message = JSON.stringify({
      type: "settlement_complete",
      commitment,
      txDigest,
    });

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  async stop(): Promise<void> {
    if (this.wss) {
      this.wss.close();
    }
    logger.info("Solver stopped");
  }
}
