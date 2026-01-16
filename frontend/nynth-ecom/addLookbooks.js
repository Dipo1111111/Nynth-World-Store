// addLookbooks.js - Run once to add lookbook content
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

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

const lookbooks = [
    {
        title: "Truqha 9 Black",
        category: "Headwear",
        description: "Nynth World is Minimalism",
        image: "/src/assets/truqha9-black.png",
        season: "Truqha 9 Collection",
        colorPalette: "Black",
        products: ["headwear"],
        featured: true
    },
    {
        title: "Nynth World T-Shirt",
        category: "Tees",
        description: "Elevated basics for everyday wear with signature NYNTH detailing.",
        image: "/src/assets/tshirt-black.jpeg",
        season: "Core Collection",
        colorPalette: "Black & White",
        products: ["tees"],
        featured: true
    },
    {
        title: "Nynth World Group Truqha 9",
        category: "headwear",
        description: "A group of Truqha 9s in different colors",
        image: "/src/assets/truqha9-purple.png",
        season: "Truqha 9 Collection",
        featured: false
    },
    {
        title: "Truqha 9 Red",
        category: "Headwear",
        description: "Red Truqha 9 is a signature NYNTH face cap with foam-front texture and adjustable back strap.",
        image: "/src/assets/truqha9-red.png",
        season: "Night Collection",
        featured: false
    },
    {
        title: "Nynth-World Jeff Benz T-Shirt",
        category: "Tees",
        description: "Jeff Benz T-Shirt is a signature NYNTH crewneck t-shirt with state-of-the-art design affiliated with Jeffrey Benson. Made from premium cotton with a relaxed fit for all-day comfort.",
        image: "/src/assets/jeff-benz-tshirt.jpeg",
        season: "Feeling Like Jeffrey Benson",
        featured: false
    },
    {
        title: "Nynth-World Stay Above T-shirt",
        category: "Tees",
        description: "Staying Above is a signature NYNTH crewneck t-shirt designed to stay above the competition. Made from premium cotton with a relaxed fit for all-day comfort.",
        image: "/src/assets/stay-above-tshirt.jpeg",
        season: "Staying Above is a must",
        featured: false
    }
];

async function addLookbooks() {
    try {
        console.log("Adding lookbook items...");

        for (const lookbook of lookbooks) {
            await addDoc(collection(db, "lookbooks"), lookbook);
            console.log(`Added: ${lookbook.title}`);
        }

        console.log("✅ Lookbooks added successfully!");
    } catch (error) {
        console.error("Error:", error);
    }
}

addLookbooks();