import React, { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { addSubscriber } from "../../api/firebaseFunctions";
import toast from "react-hot-toast";
import SubscriptionModal from "../common/SubscriptionModal";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [subscribedEmail, setSubscribedEmail] = useState("");
  const [hasSubscribed, setHasSubscribed] = useState(false);

  useEffect(() => {
    // Check if user has already subscribed
    const subscribed = localStorage.getItem('newsletter_subscribed');
    if (subscribed) {
      setHasSubscribed(true);
      setSubscribedEmail(subscribed);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await addSubscriber(email);

      if (result.success) {
        // Save to localStorage
        localStorage.setItem('newsletter_subscribed', email);
        setSubscribedEmail(email);
        setHasSubscribed(true);
        setShowModal(true);
        setEmail("");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Newsletter signup error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  // If user already subscribed, show thank you message
  if (hasSubscribed) {
    return (
      <section className="section-pad bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-space text-3xl md:text-4xl font-bold tracking-tight mb-4">
            You're already subscribed! ✅
          </h2>
          <p className="font-inter text-gray-600 max-w-xl mx-auto">
            We'll keep you updated at <span className="font-medium text-black">{subscribedEmail}</span>
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="section-pad bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-space text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Stay in the loop
          </h2>
          <p className="font-inter text-gray-600 mb-8 max-w-xl mx-auto">
            Be the first to know about new drops.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-5 py-3 rounded-full border border-gray-300 font-inter text-sm focus:outline-none focus:border-black transition-colors"
              required
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Subscribing...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Subscribe
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-gray-500 mt-4">
            By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
          </p>
        </div>
      </section>

      <SubscriptionModal
        isOpen={showModal}
        onClose={handleModalClose}
        email={subscribedEmail}
      />
    </>
  );
}
