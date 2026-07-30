import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaFire, FaRocket, FaBolt, FaCrown } from 'react-icons/fa';

import heroElectronics from '../assets/hero-electronics.svg';
import heroTv from '../assets/hero-tv.svg';
import heroAc from '../assets/hero-ac.svg';
import heroFridge from '../assets/hero-fridge.svg';

const slides = [
  {
    id: 1,
    tag: 'Active Offer',
    tagIcon: FaFire,
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    title: 'Mega Festival Sale',
    highlight: 'Up to 40% OFF',
    description: 'Upgrade your home with latest Smart TVs, Refrigerators, ACs, and Washing Machines at unbeatable prices. Limited period deals!',
    primaryBtnText: 'Shop Active Offers',
    primaryBtnLink: '/products',
    secondaryBtnText: 'Browse Categories',
    secondaryBtnLink: '/categories',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1000&auto=format&fit=crop&q=80',
    localFallback: heroElectronics,
  },
  {
    id: 2,
    tag: 'Trending Launch',
    tagIcon: FaRocket,
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    title: 'Next-Gen 4K OLED TVs',
    highlight: 'Cinematic Experience',
    description: 'Immerse yourself in ultra-vivid colors, deep contrast, and AI sound enhancement with top branded OLED & QLED displays.',
    primaryBtnText: 'Explore Smart TVs',
    primaryBtnLink: '/products?category=Televisions',
    secondaryBtnText: 'View Trending',
    secondaryBtnLink: '/products?sort=latest',
    image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=1000&auto=format&fit=crop&q=80',
    localFallback: heroTv,
  },
  {
    id: 3,
    tag: 'Hot Deal',
    tagIcon: FaBolt,
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    title: '5-Star Smart Air Conditioners',
    highlight: 'Instant Cooling Savings',
    description: 'Beat the heat with heavy-duty inverter ACs featuring fast cooling, dust filters, and zero maintenance warranty.',
    primaryBtnText: 'Grab AC Deals',
    primaryBtnLink: '/products?category=Air%20Conditioners',
    secondaryBtnText: 'Best Sellers',
    secondaryBtnLink: '/products?bestSelling=true',
    image: 'https://images.unsplash.com/photo-1631545806606-22dadf3e8b0a?w=1000&auto=format&fit=crop&q=80',
    localFallback: heroAc,
  },
  {
    id: 4,
    tag: 'Trending Launch',
    tagIcon: FaCrown,
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    title: 'Smart Home Refrigerators',
    highlight: 'Advanced Twin Cooling',
    description: 'Convertible multi-door double refrigerators with digital inverter tech and door cooling to keep food fresh twice as long.',
    primaryBtnText: 'Discover Refrigerators',
    primaryBtnLink: '/products?category=Refrigerators',
    secondaryBtnText: 'View All Deals',
    secondaryBtnLink: '/products',
    image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=1000&auto=format&fit=crop&q=80',
    localFallback: heroFridge,
  },
];

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imgSrcs, setImgSrcs] = useState({});

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 4500);

    return () => clearInterval(timer);
  }, [nextSlide, isPaused]);

  const handleImageError = (slideId, fallbackUrl) => {
    setImgSrcs((prev) => ({
      ...prev,
      [slideId]: fallbackUrl,
    }));
  };

  // Touch Swipe handlers for mobile screens
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 40;
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
  };

  return (
    <section
      className="relative bg-gradient-to-r from-dark via-dark-light to-dark overflow-hidden group min-h-[580px] sm:min-h-[560px] md:min-h-[580px] lg:min-h-[620px] flex items-center select-none touch-pan-y"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {slides.map((slide, index) => {
        const isActive = index === currentSlide;
        const IconComponent = slide.tagIcon;
        const activeImgSrc = imgSrcs[slide.id] || slide.image;

        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out bg-gradient-to-r from-dark via-dark-light to-dark ${
              isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full py-10 sm:py-14 md:py-16 lg:py-20 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 md:gap-10">
              {/* Text Content */}
              <div className={`flex-1 text-white transition-all duration-700 transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-white/10 text-[11px] sm:text-xs font-semibold tracking-wide uppercase mb-3 sm:mb-6 backdrop-blur-md bg-white/5 transition-all">
                  <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full ${slide.badgeColor}`}>
                    <IconComponent className="text-[11px] sm:text-xs animate-pulse" />
                    {slide.tag}
                  </span>
                  <span className="text-gray-300 font-medium normal-case hidden xs:inline">Raj Electronics Exclusive</span>
                </div>

                {/* Heading */}
                <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-2 sm:mb-4">
                  {slide.title}
                  <span className="block text-primary text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl mt-1 sm:mt-2 font-bold">
                    {slide.highlight}
                  </span>
                </h1>

                {/* Description */}
                <p className="text-gray-300 text-xs sm:text-base md:text-lg mb-5 sm:mb-8 max-w-xl line-clamp-2 sm:line-clamp-3 leading-relaxed">
                  {slide.description}
                </p>

                {/* Call to Actions */}
                <div className="flex flex-row flex-wrap items-center gap-2.5 sm:gap-4">
                  <Link
                    to={slide.primaryBtnLink}
                    className="bg-primary hover:bg-primary-dark text-white font-bold px-5 py-2.5 sm:px-8 sm:py-4 rounded-full shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200 text-xs sm:text-sm md:text-base text-center"
                  >
                    {slide.primaryBtnText}
                  </Link>
                  <Link
                    to={slide.secondaryBtnLink}
                    className="border-2 border-white/40 hover:border-white text-white hover:bg-white/10 font-semibold px-5 py-2.5 sm:px-8 sm:py-4 rounded-full backdrop-blur-sm transition-all duration-200 text-xs sm:text-sm md:text-base text-center"
                  >
                    {slide.secondaryBtnText}
                  </Link>
                </div>
              </div>

              {/* Slide Image */}
              <div className={`flex-1 w-full max-w-[280px] xs:max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl transition-all duration-700 delay-100 transform ${isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 group-hover:scale-[1.01] transition-transform duration-500">
                  <img
                    src={activeImgSrc}
                    alt={slide.title}
                    onError={() => handleImageError(slide.id, slide.localFallback)}
                    className="w-full h-[180px] xs:h-[220px] sm:h-[280px] md:h-[360px] lg:h-[420px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent to-transparent md:hidden" />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        aria-label="Previous Slide"
        className="absolute left-2 sm:left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-black/50 hover:bg-primary text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 opacity-80 hover:opacity-100 shadow-xl border border-white/15 cursor-pointer"
      >
        <FaChevronLeft className="text-sm sm:text-lg md:text-xl" />
      </button>
      <button
        onClick={nextSlide}
        aria-label="Next Slide"
        className="absolute right-2 sm:right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-black/50 hover:bg-primary text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 opacity-80 hover:opacity-100 shadow-xl border border-white/15 cursor-pointer"
      >
        <FaChevronRight className="text-sm sm:text-lg md:text-xl" />
      </button>

      {/* Bottom Indicators / Dots */}
      <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/15">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              currentSlide === idx
                ? 'w-6 sm:w-9 h-2.5 sm:h-3 bg-primary'
                : 'w-2.5 sm:w-3 h-2.5 sm:h-3 bg-white/40 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;
