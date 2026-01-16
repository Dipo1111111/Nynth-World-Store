// scripts/generateSitemap.js
// Run this script to generate sitemap.xml for SEO
// Usage: node scripts/generateSitemap.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase config (use your actual config)
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

const SITE_URL = process.env.VITE_SITE_URL || 'http://localhost:5173';

// Static pages
const staticPages = [
    { url: '/', changefreq: 'daily', priority: '1.0' },
    { url: '/shop', changefreq: 'daily', priority: '0.9' },
    { url: '/lookbook', changefreq: 'weekly', priority: '0.8' },
    { url: '/contact', changefreq: 'monthly', priority: '0.6' },
    { url: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
    { url: '/terms-of-service', changefreq: 'yearly', priority: '0.3' },
    { url: '/shipping-returns', changefreq: 'monthly', priority: '0.5' },
];

async function generateSitemap() {
    console.log('🔍 Fetching products from Firestore...');

    // Fetch all products
    const productsSnapshot = await getDocs(collection(db, 'products'));
    const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    console.log(`✅ Found ${products.length} products`);

    // Build sitemap XML
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    staticPages.forEach(page => {
        sitemap += '  <url>\n';
        sitemap += `    <loc>${SITE_URL}${page.url}</loc>\n`;
        sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
        sitemap += `    <priority>${page.priority}</priority>\n`;
        sitemap += '  </url>\n';
    });

    // Add product pages
    products.forEach(product => {
        sitemap += '  <url>\n';
        sitemap += `    <loc>${SITE_URL}/product/${product.id}</loc>\n`;
        sitemap += '    <changefreq>weekly</changefreq>\n';
        sitemap += '    <priority>0.8</priority>\n';
        sitemap += '  </url>\n';
    });

    sitemap += '</urlset>';

    // Write to public directory
    const publicDir = path.join(__dirname, '..', 'public');
    const sitemapPath = path.join(publicDir, 'sitemap.xml');

    fs.writeFileSync(sitemapPath, sitemap, 'utf-8');
    console.log(`✅ Sitemap generated at: ${sitemapPath}`);
    console.log(`📄 Total URLs: ${staticPages.length + products.length}`);
}

generateSitemap()
    .then(() => {
        console.log('✨ Sitemap generation complete!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Error generating sitemap:', error);
        process.exit(1);
    });
