import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaFire, FaRocket, FaBolt, FaCrown } from 'react-icons/fa';
import { sliderService } from '../services';

const iconMap = {
  FaFire,
  FaRocket,
  FaBolt,
  FaCrown
};

const HeroSlider = () => {
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imgSrcs, setImgSrcs] = useState({});

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const { data } = await sliderService.getAll();
        setSlides(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch sliders', err);
      }
    };
    fetchSlides();
  }, []);

  const nextSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 4500);

    return () => clearInterval(timer);
  }, [nextSlide, isPaused, slides.length]);

  const handleImageError = (slideId, fallbackUrl) => {
    if (!fallbackUrl) return;
    setImgSrcs((prev) => ({
      ...prev,
      [slideId]: fallbackUrl,
    }));
  };

  if (slides.length === 0) return null;

  return (
    <section
      className="relative bg-gradient-to-r from-dark via-dark-light to-dark overflow-hidden group min-h-[560px] sm:min-h-[540px] md:min-h-[580px] lg:min-h-[620px] flex items-center select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {slides.map((slide, index) => {
        const isActive = index === currentSlide;
        const IconComponent = iconMap[slide.tagIcon] || FaFire;
        const activeImgSrc = imgSrcs[slide._id] || slide.image;

        return (
          <div
            key={slide._id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out bg-gradient-to-r from-dark via-dark-light to-dark ${
              isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full py-8 pt-10 pb-16 sm:py-16 md:py-20 lg:py-24 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
              {/* Text Content */}
              <div className={`flex-1 text-white text-center md:text-left transition-all duration-700 transform ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
                {/* Badge */}
                <div className="inline-flex flex-wrap items-center justify-center md:justify-start gap-1.5 sm:gap-2 px-2.5 py-1 rounded-full border border-white/10 text-[10px] sm:text-xs font-semibold tracking-wide uppercase mb-3 sm:mb-6 backdrop-blur-md bg-white/5 transition-all">
                  <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 rounded-full ${slide.badgeColor}`}>
                    <IconComponent className="text-[10px] sm:text-xs animate-pulse" />
                    {slide.tag}
                  </span>
                  <span className="text-gray-300 font-medium normal-case hidden xs:inline">Raj Electronics Exclusive</span>
                </div>

                {/* Heading */}
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-2 sm:mb-4">
                  {slide.title}
                  {slide.highlight && (
                    <span className="block text-primary text-xl sm:text-3xl md:text-4xl lg:text-5xl mt-1 sm:mt-2 font-bold">
                      {slide.highlight}
                    </span>
                  )}
                </h1>

                {/* Description */}
                {slide.description && (
                  <p className="text-gray-300 text-xs sm:text-base md:text-lg mb-4 sm:mb-8 max-w-xl mx-auto md:mx-0 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                    {slide.description}
                  </p>
                )}

                {/* Call to Actions */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-4">
                  {slide.primaryBtnText && slide.primaryBtnLink && (
                    <Link
                      to={slide.primaryBtnLink}
                      className="bg-primary hover:bg-primary-dark text-white font-bold px-5 py-2.5 sm:px-8 sm:py-4 rounded-full shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200 text-xs sm:text-sm md:text-base"
                    >
                      {slide.primaryBtnText}
                    </Link>
                  )}
                  {slide.secondaryBtnText && slide.secondaryBtnLink && (
                    <Link
                      to={slide.secondaryBtnLink}
                      className="border border-white/40 hover:border-white text-white hover:bg-white/10 font-semibold px-5 py-2.5 sm:px-8 sm:py-4 rounded-full backdrop-blur-sm transition-all duration-200 text-xs sm:text-sm md:text-base"
                    >
                      {slide.secondaryBtnText}
                    </Link>
                  )}
                </div>
              </div>

              {/* Slide Image */}
              <div className={`flex-1 w-full max-w-[260px] sm:max-w-md md:max-w-lg lg:max-w-xl transition-all duration-700 delay-100 transform ${isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
                <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/10 group-hover:scale-[1.01] transition-transform duration-500">
                  <img
                    src={activeImgSrc}
                    alt={slide.title}
                    onError={() => handleImageError(slide._id, null)}
                    className="w-full h-[160px] sm:h-[280px] md:h-[380px] lg:h-[420px] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-transparent to-transparent md:hidden" />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {slides.length > 1 && (
        <>
          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-12 md:h-12 rounded-full bg-black/50 hover:bg-primary text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 opacity-80 hover:opacity-100 shadow-xl border border-white/15 cursor-pointer"
          >
            <FaChevronLeft className="text-sm md:text-xl" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-12 md:h-12 rounded-full bg-black/50 hover:bg-primary text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 opacity-80 hover:opacity-100 shadow-xl border border-white/15 cursor-pointer"
          >
            <FaChevronRight className="text-sm md:text-xl" />
          </button>

          {/* Bottom Indicators / Dots */}
          <div className="absolute bottom-3 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/15">
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
        </>
      )}
    </section>
  );
};

export default HeroSlider;
