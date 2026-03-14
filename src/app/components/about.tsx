'use client';
import License from './license';
import MeetTheTeam from './meettheteam';
import IPartners from './partners';
import TheJournal from './thejournal';

export default function About() {
  return (

    //about us
    <section id="about" className=" border-t border-slate-100 bg-white scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6 ">
          <div className="grid  grid-cols-[1fr_10fr] gap-1 rounded-3xl bg-linear-to-br from-purple-50 via-white to-blue-50 px-1 py-1">
            <div className="font-bold translate-x-[-20px] h-[21em] w-full bg-linear-to-r from-[#4873FF] via-[#1629A6] to-[#616475] via-30%  to-100% bg-clip-text text-transparent">
              <h2 className="text-[10em]  -tracking-[10px] ">About</h2>            
              <h2 className="text-[10em]  -tracking-[10px] leading-[0.2] ml-70">Us.</h2>
                {/* Image left */}
           <div className="relative w-full h-[500px] overflow-hidden  bottom-30 ">
                 <img 
                        src="/about-imageleft.png" 
                        className="absolute left-0 bottom-0 h-full object-contain  [clip-path:inset(0_0_50px_0)]"
                        />
              </div>
            </div>

            <div>

                {/* Image right */}
            <div className=" rounded-[20px] bg-purple-500 h-40   max-w-2xl text-slate-600 mt-28">
                    <div className="rounded-[20px] w-full h-40 bg-purple-500 overflow-hidden">
                        <img 
                        src="/about-image.jpg" 
                        className="w-full h-full object-cover"
                        />
                    </div>
            </div>
                {/* text right */}
           <div className=" grid grid-cols-2 gap-10 h-80  max-w-2xl text-slate-600 mt-6">
             <h1 className="text-justify text-[0.9em]">
              We provide reliable computer repair services focused on fixing broken components, replacing faulty parts, and restoring your device’s performance. Our goal is to deliver honest, efficient solutions that keep your technology running smoothly, whether for work, study, or everyday use.
             </h1>

             <p className="text-justify text-[0.9em]">
                We provide reliable computer repair services focused on fixing broken components, replacing faulty parts, and restoring your device’s performance. Our goal is to deliver honest, efficient solutions that keep your technology running smoothly, whether for work, study, or everyday use.
             </p>


            </div> 

</div>

          </div>

        <div>
          <MeetTheTeam />
        </div>

         <div>
          <IPartners />
        </div>

        <div>
          <TheJournal />
        </div>
        <div>
          <License />
        </div>

        
        </div>
      </section>
  );
}






