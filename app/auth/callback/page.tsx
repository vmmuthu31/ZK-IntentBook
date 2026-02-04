"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle, Shield } from "lucide-react";
import { useZkLogin } from "@/client/providers/ZkLoginProvider";
import { Button } from "@/components/ui/button";

type CallbackState = "loading" | "success" | "error";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { handleCallback, isAuthenticated } = useZkLogin();
  const [state, setState] = useState<CallbackState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    processCallback();
  }, []);

  useEffect(() => {
    if (isAuthenticated && state === "success") {
      const timer = setTimeout(() => {
        router.push("/");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, state, router]);

  const processCallback = async () => {
    try {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const idToken = params.get("id_token");

      if (!idToken) {
        const errorParam = searchParams.get("error");
        const errorDesc = searchParams.get("error_description");
        throw new Error(
          errorDesc || errorParam || "No ID token found in callback",
        );
      }

      await handleCallback(idToken);
      setState("success");
    } catch (error) {
      console.error("Auth callback error:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Authentication failed",
      );
      setState("error");
    }
  };

  const retryLogin = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-xl">zkLogin Authentication</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {state === "loading" && (
            <>
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Verifying your credentials...
                </p>
                <p className="text-sm text-muted-foreground">
                  Generating zero-knowledge proof
                </p>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div className="bg-primary h-full animate-pulse w-3/4" />
              </div>
            </>
          )}

          {state === "success" && (
            <>
              <div className="flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-green-600">
                  Authentication Successful!
                </p>
                <p className="text-sm text-muted-foreground">
                  Your zkLogin session has been created. Redirecting...
                </p>
              </div>
            </>
          )}

          {state === "error" && (
            <>
              <div className="flex justify-center">
                <XCircle className="h-12 w-12 text-red-500" />
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-red-600">
                  Authentication Failed
                </p>
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              </div>
              <Button onClick={retryLogin} className="w-full">
                Try Again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-xl">zkLogin Authentication</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
