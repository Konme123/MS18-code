import Link from "next/link";
import Image from "next/image";
import Services from "./components/services";
import About from "./components/about";

export default function Home() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
{/* 
      <div className="relativepointer-events-none absolute inset-0 z-10  -translate-x-79 translate-y-85 ">
        <Image
          src="/lines2.svg"
          alt=""
          width={600}
          height={600}
          className="object-contain"
        />
      </div> */}

      <section className="relative overflow-visible w-full" id="home">
        {/* <div className="pointer-events-none absolute inset-0 z-0 -translate-y-15 -translate-x-15">
          <Image
            src="/background.svg"
            alt=""
            fill
            priority
            className="object-contain"
            sizes="100vw"
          />
        </div> */}
        
        <div className="relative z-10 -mt-20 pt-10 mx-auto grid max-w-6xl grid-cols-1 items-center justify-center gap-10 px-6 md:grid-cols-[1fr_1.25fr]  h-170">
          <div className="pt-5">
            
            <h1 className="-mt-25 w-[200%] text-[clamp(4.2rem,5.6vw,3.75rem)] font-bold leading-[0.92] tracking-tighter text-slate-900  ">
              <span className="block  pt-2 bg-linear-to-r from-[#984CD3] via-[#522BC9] to-[#411563] to-90%  text-transparent bg-clip-text ">
                <span className="font-miama font-thin inline-block align-baseline text-[2.9em] leading-[0.55]">W</span>
                <span className="-ml-1">e</span>
                <span className="ml-2">Focus on</span>
              </span>
               
              <span className="block -mt-[0.20em]">
                <span className="text-[#522BC9]">your</span>
                
                <span className="text-blue-600"> Computers</span>
              </span>
              <span className="block mt-[0.15em] text-blue-700">Needs.</span>
            </h1>

            <div className="mt-8 flex flex-col items-start gap-3">
              <p className="mt-9 font-semibold max-w-xl text-lg leading-8 bg-linear-to-r from-[#984CD3] via-[#522BC9] to-[#411563] to-90% inline-block text-transparent bg-clip-text">
            MS18 Computer Supplies & Services</p>
              
              <Link
                href="/contact"
                className="opacity-65 hover:opacity-100 group inline-flex h-7 items-center justify-center gap-1 rounded-full border border-black bg-white px-3 text-xs font-medium text-slate-900 shadow-sm transition hover:bg-slate-50"
              >
                <span>Find out more below.</span>
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4 text-[#404040]"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.7a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
           </div>
          </div>

          {/* Image Right */}

          <div className="relative w-[135%] h-[80%] -translate-y-19 -translate-x-5  ">
            <div className="absolute -inset-0rounded-[40px]" />
            <div className=" relative mx-auto w-full max-w-[960px] md:max-w-[920px]">
            
              <Image
                src="/computerhome.svg"
                alt="Computer Servicing"
                width={550}
                height={550}
                className="h-auto w-full object-contain"
                priority
              />

            </div>
          </div>
        </div>
      </section>

      <div>
          
          <Services />

      </div>

      <div>
          
          <About />

      </div>

      
      <section id="contact" className="border-t border-slate-100 bg-slate-50/50 scroll-mt-24">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="rounded-3xl border border-slate-100 bg-linear-to-br from-purple-50 via-white to-blue-50 px-8 py-12">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Contact</h2>
            <p className="mt-3 max-w-2xl text-slate-600">
              Tell us what you need help with. We’ll reply with availability and a quick estimate.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Get In Touch</h3>
              <p className="mt-2 text-slate-600">Have a question or need service? Contact us today!</p>
              <div className="mt-6 space-y-2 text-slate-600">
                <p>
                  <strong className="text-slate-900">Phone:</strong> (123) 456-7890
                </p>
                <p>
                  <strong className="text-slate-900">Email:</strong> info@computerservicing.com
                </p>
                <p>
                  <strong className="text-slate-900">Address:</strong> 123 Tech Street, Computer City, CC 12345
                </p>
              </div>
            </div>

            <form className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700" htmlFor="name">Name</label>
                <input type="text" id="name" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-300 focus:ring-2 focus:ring-purple-100" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700" htmlFor="email">Email</label>
                <input type="email" id="email" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-300 focus:ring-2 focus:ring-purple-100" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700" htmlFor="message">Message</label>
                <textarea id="message" rows={4} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-slate-300 focus:ring-2 focus:ring-purple-100"></textarea>
              </div>
              <button type="submit" className="inline-flex h-11 items-center justify-center rounded-full bg-slate-900 px-6 text-sm font-semibold text-white hover:bg-slate-800">Send Message</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
