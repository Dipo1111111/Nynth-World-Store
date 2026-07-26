// src/pages/lookbook.jsx - COLLAGE GRID VERSION
import React, { useState, useEffect } from "react";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import { fetchLookbooks } from "../../api/firebaseFunctions";
import SEO from "../SEO";

export default function Lookbook() {
  const [lookbooks, setLookbooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load lookbooks
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const lookbookData = await fetchLookbooks();
        setLookbooks(lookbookData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Helper to determine item size for collage effect
  // We'll use a semi-random but deterministic pattern based on index
  const getGridSpan = (index) => {
    const pattern = [
      "col-span-2 row-span-2", // Large
      "col-span-1 row-span-1", // Small
      "col-span-1 row-span-2", // Tall
      "col-span-2 row-span-1", // Wide
      "col-span-1 row-span-1", // Small
      "col-span-1 row-span-1", // Small
    ];
    return pattern[index % pattern.length];
  };

  return (
    <div className="min-h-screen bg-white text-black font-inter flex flex-col">
      <SEO
        title="Lookbook | NYNTH"
        description="Explore our latest collections. Minimal streetwear collage."
        url="/lookbook"
      />
      <Header />

      <main className="w-full">
        {/* Section Title */}
        <div className="section-pad py-12 md:py-16 text-center">
          <span className="text-[9px] md:text-[10px] tracking-[0.4em] text-gray-400 uppercase block mb-4">
            NYNTH WORLD
          </span>
          <h1 className="hero-title text-black">LOOKBOOK</h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 grid-flow-dense auto-rows-[400px] md:auto-rows-[350px] gap-0">
             {[...Array(8)].map((_, i) => (
               <div key={i} className={`${getGridSpan(i)} bg-gray-50 animate-pulse border-white border-[0.5px]`}></div>
             ))}
          </div>
        ) : (
          /* COLLAGE GRID - NO SPACE, STUPIDLY CLOSE */
          <section className="w-full bg-white">
            <div className="grid grid-cols-2 md:grid-cols-4 grid-flow-dense auto-rows-[400px] md:auto-rows-[400px] lg:auto-rows-[500px] gap-0">
              {lookbooks.map((look, index) => (
                <div 
                  key={look.id} 
                  className={`${getGridSpan(index)} relative overflow-hidden`}
                >
                  <img
                    src={look.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}