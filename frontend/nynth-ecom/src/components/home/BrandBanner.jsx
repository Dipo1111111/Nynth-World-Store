import React from "react";
import { Award, Globe, Leaf } from "lucide-react";

export default function BrandBanner() {
  const values = [
    {
      icon: <Award size={24} />,
      title: "Premium Craftsmanship",
      description: "Every stitch matters"
    },
    {
      icon: <Leaf size={24} />,
      title: "Sustainable Materials",
      description: "Ethically sourced"
    },
    {
      icon: <Globe size={24} />,
      title: "Global Community",
      description: "Worldwide countries"
    }
  ];

  return (
    <section className="section-pad bg-black text-white">
      <div className="max-w-6xl mx-auto text-center">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {values.map((value, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="mb-4 p-3 rounded-full border border-white/20">
                {value.icon}
              </div>
              <h3 className="font-space text-xl font-bold mb-2">{value.title}</h3>
              <p className="font-inter text-gray-400 text-sm">{value.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="font-space text-2xl md:text-3xl leading-snug max-w-3xl mx-auto">
            NYNTH WORLD — Minimal streetwear built with intention. Limited drops. 
            Premium materials. Designed for the urban minimalist.
          </p>
        </div>
      </div>
    </section>
  );
}