// src/pages/home.jsx - REMOVE Lookbook section
import React from "react";
import Hero from "../components/home/Hero.jsx";
import FeaturedCollections from "../components/home/FeaturedCollections.jsx";
import NewArrivals from "../components/home/NewArrivals.jsx";
import BrandBanner from "../components/home/BrandBanner.jsx";
import TrustSignals from "../components/home/TrustSignals.jsx";
import Newsletter from "../components/home/NewsLetter.jsx";
import Header from "../components/home/Header.jsx";
import Footer from "../components/home/Footer.jsx";
import SEO from "../components/SEO";

export default function Home() {
  return (
    <div className="bg-white text-black">
      <SEO />
      <Header />
      <Hero />
      <FeaturedCollections />
      <NewArrivals />
      <BrandBanner />
      <TrustSignals />
      <Newsletter />
      <Footer />
    </div>
  );
}