import { useEffect, useState } from 'react';
import { FaWhatsapp, FaArrowUp } from 'react-icons/fa';
import { AnimatePresence, motion } from 'framer-motion';

const FloatingActions = () => {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">
      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="Back to top"
            className="w-12 h-12 rounded-full bg-white text-dark shadow-lg hover:bg-primary hover:text-white transition flex items-center justify-center border border-gray-200 cursor-pointer"
          >
            <FaArrowUp />
          </motion.button>
        )}
      </AnimatePresence>

      <a
        href="https://wa.me/919824345041"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="w-14 h-14 rounded-full bg-[#25D366] text-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
      >
        <FaWhatsapp size={26} />
      </a>
    </div>
  );
};

export default FloatingActions;
