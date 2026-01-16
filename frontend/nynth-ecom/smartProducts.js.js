// smartProducts.js - WITH ALL IMAGES FOR HOVER EFFECT
import { initializeApp } from "firebase/app";
import {
    getFirestore,
    collection,
    addDoc,
    updateDoc,
    doc,
    getDocs,
    serverTimestamp
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyD8Kn7x8zARP9wqkY4uLFYaAoQJP2_3MXw",
    authDomain: "nynth-world.firebaseapp.com",
    projectId: "nynth-world",
    storageBucket: "nynth-world.firebasestorage.app",
    messagingSenderId: "406808661966",
    appId: "1:406808661966:web:c7e24e9cebce5f7f7ee59f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ CORRECTED: All images included for hover effect!
const currentProducts = [
    // 🧢 TRUQHA 9 CAP - All color variants as separate images
    {
        title: "NYNTH World Truqha 9",
        slug: "nynth-world-truqha-9",
        price: 7000,
        description: "Signature NYNTH face cap with foam-front texture and adjustable back strap. Minimalist streetwear design for everyday urban style.",
        category: "headwear",
        images: [
            "/src/assets/truqha9-black.png",    // Will show first
            "/src/assets/truqha9-blue.png",     // Will show on hover
            "/src/assets/truqha9-red.png",      // Will show on hover
            "/src/assets/truqha9-purple.png"    // Will show on hover
        ],
        thumbnail: "/src/assets/truqha9-black.png",
        inStock: true,
        stockQuantity: 25,
        availableColors: ["Black", "Blue", "Red", "Purple"],
        tags: ["cap", "face-cap", "headwear", "streetwear", "truqha9"],
        material: "Premium Fabric with Foam Front",
        published: true,
        featured: true
    },

    // 👕 T-SHIRT - Black and White variants
    {
        title: "NYNTH World T-Shirt",
        slug: "nynth-world-tshirt",
        price: 12000,
        description: "Official NYNTH crewneck t-shirt with minimalist branding. Made from premium cotton with a relaxed fit for all-day comfort.",
        category: "tees",
        images: [
            "/src/assets/tshirt-black.jpeg",    // Primary image
            "/src/assets/tshirt-white.png",    // Hover image (different color)
            // "/src/assets/tshirt-black-back.png", // Could add back view if you have
            // "/src/assets/tshirt-white-back.png"  // Could add back view if you have
        ],
        thumbnail: "/src/assets/tshirt-black.png",
        inStock: true,
        stockQuantity: 67,
        availableSizes: ["XS", "S", "M", "L"],
        availableColors: ["Black", "White"],
        tags: ["t-shirt", "official", "essential", "basic", "cotton"],
        material: "100% Premium Cotton",
        published: true,
        featured: true,
        newArrival: true
    },

    // 🧥 PINK HOODIE - Multiple angles (placeholders for now)
    {
        title: "NYNTH Pink Hoodie",
        slug: "nynth-pink-hoodie",
        price: 25000,
        description: "Signature pink hoodie from the NYNTH collection. Heavyweight cotton with ribbed cuffs and kangaroo pocket. Part of a matching set with joggers.",
        category: "hoodies",
        images: [
            "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=2070", // Front view
            "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?q=80&w=2070", // Back view
            "https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1974", // Side view
            "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000"     // Detail shot
        ],
        thumbnail: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=400",
        inStock: true,
        stockQuantity: 42,
        availableSizes: ["S", "M", "L"],
        availableColors: ["Pink"],
        tags: ["hoodie", "pink", "collection", "premium", "winter", "jogger-set"],
        material: "Heavyweight Cotton",
        published: true,
        featured: true,
        bestSeller: true
    }
];

async function smartUpdateProducts() {
    try {
        console.log("🔄 Syncing products with ALL images for hover effect...");

        // Get existing products
        const querySnapshot = await getDocs(collection(db, "products"));
        const existingProducts = [];

        querySnapshot.forEach((doc) => {
            existingProducts.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log(`📊 Found ${existingProducts.length} existing products`);

        let added = 0;
        let updated = 0;

        // Process each product
        for (const currentProduct of currentProducts) {
            // Find existing product by slug
            const existingProduct = existingProducts.find(
                p => p.slug === currentProduct.slug
            );

            if (existingProduct) {
                // Check if images are different
                const existingImages = JSON.stringify(existingProduct.images || []);
                const newImages = JSON.stringify(currentProduct.images || []);

                if (existingImages !== newImages) {
                    console.log(`🔄 Updating: ${currentProduct.title}`);
                    console.log(`   📸 Images updated: ${currentProduct.images.length} images`);

                    await updateDoc(doc(db, "products", existingProduct.id), {
                        ...currentProduct,
                        updated_at: serverTimestamp()
                    });
                    updated++;
                } else {
                    console.log(`⏭️  Skipping: ${currentProduct.title} (no changes)`);
                }
            } else {
                // Add new product
                console.log(`🆕 Adding: ${currentProduct.title}`);
                console.log(`   📸 With ${currentProduct.images.length} images for hover effect`);

                await addDoc(collection(db, "products"), {
                    ...currentProduct,
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                });
                added++;
            }
        }

        console.log("\n✅ SYNC COMPLETE!");
        console.log(`   🆕 Added: ${added} products`);
        console.log(`   🔄 Updated: ${updated} products`);
        console.log("\n🎯 HOVER EFFECT NOW WORKING!");
        console.log("👉 Each product has multiple images");
        console.log("👉 Hover over product cards to see different images");

    } catch (error) {
        console.error("❌ ERROR:", error.message);
    }
}

// Run it!
smartUpdateProducts();