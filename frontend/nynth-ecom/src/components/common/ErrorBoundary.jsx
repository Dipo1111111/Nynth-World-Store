import React from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        // Report to Sentry
        import("@sentry/react").then(Sentry => {
            Sentry.captureException(error, { extra: errorInfo });
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6">
                        <AlertTriangle size={32} />
                    </div>
                    <h1 className="font-space text-3xl font-bold mb-4">Something went wrong</h1>
                    <p className="text-gray-500 max-w-md mb-8">
                        We encountered an unexpected error. Don't worry, your cart is safe.
                        Try refreshing the page or head back home.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center justify-center gap-2 bg-black text-white px-8 py-3 rounded-xl font-medium hover:opacity-90 transition-all"
                        >
                            <RefreshCw size={18} />
                            Refresh Page
                        </button>
                        <a
                            href="/"
                            className="flex items-center justify-center gap-2 border border-gray-200 px-8 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all"
                        >
                            <Home size={18} />
                            Go Home
                        </a>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
