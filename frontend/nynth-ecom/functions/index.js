const { onCall, onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const crypto = require("crypto");

// Set global options to ensure region alignment
setGlobalOptions({ region: "us-central1" });

admin.initializeApp();
const db = admin.firestore();

exports.paystackWebhook = onRequest(
    { secrets: ["PAYSTACK_SECRET_KEY"] },
    async (req, res) => {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        const signature = req.headers["x-paystack-signature"];

        // 1. Verify Signature
        const hash = crypto
            .createHmac("sha512", secret)
            .update(JSON.stringify(req.body))
            .digest("hex");

        if (hash !== signature) {
            console.error("Invalid signature");
            return res.status(401).send("Invalid signature");
        }

        const event = req.body;

        // 2. Handle 'charge.success'
        if (event.event === "charge.success") {
            const { metadata, reference } = event.data;
            const orderId = metadata.orderId;

            if (!orderId) {
                console.error("No orderId found in metadata");
                return res.status(400).send("No orderId in metadata");
            }

            try {
                await db.runTransaction(async (transaction) => {
                    const orderRef = db.collection("orders").doc(orderId);
                    const orderDoc = await transaction.get(orderRef);

                    if (!orderDoc.exists) {
                        throw new Error(`Order ${orderId} does not exist`);
                    }

                    const orderData = orderDoc.data();

                    // Avoid duplicate processing
                    if (orderData.payment_status === "paid") {
                        console.log(`Order ${orderId} already marked as paid.`);
                        return;
                    }

                    // A. Update Order Status
                    transaction.update(orderRef, {
                        payment_status: "paid",
                        order_status: "confirmed",
                        payment_reference: reference,
                        payment_gateway: "paystack",
                        updated_at: admin.firestore.FieldValue.serverTimestamp(),
                    });

                    // B. Decrement Stock
                    if (orderData.items && Array.isArray(orderData.items)) {
                        for (const item of orderData.items) {
                            const productRef = db.collection("products").doc(item.id);
                            const productDoc = await transaction.get(productRef);

                            if (productDoc.exists) {
                                const currentStock = productDoc.data().stockQuantity || 0;
                                const newStock = Math.max(0, currentStock - (item.quantity || 1));
                                transaction.update(productRef, {
                                    stockQuantity: newStock,
                                    inStock: newStock > 0,
                                    updated_at: admin.firestore.FieldValue.serverTimestamp(),
                                });
                            }
                        }
                    }

                    // C. Trigger Email Notification (REMOVED: Requires Blaze Plan)
                });

                console.log(`Successfully processed payment for Order: ${orderId}`);
                return res.status(200).send("Success");
            } catch (error) {
                console.error("Transaction failed: ", error);
                return res.status(500).send("Transaction failed");
            }
        }

        // Return 200 for other events to acknowledge receipt
        res.status(200).send("Event acknowledged");
    }
);

// 3. Initialize Payment (Redirect Flow)
exports.initializePayment = onCall(
    {
        secrets: ["PAYSTACK_SECRET_KEY"],
        cors: true // Explicitly enable CORS for local development
    },
    async (request) => {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        const { amount, email, metadata } = request.data;

        if (!amount || !email) {
            throw new Error("Missing required payment details (amount or email)");
        }

        try {
            const response = await fetch("https://api.paystack.co/transaction/initialize", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${secret}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    amount: Math.round(amount * 100), // convert to kobo
                    email,
                    metadata,
                    // Paystack will use the callback_url from settings or you can pass it here
                    callback_url: `${request.rawRequest?.headers?.origin || 'https://nynth.com'}/thank-you`,
                }),
            });

            const data = await response.json();

            if (!data.status) {
                console.error("Paystack Init Error:", data.message);
                throw new Error(data.message || "Failed to initialize payment");
            }

            return {
                authorization_url: data.data.authorization_url,
                reference: data.data.reference,
            };
        } catch (error) {
            console.error("Initialize Payment Error:", error);
            throw new Error(error.message || "Internal server error during payment initialization");
        }
    }
);

