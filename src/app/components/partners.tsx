'use client';

import Image from "next/image";

export default function IPartners() {
  return (  
  
    <section className="marquee-speed-partners w-full mx-auto -mt-13 py-5  scale-60">
      <div className="mx-auto max-w-8xl px-6">
        <h1 className="mx-auto w-max grayscale whitespace-nowrap text-center text-[30px] -tracking-[2px] font-semibold bg-linear-to-br from-[#4873FF] via-[#1629A6] to-[#142699] from-5% via-50% to-100% bg-clip-text text-transparent cursor-default hover:grayscale-0 transition-all duration-300 ">
          MS18 Computer Supplies & Services Partners are:
        </h1>
      </div>

      <div className="marquee-pausable blur-[2px] transform-[scaleX(-1)] marquee-fade mt-15 relative left-1/2 w-[119vw] -translate-x-1/2 overflow-hidden opacity-70">
        <div className="marquee-track-reverse">
          <div className="marquee-group gap-12 px-6">
            {[...Array(8)].map((_, i) => {
              const isGlobe = i % 2 === 0;
              return (
                <Image
                  key={`p1-${i}`}
                  src={isGlobe ? "/computerhome.svg" : "/ms18logofull.svg"}
                  alt={isGlobe ? "Partners" : ""}
                  width={80}
                  height={80}
                  className="shrink-0 grayscale hover:grayscale-0 transition-all duration-300"
                  priority={i === 0}
                />
              );
            })}
          </div>
          <div className="marquee-group gap-12 px-6" aria-hidden="true">
            {[...Array(8)].map((_, i) => {
              const isGlobe = i % 2 === 0;
              return (
                <Image
                  key={`p2-${i}`}
                  src={isGlobe ? "/computerhome.svg" : "/ms18logofull.svg"}
                  alt=""
                  width={80}
                  height={80}
                  className="shrink-0 grayscale hover:grayscale-0 transition-all duration-300"
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="marquee-pausable marquee-fade -mt-10 relative left-1/2 w-[110vw] -translate-x-1/2 overflow-hidden">
        <div className="marquee-track-reverse">
          <div className="marquee-group gap-12 px-6">
            {[...Array(8)].map((_, i) => {
              const isGlobe = i % 2 === 0;
              return (
                <Image
                  key={`p3-${i}`}
                  src={isGlobe ? "/computerhome.svg" : "/ms18logofull.svg"}
                  alt={isGlobe ? "Partners" : ""}
                  width={120}
                  height={120}
                  className="shrink-0 grayscale hover:grayscale-0 transition-all duration-300"
                />
              );
            })}
          </div>
          <div className="marquee-group gap-12 px-6" aria-hidden="true">
            {[...Array(8)].map((_, i) => {
              const isGlobe = i % 2 === 0;
              return (
                <Image
                  key={`p4-${i}`}
                  src={isGlobe ? "/computerhome.svg" : "/ms18logofull.svg"}
                  alt=""
                  width={120}
                  height={120}
                  className="shrink-0 grayscale hover:grayscale-0 transition-all duration-300"
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
    
)


}