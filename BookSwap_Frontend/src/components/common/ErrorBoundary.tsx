import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled runtime error captured by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
          <Card className="w-full max-w-lg border border-border bg-card shadow-xl p-4">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <CardTitle className="text-2xl font-extrabold text-foreground tracking-tight">
                Something went wrong
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1.5 font-medium leading-relaxed">
                An unexpected application error occurred. We have logged the issue and are looking into it.
              </p>
            </CardHeader>

            {this.state.error && (
              <CardContent className="mt-4">
                <div className="rounded-xl bg-muted/60 p-4 border border-border overflow-auto max-h-48 text-left">
                  <p className="text-xs font-bold text-destructive font-mono uppercase tracking-wider mb-2">
                    Error Log details
                  </p>
                  <pre className="text-[11px] font-semibold font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {this.state.error.stack || this.state.error.message}
                  </pre>
                </div>
              </CardContent>
            )}

            <CardFooter className="flex flex-col sm:flex-row gap-3 border-t border-border pt-6 mt-6 justify-center">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="w-full sm:w-auto font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Reload Page</span>
              </Button>
              <Button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-1.5"
              >
                <Home className="h-4 w-4" />
                <span>Go to Homepage</span>
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
