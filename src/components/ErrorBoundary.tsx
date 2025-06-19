import React, { Component, ErrorInfo, ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Filter out Vite HMR errors
    const isViteHMRError =
      error.message?.includes(
        "Cannot read properties of undefined (reading 'send')",
      ) ||
      error.message?.includes("[vite]") ||
      error.message?.includes("WebSocket");

    if (isViteHMRError) {
      console.warn("🔄 Vite HMR Error detected - attempting recovery...");

      // Try to recover from HMR errors
      setTimeout(() => {
        this.setState({ hasError: false, error: undefined });
      }, 1000);

      return;
    }

    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Check if it's a Vite HMR error
      const isViteHMRError =
        this.state.error.message?.includes(
          "Cannot read properties of undefined (reading 'send')",
        ) ||
        this.state.error.message?.includes("[vite]") ||
        this.state.error.message?.includes("WebSocket");

      if (isViteHMRError) {
        // Don't show error UI for Vite HMR errors, just log and continue
        return this.props.children;
      }

      return (
        <div
          className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-6"
          dir="rtl"
        >
          <div className="max-w-2xl w-full space-y-6">
            <div className="text-center space-y-4">
              <div className="p-4 bg-white rounded-full shadow-lg inline-flex">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                حدث خطأ غير متوقع
              </h1>
              <p className="text-gray-600">
                نعتذر، حدث خطأ في التطبيق. يمكنك المحاولة مرة أخرى أو إعادة
                تحميل الصفحة.
              </p>
            </div>

            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                <strong>تفاصيل الخطأ:</strong>
                <br />
                {this.state.error.message}
              </AlertDescription>
            </Alert>

            {process.env.NODE_ENV === "development" && this.state.errorInfo && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertDescription className="text-yellow-700">
                  <strong>معلومات إضافية (وضع التطوير):</strong>
                  <pre className="mt-2 text-xs overflow-auto max-h-40 bg-white p-2 rounded border">
                    {this.state.error.stack}
                  </pre>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4 justify-center">
              <Button
                onClick={this.handleReset}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
              >
                <RefreshCw className="h-5 w-5 ml-2" />
                المحاولة مرة أخرى
              </Button>

              <Button
                onClick={this.handleReload}
                variant="outline"
                className="border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                إعادة تحميل الصفحة
              </Button>
            </div>

            <div className="text-center text-sm text-gray-500">
              إذا استمر الخطأ، يرجى الاتصال بالدعم الفني
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
