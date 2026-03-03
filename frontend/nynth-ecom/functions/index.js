const { onRequest, onCall } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const crypto = require("crypto");

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
    { secrets: ["PAYSTACK_SECRET_KEY"] },
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
