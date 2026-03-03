import React, { useState } from 'react';
import { db } from "../api/firebase";
import { collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';

export default function UpdateDB() {
    const [status, setStatus] = useState("Idle. Use with caution!");
    const [loading, setLoading] = useState(false);

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
            <button
                onClick={runReset}
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
                {loading ? "WIPING..." : "WIPE TEST DATA"}
            </button>
            <div style={{ marginTop: '40px' }}>
                <a href="/shop" style={{ color: 'black', fontWeight: 'bold', textDecoration: 'underline' }}>Back to Shop</a>
            </div>

            <p style={{ marginTop: '20px', color: '#666', fontSize: '12px' }}>
                Note: This only deletes Firestore documents. To delete Auth Users, you must use the Firebase Console.
            </p>
        </div>
    );
}
