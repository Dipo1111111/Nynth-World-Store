import React, { useState } from 'react';
import { wipeTable, seedOrders as seedSampleOrders } from "../api/firebaseFunctions";

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
        return await wipeTable(collectionName);
    };

    const seedOrders = async () => {
        setLoading(true);
        setStatus("Seeding 15 sample orders...");
        try {
            await seedSampleOrders();
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

    const runWipeOrdersOnly = async () => {
        if (!window.confirm("This will delete ALL orders. Proceed?")) return;

        setLoading(true);
        setStatus("Wiping orders...");

        try {
            const count = await wipeCollection('orders');
            setStatus(`SUCCESS: Deleted ${count} orders.`);
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
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <button
                    onClick={runWipeOrdersOnly}
                    disabled={loading}
                    style={{
                        backgroundColor: '#FF8800',
                        color: 'white',
                        padding: '15px 30px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        opacity: loading ? 0.5 : 1
                    }}
                >
                    {loading ? "PROCESSING..." : "WIPE ONLY ORDERS"}
                </button>

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
