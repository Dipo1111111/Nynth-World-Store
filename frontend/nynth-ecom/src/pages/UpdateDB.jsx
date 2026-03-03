import React, { useState } from 'react';
import { db } from "../api/firebase";
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

export default function UpdateDB() {
    const [status, setStatus] = useState("Idle. Use with caution!");
    const [loading, setLoading] = useState(false);

    const SAMPLE_CHANNELS = ['Instagram', 'WhatsApp', 'Direct', 'Organic Search'];
    const SAMPLE_CITIES = ['Ikeja', 'Lekki', 'Victoria Island', 'Surulere', 'Ajah'];
    const SAMPLE_NAMES = [
        { first: 'Emeka', last: 'Okonkwo' },
        { first: 'Zainab', last: 'Bello' },
        { first: 'Chidi', last: 'Eze' },
        { first: 'Tunde', last: 'Bakare' },
        { first: 'Folake', last: 'Adeyemi' }
    ];

    const wipeCollection = async (collectionName) => {
        const colRef = collection(db, collectionName);
        const snapshot = await getDocs(colRef);
        const batch = writeBatch(db);

        snapshot.docs.forEach((d) => {
            batch.delete(d.ref);
        });

        await batch.commit();
        return snapshot.size;
    };

    const seedOrders = async () => {
        setLoading(true);
        setStatus("Fetching products to seed orders...");

        try {
            const productsSnapshot = await getDocs(collection(db, "products"));
            const products = productsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));

            if (products.length === 0) {
                throw new Error("No products found. Please add products before seeding orders.");
            }

            setStatus("Seeding 15 sample orders...");
            const batch = writeBatch(db);

            for (let i = 0; i < 15; i++) {
                const product = products[Math.floor(Math.random() * products.length)];
                const quantity = Math.floor(Math.random() * 2) + 1;
                const name = SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)];
                const city = SAMPLE_CITIES[Math.floor(Math.random() * SAMPLE_CITIES.length)];
                const channel = SAMPLE_CHANNELS[Math.floor(Math.random() * SAMPLE_CHANNELS.length)];

                // Create dates over the last 30 days
                const date = new Date();
                date.setDate(date.getDate() - Math.floor(Math.random() * 30));

                const orderId = `NY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
                const orderRef = doc(db, "orders", orderId);

                const orderData = {
                    customer: {
                        firstName: name.first,
                        lastName: name.last,
                        email: `${name.first.toLowerCase()}@example.com`,
                        phone: "08012345678",
                        address: "123 Sample Street",
                        city: city,
                        state: "LAGOS"
                    },
                    items: [{
                        id: product.id,
                        title: product.title || product.name,
                        price: product.price || 25000,
                        quantity: quantity,
                        selectedSize: "M",
                        selectedColor: "Black",
                        image: product.image || (product.images && product.images[0]) || ""
                    }],
                    subtotal: (product.price || 25000) * quantity,
                    shippingFee: 2500,
                    total: ((product.price || 25000) * quantity) + 2500,
                    payment_status: Math.random() > 0.3 ? "paid" : "pending",
                    order_status: Math.random() > 0.5 ? "delivered" : "processing",
                    payment_method: "paystack",
                    channel: channel,
                    created_at: date,
                    updated_at: date
                };

                batch.set(orderRef, orderData);
            }

            await batch.commit();
            setStatus("SUCCESS: Seeded 15 sample orders.");
        } catch (e) {
            console.error(e);
            setStatus(`ERROR: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };
    const runReset = async () => {
        if (!window.confirm("CRITICAL: This will delete ALL users, orders, and messages. This cannot be undone. Proceed?")) return;

        setLoading(true);
        setStatus("Wiping data...");

        try {
            const collections = ['orders', 'users', 'contact_messages', 'cart', 'newsletter_subscriptions'];
            let totalDeleted = 0;

            for (const col of collections) {
                const count = await wipeCollection(col);
                totalDeleted += count;
                console.log(`Deleted ${count} documents from ${col}`);
            }

            setStatus(`SUCCESS: Deleted ${totalDeleted} documents across ${collections.length} collections.`);
        } catch (e) {
            console.error(e);
            setStatus(`ERROR: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '50px', fontFamily: 'Inter, sans-serif' }}>
            <h1 style={{ color: 'red' }}>⚠️ Production Database Cleanup</h1>
            <p>Current Status: <strong>{status}</strong></p>
            <div style={{ display: 'flex', gap: '20px' }}>
                <button
                    onClick={runReset}
                    disabled={loading}
                    style={{
                        backgroundColor: '#FF0000',
                        color: 'white',
                        padding: '15px 30px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        opacity: loading ? 0.5 : 1
                    }}
                >
                    {loading ? "PROCESSING..." : "WIPE ALL DATA"}
                </button>

                <button
                    onClick={seedOrders}
                    disabled={loading}
                    style={{
                        backgroundColor: 'black',
                        color: 'white',
                        padding: '15px 30px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        opacity: loading ? 0.5 : 1
                    }}
                >
                    {loading ? "SEEDING..." : "SEED SAMPLE ORDERS"}
                </button>
            </div>
            <div style={{ marginTop: '40px' }}>
                <a href="/shop" style={{ color: 'black', fontWeight: 'bold', textDecoration: 'underline' }}>Back to Shop</a>
            </div>

            <p style={{ marginTop: '20px', color: '#666', fontSize: '12px' }}>
                Note: This only deletes Firestore documents. To delete Auth Users, you must use the Firebase Console.
            </p>
        </div>
    );
}
