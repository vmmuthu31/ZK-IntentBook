"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useZkLogin } from "../../providers/ZkLoginProvider";
import {
  type OAuthProvider,
  OAUTH_PROVIDER_CONFIG,
} from "../../../shared/types/zklogin";
import {
  Shield,
  LogOut,
  ChevronDown,
  Loader2,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";

const ENABLED_PROVIDERS: OAuthProvider[] = [
  "google",
  "facebook",
  "twitch",
  "apple",
];

export function ZkLoginButton() {
  const { isAuthenticated, isLoading, address, provider, login, logout } =
    useZkLogin();
  const [copiedAddress, setCopiedAddress] = useState(false);

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  if (isAuthenticated && address) {
    const providerConfig = provider ? OAUTH_PROVIDER_CONFIG[provider] : null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Shield className="h-4 w-4 text-green-500" />
            <span className="hidden sm:inline">{formatAddress(address)}</span>
            <Badge variant="secondary" className="text-xs">
              zkLogin
            </Badge>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="px-2 py-2">
            <p className="text-sm font-medium">zkLogin Account</p>
            <p className="text-xs text-muted-foreground">
              via {providerConfig?.name || "OAuth"}
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copyAddress}>
            {copiedAddress ? (
              <Check className="mr-2 h-4 w-4 text-green-500" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copiedAddress ? "Copied!" : "Copy Address"}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={`https://suiscan.xyz/testnet/account/${address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Explorer
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-red-500">
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" className="gap-2">
          <Shield className="h-4 w-4" />
          Connect with zkLogin
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-2">
          <p className="text-sm font-medium">Sign in with</p>
          <p className="text-xs text-muted-foreground">
            Privacy-preserving OAuth login
          </p>
        </div>
        <DropdownMenuSeparator />
        {ENABLED_PROVIDERS.map((provider) => {
          const config = OAUTH_PROVIDER_CONFIG[provider];
          return (
            <DropdownMenuItem
              key={provider}
              onClick={() => login(provider)}
              className="cursor-pointer"
            >
              <div
                className="mr-2 h-4 w-4 rounded"
                style={{ backgroundColor: config.color }}
              />
              {config.name}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ZkLoginCard() {
  const {
    isAuthenticated,
    isLoading,
    address,
    provider,
    session,
    login,
    logout,
  } = useZkLogin();
  const [selectedProvider, setSelectedProvider] =
    useState<OAuthProvider>("google");

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (isAuthenticated && address && session) {
    const providerConfig = provider ? OAUTH_PROVIDER_CONFIG[provider] : null;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">zkLogin Connected</CardTitle>
            </div>
            <Badge variant="secondary">{providerConfig?.name}</Badge>
          </div>
          <CardDescription>
            Your identity is protected by zero-knowledge proofs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Sui Address</p>
            <p className="font-mono text-sm break-all">{address}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Session Expires</p>
              <p>{new Date(session.expiresAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Max Epoch</p>
              <p>{session.ephemeralKeyPair.maxEpoch}</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <CardTitle className="text-lg">zkLogin</CardTitle>
        </div>
        <CardDescription>
          Sign in with your social account. Your identity stays private with
          zero-knowledge proofs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          {ENABLED_PROVIDERS.map((providerKey) => {
            const config = OAUTH_PROVIDER_CONFIG[providerKey];
            const isSelected = selectedProvider === providerKey;

            return (
              <Button
                key={providerKey}
                variant={isSelected ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setSelectedProvider(providerKey)}
              >
                <div
                  className="mr-3 h-4 w-4 rounded"
                  style={{ backgroundColor: config.color }}
                />
                {config.name}
              </Button>
            );
          })}
        </div>
        <Button
          className="w-full"
          onClick={() => login(selectedProvider)}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Continue with {OAUTH_PROVIDER_CONFIG[selectedProvider].name}
            </>
          )}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          zkLogin ensures your OAuth identity is never linked to your Sui
          address
        </p>
      </CardContent>
    </Card>
  );
}

export function ZkLoginFeatures() {
  const features = [
    {
      title: "Privacy First",
      description:
        "Your OAuth identity is never linked to your blockchain address",
      icon: "🔒",
    },
    {
      title: "Self-Custody",
      description:
        "OAuth providers cannot access your funds or sign transactions",
      icon: "🔐",
    },
    {
      title: "Two-Factor Security",
      description: "Requires both OAuth login and salt for transaction signing",
      icon: "🛡️",
    },
    {
      title: "No Seed Phrases",
      description: "Login with familiar OAuth flow, no mnemonics to remember",
      icon: "✨",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {features.map((feature, index) => (
        <Card key={index}>
          <CardContent className="pt-6">
            <div className="text-2xl mb-2">{feature.icon}</div>
            <h3 className="font-semibold mb-1">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">
              {feature.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