// 4. Send Bulk Email via Resend
exports.sendBulkEmail = onCall(
    { cors: true },
    async (request) => {
        if (!request.auth) {
            throw new Error("Unauthorized");
        }

        const userDoc = await db.collection("users").doc(request.auth.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'admin') {
            throw new Error("Forbidden: Admin access required");
        }

        const { emails, subject, body } = request.data;

        if (!emails || !Array.isArray(emails) || emails.length === 0) {
            throw new Error("No recipients provided");
        }
        if (!subject || !body) {
            throw new Error("Subject and body are required");
        }

        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            throw new Error("Resend API key not configured");
        }

        try {
            const results = await Promise.allSettled(
                emails.map(async (email) => {
                    const response = await fetch("https://api.resend.com/emails", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${resendApiKey}`,
                        },
                        body: JSON.stringify({
                            from: "Nynth <onboarding@resend.dev>",
                            to: email,
                            subject: subject,
                            html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
                        }),
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.message || "Failed to send email");
                    }
                    return response.json();
                })
            );

            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            return { success: true, sent: successful, failed };
        } catch (error) {
            console.error("Bulk email error:", error);
            throw new Error(`Failed to send emails: ${error.message}`);
        }
    }
);

// 5. Google Analytics 4 Data API Integration
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

/**
 * Fetches analytics data from Google Analytics 4
 * Requires: GA_PROPERTY_ID and GA_SERVICE_ACCOUNT_KEY (base64 encoded JSON) in environment
 */
exports.getGA4Analytics = onCall(
    { cors: true },
    async (request) => {
        // Only allow admins to fetch analytics
        if (!request.auth || !request.auth.token.email) {
            throw new Error("Unauthorized access to analytics");
        }

        // Check if user is an admin in Firestore
        const userDoc = await db.collection("users").doc(request.auth.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'admin') {
            throw new Error("Forbidden: Admin access required");
        }

        const propertyId = process.env.VITE_GA_PROPERTY_ID || request.data.propertyId;
        const serviceAccountKeyB64 = process.env.GA_SERVICE_ACCOUNT_KEY;

        if (!propertyId || !serviceAccountKeyB64) {
            console.warn("GA4 Analytics not configured. Returning empty data.");
            return {
                status: 'unconfigured',
                message: 'Google Analytics Property ID or Service Account Key is missing.',
                metrics: {}
            };
        }

        try {
            const serviceAccountKey = JSON.parse(Buffer.from(serviceAccountKeyB64, 'base64').toString());
            const analyticsDataClient = new BetaAnalyticsDataClient({
                credentials: serviceAccountKey,
            });

            const [response] = await analyticsDataClient.runReport({
                property: `properties/${propertyId}`,
                dateRanges: [
                    { startDate: '30daysAgo', endDate: 'today' },
                ],
                dimensions: [
                    { name: 'date' },
                ],
                metrics: [
                    { name: 'activeUsers' },
                    { name: 'screenPageViews' },
                    { name: 'sessions' },
                ],
            });

            // Process results into a more frontend-friendly format
            const metricsByDate = {};
            let totalVisits = 0;
            let totalViews = 0;

            response.rows.forEach(row => {
                const date = row.dimensionValues[0].value; // YYYYMMDD
                const formattedDate = `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
                
                metricsByDate[formattedDate] = {
                    users: parseInt(row.metricValues[0].value),
                    views: parseInt(row.metricValues[1].value),
                    sessions: parseInt(row.metricValues[2].value)
                };

                totalVisits += parseInt(row.metricValues[0].value);
                totalViews += parseInt(row.metricValues[1].value);
            });

            return {
                status: 'success',
                totalVisits,
                totalViews,
                metricsByDate,
                rawResponse: response // For debugging if needed
            };
        } catch (error) {
            console.error("GA4 Analytics Fetch Error:", error);
            throw new Error(`Failed to fetch GA4 analytics: ${error.message}`);
        }
    }
);
