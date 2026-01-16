import React from "react";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-gray-50 to-white">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"></div>
      </div>
      
      <div className="relative section-pad min-h-[90vh] flex flex-col justify-center items-center text-center">
        <div className="max-w-4xl mx-auto">
          <span className="font-inter text-sm font-medium tracking-wider text-gray-600 uppercase mb-6 block">
            NEED MORE GBP/USD Collection — Now Live
          </span>
          
          <h1 className="hero-title text-black mb-8 leading-[1.1]">
            Minimalism<br className="hidden md:block" /> meets street presence
          </h1>
          
          <p className="lead mb-10 text-gray-700 max-w-2xl mx-auto text-lg">
            Crafted from heavyweight materials with precision tailoring. 
            Each piece is designed for the urban minimalist who values substance over flash.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/shop" 
              className="btn-primary text-center px-8 py-4 text-base font-medium tracking-wide"
            >
              Shop Collection
            </Link>
            <Link 
              to="/lookbook" 
              className="rounded-full px-8 py-4 border-2 border-black text-black font-inter text-base font-medium hover:bg-black hover:text-white transition-all"
            >
              View Lookbook
            </Link>
          </div>
        </div>
        
        {/* Stats */}
        {/* <div className="absolute bottom-10 left-0 right-0">
          <div className="max-w-5xl mx-auto flex justify-center gap-12 text-center">
            <div>
              <div className="font-space text-2xl font-bold">200K+</div>
              <div className="font-inter text-sm text-gray-600">Community</div>
            </div>
            <div>
              <div className="font-space text-2xl font-bold">4.9★</div>
              <div className="font-inter text-sm text-gray-600">Reviews</div>
            </div>
            <div>
              <div className="font-space text-2xl font-bold">24/7</div>
              <div className="font-inter text-sm text-gray-600">Support</div>
            </div>
          </div>
        </div> */}
      </div>
    </section>
  );
}