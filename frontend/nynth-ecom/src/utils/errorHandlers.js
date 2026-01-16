/**
 * Translates Firebase Auth error codes into human-friendly messages.
 * @param {string} code - The Firebase error code (e.g., 'auth/user-not-found')
 * @returns {string} - A user-friendly error message
 */
export const getAuthErrorMessage = (code) => {
    switch (code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Invalid email or password. Please try again.';
        case 'auth/email-already-in-use':
            return 'This email is already registered. Try logging in instead.';
        case 'auth/weak-password':
            return 'Password is too weak. Please use at least 6 characters.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        case 'auth/user-disabled':
            return 'This account has been disabled. Please contact support.';
        default:
            return 'An unexpected error occurred. Please try again.';
    }
};

/**
 * Retries a function multiple times if it fails.
 * @param {Function} fn - The function to retry
 * @param {number} retries - Maximum number of retries
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise}
 */
export const withRetry = async (fn, retries = 3, delay = 1000) => {
    try {
        return await fn();
    } catch (error) {
        if (retries <= 0) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
        return withRetry(fn, retries - 1, delay * 2); // Exponential backoff
    }
};

/**
 * Generic error logger (could be expanded to send to Sentry/LogRocket)
 */
export const logError = (error, context = "") => {
    console.error(`[Error] ${context}:`, error);
};

