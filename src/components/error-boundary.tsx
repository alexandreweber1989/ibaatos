import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from "lucide-react";
import { reportLovableError } from "@/lib/lovable-error-reporting";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    reportLovableError(error, {
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grid place-items-center p-6 bg-background text-foreground">
          <div className="max-w-md w-full text-center space-y-6 animate-reveal">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-destructive/10 grid place-items-center text-destructive shadow-sm">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-3xl font-bold tracking-tight">Algo não deu certo</h1>
              <p className="text-muted-foreground leading-relaxed">
                Houve um erro inesperado na plataforma. Já fomos notificados e estamos trabalhando
                nisso.
              </p>
            </div>
            {this.state.error && (
              <pre className="text-[10px] font-mono p-4 bg-muted rounded-lg text-left overflow-auto max-h-32 opacity-60">
                {this.state.error.message}
              </pre>
            )}
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="rounded-full px-8"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Recarregar página
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
