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

      <main className="w-full pt-[68px]">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[200px] md:auto-rows-[300px] gap-0">
             {[...Array(8)].map((_, i) => (
               <div key={i} className={`${getGridSpan(i)} bg-gray-50 animate-pulse border-white border-[0.5px]`}></div>
             ))}
          </div>
        ) : (
          /* COLLAGE GRID - NO SPACE, STUPIDLY CLOSE */
          <section className="w-full bg-white">
            <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[250px] md:auto-rows-[400px] lg:auto-rows-[500px] gap-0">
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

            {/* Empty state fallback */}
            {lookbooks.length === 0 && (
              <div className="h-screen flex items-center justify-center p-8 bg-gray-50">
                <p className="text-[11px] tracking-[0.2em] font-bold text-gray-400 uppercase">
                  Imagery loading...
                </p>
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}