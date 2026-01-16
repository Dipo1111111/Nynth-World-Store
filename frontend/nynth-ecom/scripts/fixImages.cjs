const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs, updateDoc, doc } = require("firebase/firestore");

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

async function fixImagePaths() {
    const querySnapshot = await getDocs(collection(db, "products"));
    for (const d of querySnapshot.docs) {
        const data = d.data();
        let updated = false;

        if (data.images) {
            const newImages = data.images.map(img => {
                if (img.startsWith("/src/assets/")) {
                    updated = true;
                    return img.replace("/src/assets/", "/images/");
                }
                return img;
            });

            if (updated) {
                console.log(`Updating ${data.title}...`);
                await updateDoc(doc(db, "products", d.id), { images: newImages });
            }
        }
    }
    console.log("Done!");
}

fixImagePaths();
