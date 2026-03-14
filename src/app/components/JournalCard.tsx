'use client'

type JournalCardProps = {
  className?: string
}

export default function JournalCard({ className }: JournalCardProps) {
  return (
    <div className={`${className ?? ''} relative`}>
    <div className="mt-9">
      <div className="absolute left-1/2 mt-8 h-[16.5em] ml-3 w-full max-w-4xl -translate-x-1/2 rounded-[22px] shadow-xl ring-1 ring-black/5 "></div>
      <div className="relative mt-1 mx-auto w-full max-w-4xl  overflow-visible">
        <div className="absolute left-5 top-1/2 z-10 h-[300px] w-[500px] -translate-x-[30%] -translate-y-1/2 rounded-[22px] bg-[#3A0F4B] md:h-[190px] md:w-[250px]" />

        <div className="relative w-full min-h-[290px] overflow-hidden rounded-[28px]">
          
          <button
            type="button"
            className="absolute bottom-8 right-8 rounded-full border border-transparent bg-white px-6 py-1 text-[12px] font-semibold text-[#1D4ED8] shadow-xl [background:linear-gradient(#fff,#fff)_padding-box,linear-gradient(to_bottom_right,#9A42E6,#562580)_border-box]"
          >
            <p className="-mt-1 bg-linear-to-br from-[#9A42E6] to-[#562580] bg-clip-text text-transparent">
              Find out more
            </p>
          </button>

          <div className="flex  -mt-2 flex-col gap-6 p-5 pb-16 md:flex-row md:items-start md:gap-10 md:p-7 md:pb-16">
            <div className="flex shrink-0 items-center gap-6">
              <div className="ml-44 translate-y-10 h-[200px] w-[160px] rounded-[22px] bg-[#3A0F4B] md:h-[190px] md:w-[176px]" />
            </div>

            <div className="min-w-0 mt-4 -ml-4">
              <div className="text-[14px] translate-y-1 -tracking-[1px] font-bold bg-linear-to-br from-[#9A42E6]  to-[#562580]  from-20% to-90% bg-clip-text text-transparent">For the People</div>
              <div className="mt-1 text-[28px] font-bold leading-[1.05] -tracking-[1px]">
                <span className="bg-linear-to-b from-[#9A42E6]  to-[#562580] from-20% to-100% bg-clip-text text-transparent text-[3rem] -tracking-[3px]">Since 2003</span>
              </div>
              <div className="mt-1 text-[1.2em] font-bold text-[#616161] -tracking-[1px]">The Perseverance of Technician</div>

              <div className="mt-4 mr-30 space-y-2 font-semibold text-[11px] leading-[1.2] text-slate-500">
                <p>
                  We provide reliable computer repair services focused on fixing broken components, replacing faulty parts, and
                  restoring your device’s performance. Our goal is to deliver honest, efficient solutions that keep your
                  technology running smoothly, whether for work, study, or everyday use.
                </p>
                <p>
      
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
