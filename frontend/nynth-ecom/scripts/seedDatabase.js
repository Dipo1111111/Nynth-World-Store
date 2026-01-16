// scripts/seedDatabase.js
// Run this script to populate your Firestore with initial data
// Usage: node scripts/seedDatabase.js

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Firebase config (should match your .env or actual project config)
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const sampleProducts = [
    {
        title: "NYNTH Signature Hoodie",
        price: 35000,
        category: "hoodies",
        description: "Premium heavyweight cotton hoodie with minimal branding. Perfect for everyday wear.",
        inStock: true,
        availableColors: ["Black", "Grey", "Off-White"],
        availableSizes: ["S", "M", "L", "XL"],
        images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=1000"]
    },
    {
        title: "Essential Oversized Tee",
        price: 18500,
        category: "tees",
        description: "Drop shoulder oversized tee made from 240GSM premium cotton.",
        inStock: true,
        availableColors: ["White", "Black", "Sand"],
        availableSizes: ["M", "L", "XL"],
        images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000"]
    },
    {
        title: "Structured Panel Cap",
        price: 12000,
        category: "headwear",
        description: "6-panel structured cap with embroidered NYNTH logo.",
        inStock: true,
        availableColors: ["Black", "Navy"],
        availableSizes: ["One Size"],
        images: ["https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1000"]
    }
];

const defaultSettings = {
    currency_symbol: "₦",
    shipping_fee: 2500,
    site_name: "NYNTH",
    support_email: "support@nynth.com",
    support_phone: "+234 800 NYNTH",
    office_address: "123 Fashion Street, Lagos Island",
    instagram_url: "https://instagram.com/nynth",
    twitter_url: "https://twitter.com/nynth",
    facebook_url: "https://facebook.com/nynth"
};

async function seed() {
    console.log('🌱 Starting database seeding...');

    try {
        // 1. Seed Settings
        console.log('⚙️ Seeding settings...');
        await setDoc(doc(db, 'settings', 'site_config'), defaultSettings);
        console.log('✅ Settings seeded');

        // 2. Seed Products
        console.log('👕 Seeding products...');
        for (const product of sampleProducts) {
            await addDoc(collection(db, 'products'), {
                ...product,
                created_at: serverTimestamp()
            });
        }
        console.log(`✅ ${sampleProducts.length} products seeded`);

        console.log('✨ Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seed();
