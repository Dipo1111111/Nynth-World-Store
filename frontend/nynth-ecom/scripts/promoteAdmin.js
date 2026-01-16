/**
 * promoteAdmin.js
 * 
 * Usage: 
 * 1. Download your service account key from Firebase Console (Project Settings -> Service Accounts)
 * 2. Save it as 'serviceAccountKey.json' in the same folder as this script.
 * 3. Run: node promoteAdmin.js YOUR_USER_UID
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const uid = process.argv[2];

if (!uid) {
    console.error('Please provide a User UID as an argument.');
    console.log('Usage: node promoteAdmin.js <UID>');
    process.exit(1);
}

async function promoteToAdmin(userId) {
    try {
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();

        if (!doc.exists) {
            console.error(`User with UID ${userId} not found in 'users' collection.`);
            process.exit(1);
        }

        await userRef.update({
            role: 'admin',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Successfully promoted user ${userId} to ADMIN.`);
    } catch (error) {
        console.error('Error promoting user:', error);
    } finally {
        process.exit();
    }
}

promoteToAdmin(uid);
