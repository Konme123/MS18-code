"use client";

import { useEffect, useRef, useState } from "react";

export type ServiceCard = {
  title: string;
  description: string;
};

export default function SCarousel({ cards }: { cards: ServiceCard[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [scrollHeight, setScrollHeight] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    const scroller = scrollerRef.current;
    if (!container || !scroller) return;

    const calculateHeights = () => {
      const maxScroll = scroller.scrollWidth - scroller.clientWidth;
      setScrollHeight(maxScroll);
      return maxScroll;
    };

    // Initial calculation
    calculateHeights();

    const handleScroll = () => {
      const rect = container.getBoundingClientRect();
      const maxScroll = scroller.scrollWidth - scroller.clientWidth;
      
      // When container reaches top of viewport, start horizontal scroll
      // Keep pinned until we've scrolled through all cards
      if (rect.top <= 0 && rect.top >= -maxScroll) {
        // Pin by setting container to full viewport and translate scroll
        const horizontalScroll = Math.min(maxScroll, Math.abs(rect.top));
        scroller.scrollLeft = horizontalScroll;
      } else if (rect.top < -maxScroll) {
        // Scrolled past all cards, keep at end
        scroller.scrollLeft = maxScroll;
      } else if (rect.top > 0) {
        // Above viewport, reset to start
        scroller.scrollLeft = 0;
      }
    };

    const handleResize = () => {
      calculateHeights();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ 
        height: `calc(100vh + ${scrollHeight}px)`,
        minHeight: "100vh"
      }}
    >
      <div 
        className="sticky top-0 h-full flex items-center overflow-hidden"
      >
        <div
          ref={scrollerRef}
          className="flex gap-4 overflow-x-hidden py-2 px-6 md:px-0"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {cards.map((card) => (
            <div
              key={card.title}
              className="shrink-0 w-[85%] sm:w-[45%] md:w-[30%] flex flex-col items-center"
            >
              <div className="w-full max-w-sm">
                <div className="rounded-xl h-56 w-full bg-purple-900 mx-auto" />

                <div className="pt-3 text-center">
                  <h3 className="text-[12px] font-semibold text-slate-700">
                    {card.title}
                  </h3>
                  <p className="mt-2 mx-auto text-[10px] leading-4 text-slate-500">
                    {card.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}