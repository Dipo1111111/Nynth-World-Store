import React from "react";

// A chunk that dies with a module/MIME/network error after a redeploy means
// the user's app shell is older than the live bundle. A hard refresh is the
// actual recovery, so surface that instead of a generic crash.
const isStaleChunkError = (error) =>
    error &&
    /(failed to fetch dynamically imported module|importing a module script failed|not a valid javascript|invalid .* mime|failed to fetch dynamically)/i.test(
        String(error && (error.message || error))
    );

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

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            const stale = isStaleChunkError(this.state.error);
            return (
                <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-6 text-center">
                    <p className="text-[11px] tracking-[0.3em] font-bold uppercase text-black/40 mb-3">
                        {stale ? "Update available" : "Something broke"}
                    </p>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-[-0.03em] leading-tight mb-4 max-w-md">
                        {stale ? "A new version is live." : "This page crashed."}
                    </h1>
                    <p className="text-sm text-black/60 max-w-sm mb-8 leading-relaxed">
                        {stale
                            ? "Your cached version can't load the latest build. Refresh to update - your cart is safe."
                            : "An unexpected error stopped this page. Your cart is safe - try again or head home."}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        {stale ? (
                            <button
                                onClick={() => window.location.reload()}
                                className="bg-black text-white px-8 py-4 text-[10px] tracking-[0.3em] font-bold uppercase hover:opacity-90 transition-all"
                            >
                                Refresh to update
                            </button>
                        ) : (
                            <button
                                onClick={this.handleRetry}
                                className="bg-black text-white px-8 py-4 text-[10px] tracking-[0.3em] font-bold uppercase hover:opacity-90 transition-all"
                            >
                                Try again
                            </button>
                        )}
                        <a
                            href="/"
                            className="text-[10px] tracking-[0.3em] font-bold uppercase text-black/60 hover:text-black transition-colors underline underline-offset-8 decoration-black/20"
                        >
                            Back to home
                        </a>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
