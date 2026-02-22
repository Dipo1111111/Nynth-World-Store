import React, { useEffect, useState } from 'react';
import { fetchProducts, updateProduct } from '../api/firebaseFunctions';

export default function UpdateDB() {
    const [log, setLog] = useState("Running update...");

    useEffect(() => {
        const doUpdate = async () => {
            try {
                const products = await fetchProducts();

                // Find by 'pink', or 'hoodie', or just take the first one if we only have a few
                let target = products.find(p => p.title?.toLowerCase().includes('pink') || p.name?.toLowerCase().includes('pink'));

                if (!target) {
                    target = products.find(p => p.title?.toLowerCase().includes('nynth') && p.title?.toLowerCase().includes('hoodie'));
                }

                if (!target && products.length > 0) {
                    target = products[0]; // fallback to first product if nothing matches
                }

                if (target) {
                    setLog(`Found target: ${target.title} (${target.id}). Updating...`);
                    await updateProduct(target.id, {
                        title: "NYNTH BLACK HOODIE",
                        name: "NYNTH BLACK HOODIE",
                        category: "hoodies",
                        availableColors: ["Black"],
                        images: [
                            "/images/black nynth hoodie- front.jpeg",
                            "/images/black nynth-hoodie-back.jpeg",
                            "/images/black nynth-hoodie-model-front.jpeg",
                            "/images/black nynth-hoodie-model-back.jpeg"
                        ]
                    });
                    setLog(`SUCCESS: Updated ${target.title} to NYNTH BLACK HOODIE!`);
                } else {
                    setLog("FAILED: No products found in database.");
                }
            } catch (e) {
                setLog(`ERROR: ${e.message}`);
            }
        };
        doUpdate();
    }, []);

    return (
        <div style={{ padding: '50px', fontFamily: 'monospace', fontSize: '18px' }}>
            <h1>DB Update Tool</h1>
            <p>{log}</p>
        </div>
    );
}
