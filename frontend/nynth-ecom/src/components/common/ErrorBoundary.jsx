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
                    <div className="w-16 h-16 bg-red-50 text-red-600 flex items-center justify-center mb-6">
                        <AlertTriangle size={32} />
                    </div>
                    <h1 className="text-[11px] tracking-[0.3em] font-bold uppercase mb-4">SOMETHING WENT WRONG</h1>
                    <p className="text-[10px] tracking-[0.15em] text-gray-400 max-w-md mb-8 uppercase leading-relaxed">
                        We encountered an unexpected error. Don't worry, your cart is safe.
                        Try refreshing the page or head back home.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center justify-center gap-2 bg-black text-white px-8 py-4 text-[10px] tracking-[0.3em] font-bold uppercase hover:opacity-90 transition-all"
                        >
                            <RefreshCw size={14} />
                            Refresh Page
                        </button>
                        <a
                            href="/"
                            className="flex items-center justify-center gap-2 border border-black/10 px-8 py-4 text-[10px] tracking-[0.3em] font-bold uppercase hover:bg-black hover:text-white transition-all"
                        >
                            <Home size={14} />
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
