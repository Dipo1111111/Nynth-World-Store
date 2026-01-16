import React from "react";
import { Truck, Shield, RefreshCw, CreditCard } from "lucide-react";

export default function TrustSignals() {
  const signals = [
    {
      icon: <Truck size={24} />,
      title: "Free Shipping",
      description: "On orders over ₦50,000",
    },
    {
      icon: <RefreshCw size={24} />,
      title: "Easy Returns",
      description: "30-day return policy",
    },
    {
      icon: <CreditCard size={24} />,
      title: "Secure Payment",
      description: "SSL encrypted",
    },
  ];

  return (
    <section className="section-pad border-y border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {signals.map((signal, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-gray-50 text-black">
                  {signal.icon}
                </div>
              </div>
              <h3 className="font-inter font-semibold mb-1">{signal.title}</h3>
              <p className="text-sm text-gray-600">{signal.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}