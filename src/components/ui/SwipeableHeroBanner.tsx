'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

// Custom hook to detect if device supports touch
const useIsTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouchDevice = () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-expect-error - msMaxTouchPoints is not in TypeScript definitions but exists in IE
        navigator.msMaxTouchPoints > 0
      );
    };

    setIsTouchDevice(checkTouchDevice());
  }, []);

  return isTouchDevice;
};

interface HeroBannerProps {
  images?: string[];
  autoSlide?: boolean;
  slideInterval?: number;
}

export default function SwipeableHeroBanner({
  images = ['/hero-banner.png', '/hero-banner-promo.png'],
  autoSlide = true,
  slideInterval = 7500,
}: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorScrollRef = useRef<HTMLDivElement>(null);

  // Detect if device supports touch
  const isTouchDevice = useIsTouchDevice();

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Auto slide functionality - БЕЗ управления прогрессом
  useEffect(() => {
    if (autoSlide && images.length > 1) {
      intervalRef.current = setInterval(() => {
        nextSlide();
      }, slideInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoSlide, slideInterval, images.length]); // БЕЗ currentIndex

  // Отдельный useEffect для управления прогрессом
  useEffect(() => {
    if (autoSlide && images.length > 1) {
      // Сбросить прогресс
      setProgress(0);

      // Очистить предыдущий интервал прогресса
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }

      // Небольшая задержка для гарантии сброса состояния
      const resetTimeout = setTimeout(() => {
        // Progress update interval (60fps for smooth animation)
        const progressInterval = 16; // ~60fps
        const totalSteps = slideInterval / progressInterval;
        let currentStep = 0;

        progressRef.current = setInterval(() => {
          currentStep++;
          const newProgress = (currentStep / totalSteps) * 100;
          setProgress(newProgress);

          if (currentStep >= totalSteps) {
            if (progressRef.current) {
              clearInterval(progressRef.current);
            }
          }
        }, progressInterval);
      }, 50);

      return () => {
        clearTimeout(resetTimeout);
        if (progressRef.current) {
          clearInterval(progressRef.current);
        }
      };
    }
  }, [currentIndex, autoSlide, slideInterval, images.length]); // С currentIndex для перезапуска анимации

  // Clear interval on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setDragOffset(0);
    setCurrentIndex(prevIndex => {
      const nextIndex = (prevIndex + 1) % images.length;
      return nextIndex;
    });
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setDragOffset(0);
    setCurrentIndex(prevIndex => {
      const nextIndex = (prevIndex - 1 + images.length) % images.length;
      // Убрать setProgress(0) отсюда
      return nextIndex;
    });
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setDragOffset(0);
    setCurrentIndex(index);

    // Auto-scroll to make the selected indicator visible
    setTimeout(() => {
      if (indicatorScrollRef.current) {
        const scrollContainer = indicatorScrollRef.current;
        const indicators = scrollContainer.querySelectorAll('button');
        const targetIndicator = indicators[index];

        if (targetIndicator) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const indicatorRect = targetIndicator.getBoundingClientRect();

          // Calculate if indicator is outside visible area
          const isOutsideLeft = indicatorRect.left < containerRect.left;
          const isOutsideRight = indicatorRect.right > containerRect.right;

          if (isOutsideLeft || isOutsideRight) {
            // Calculate scroll position to center the indicator
            const indicatorCenter = targetIndicator.offsetLeft + targetIndicator.offsetWidth / 2;
            const containerCenter = scrollContainer.offsetWidth / 2;
            const scrollPosition = indicatorCenter - containerCenter;

            scrollContainer.scrollTo({
              left: Math.max(0, scrollPosition),
              behavior: 'smooth',
            });
          }
        }
      }
    }, 100); // Small delay to ensure DOM is updated

    setTimeout(() => setIsTransitioning(false), 500);
  };

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    if (isTransitioning) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !isDragging || isTransitioning) return;
    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - touchStart;
    const containerWidth = containerRef.current?.offsetWidth || 0;
    const maxOffset = containerWidth * 0.3; // Limit drag to 30% of container width

    setTouchEnd(currentX);
    setDragOffset(Math.max(-maxOffset, Math.min(maxOffset, diff)));
  };

  const onTouchEnd = () => {
    if (!touchStart || !isDragging) return;

    setIsDragging(false);
    const distance = touchStart - (touchEnd || touchStart);
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && images.length > 1) {
      nextSlide();
    } else if (isRightSwipe && images.length > 1) {
      prevSlide();
    } else {
      // Snap back to original position
      setDragOffset(0);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Mouse handlers for desktop
  const onMouseDown = (e: React.MouseEvent) => {
    if (isTransitioning) return;
    setTouchEnd(null);
    setTouchStart(e.clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!touchStart || !isDragging || isTransitioning) return;
    const currentX = e.clientX;
    const diff = currentX - touchStart;
    const containerWidth = containerRef.current?.offsetWidth || 0;
    const maxOffset = containerWidth * 0.3; // Limit drag to 30% of container width

    setTouchEnd(currentX);
    setDragOffset(Math.max(-maxOffset, Math.min(maxOffset, diff)));
  };

  const onMouseUp = () => {
    if (!touchStart || !isDragging) return;

    setIsDragging(false);
    const distance = touchStart - (touchEnd || touchStart);
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && images.length > 1) {
      nextSlide();
    } else if (isRightSwipe && images.length > 1) {
      prevSlide();
    } else {
      // Snap back to original position
      setDragOffset(0);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div className="relative w-full overflow-x-hidden">
      {/* Main banner container */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-lg bg-white z-0">
        {/* Main image container */}
        <div
          ref={containerRef}
          className={`relative w-full select-none ${
            isTouchDevice ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
          }`}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          {...(isTouchDevice && {
            onMouseDown: onMouseDown,
            onMouseMove: onMouseMove,
            onMouseUp: onMouseUp,
            onMouseLeave: () => {
              setTouchStart(null);
              setTouchEnd(null);
              setIsDragging(false);
              setDragOffset(0);
            },
          })}
        >
          <div
            className="flex w-full"
            style={{
              transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
              transition: isDragging ? 'none' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {images.map((image, index) => (
              <div key={index} className="w-full flex-shrink-0">
                <Image
                  src={image}
                  alt={`Hero Banner ${index + 1}`}
                  width={1200}
                  height={600}
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 90vw, (max-width: 1024px) 80vw, 75vw"
                  className="w-full h-auto object-contain md:object-cover max-h-[300px] sm:max-h-[300px] md:max-h-[400px] lg:max-h-[500px] xl:max-h-[600px]"
                  priority={index === 0}
                  style={{ aspectRatio: 'auto' }}
                />
              </div>
            ))}
          </div>

          {/* Navigation arrows - only show if multiple images and hide on mobile */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                disabled={isTransitioning}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 hover:text-gray-900 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 ease-out disabled:opacity-50 hover:scale-110 active:scale-95 z-10 backdrop-blur-sm hidden md:block"
                aria-label="Previous image"
              >
                <svg
                  className="w-5 h-5 transition-transform duration-200 hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                onClick={nextSlide}
                disabled={isTransitioning}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 hover:text-gray-900 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 ease-out disabled:opacity-50 hover:scale-110 active:scale-95 z-10 backdrop-blur-sm hidden md:block"
                aria-label="Next image"
              >
                <svg
                  className="w-5 h-5 transition-transform duration-200 hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bar indicator positioned UNDER the banner - only show if multiple images */}
      {images.length > 1 && (
        <div
          ref={indicatorScrollRef}
          className="w-full max-w-full overflow-x-auto scrollbar-none mt-4 px-4 md:overflow-visible"
        >
          <div className="flex justify-center space-x-2 min-w-max">
            {images.map((_, index) => {
              // On mobile, show max 4 indicators in a sliding window around current index
              const maxMobileIndicators = 4;

              // Calculate sliding window for mobile
              let showOnMobile = true;
              if (images.length > maxMobileIndicators) {
                const halfWindow = Math.floor(maxMobileIndicators / 2);
                let startIndex = Math.max(0, currentIndex - halfWindow);
                const endIndex = Math.min(images.length - 1, startIndex + maxMobileIndicators - 1);

                // Adjust if we're near the end
                if (endIndex - startIndex < maxMobileIndicators - 1) {
                  startIndex = Math.max(0, endIndex - maxMobileIndicators + 1);
                }

                showOnMobile = index >= startIndex && index <= endIndex;
              }

              return (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  disabled={isTransitioning}
                  className={`relative rounded-sm transition-all duration-300 ease-out active:scale-95 disabled:opacity-50 overflow-hidden ${
                    showOnMobile ? 'block' : 'hidden md:block'
                  } ${
                    index === currentIndex
                      ? 'w-16 md:w-48 h-1 bg-gray-300 shadow-lg shadow-black/20'
                      : 'w-16 md:w-48 h-1 bg-gray-400 hover:bg-gray-500 hover:shadow-md hover:shadow-black/10'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                >
                  {index === currentIndex && autoSlide && (
                    <div
                      key={`progress-${currentIndex}-${progress}`}
                      className="absolute top-0 left-0 h-full bg-blue-600 rounded-sm transition-all duration-75 ease-linear"
                      style={{
                        width: `${progress}%`,
                        transformOrigin: 'left center',
                      }}
                    />
                  )}
                  {index === currentIndex && !autoSlide && (
                    <div className="absolute inset-0 rounded-sm bg-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
