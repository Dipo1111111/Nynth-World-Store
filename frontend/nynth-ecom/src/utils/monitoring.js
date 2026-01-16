import ReactGA from "react-ga4";
import * as Sentry from "@sentry/react";

/**
 * Initializes Analytics and Monitoring services.
 */
export const initMonitoring = () => {
    // 1. Initialize Sentry
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
    if (sentryDsn && sentryDsn !== "https://your-sentry-dsn.com") {
        Sentry.init({
            dsn: sentryDsn,
            integrations: [
                Sentry.browserTracingIntegration(),
                Sentry.replayIntegration(),
            ],
            // Performance Monitoring
            tracesSampleRate: 1.0,
            // Session Replay
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0,
            environment: import.meta.env.MODE,
        });
        console.log("Sentry monitoring initialized.");
    }

    // 2. Initialize Google Analytics
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (gaId && gaId !== "G-XXXXXXXXXX") {
        ReactGA.initialize(gaId);
        console.log("Google Analytics initialized.");
    }
};

/**
 * Track page views
 */
export const logPageView = () => {
    if (ReactGA.isInitialized) {
        ReactGA.send({ hitType: "pageview", page: window.location.pathname });
    }
};

/**
 * Track specific events (conversions, clicks, etc.)
 */
export const trackEvent = (category, action, label, value) => {
    if (ReactGA.isInitialized) {
        ReactGA.event({
            category,
            action,
            label,
            value,
        });
    }
};

/**
 * Track conversion events specifically
 */
export const trackConversion = (type, details = {}) => {
    if (ReactGA.isInitialized) {
        ReactGA.event(`conversion_${type}`, details);
    }
};
