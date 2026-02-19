import { useAuth } from "../context/AuthContext";

const ThankYou = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("ref");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Trigger premium confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-50">
          <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-gray-50 rounded-full blur-3xl" />
          <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-gray-50 rounded-full blur-3xl" />
        </div>

        <div className={`max-w-xl w-full text-center relative z-10 transition-all duration-1000 transform ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
            <img src={logo} alt="NYNTH" className="h-12 w-auto invert brightness-0 invert" />
          </div>

          <h1 className="font-space text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Order Confirmed
          </h1>

          <p className="text-gray-500 font-inter text-lg mb-8 leading-relaxed">
            Thank you for shopping with NYNTH. Your order has been successfully placed and is now being processed.
          </p>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-10 text-left">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                <span className="text-gray-500 text-sm">Order Reference</span>
                <span className="font-space font-bold text-lg">{reference || "N/A"}</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-500">
                <Mail size={16} className="mt-0.5 shrink-0" />
                <p>An email confirmation has been sent to your inbox with full order details.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {currentUser && (
              <Link
                to="/account"
                className="px-8 py-4 rounded-xl border border-gray-200 font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                View Order
              </Link>
            )}
            <Link
              to="/shop"
              className="px-8 py-4 rounded-xl bg-black text-white font-medium hover:opacity-90 transition-opacity shadow-lg flex items-center justify-center gap-2 group"
            >
              <ShoppingBag size={18} />
              Continue Shopping
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ThankYou;
