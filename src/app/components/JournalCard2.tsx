'use client'

type JournalCardProps = {
  className?: string
}

export default function JournalCard2({ className }: JournalCardProps) {
  return (
    <div className={className}>
      <div className="relative mt-5 mx-auto w-full max-w-4xl overflow-visible">
        <div className="absolute left-0 top-1/2 z-10 h-[230px] w-[380px] -translate-x-[5%] -translate-y-1/2 rounded-[22px] bg-[#171BFF]" />

        <div className="relative w-full min-h-[290px] overflow-hidden rounded-[28px] shadow-xl ring-1 ring-black/5">
          <button
            type="button"
            className="absolute bottom-8 right-8 flex   items-center justify-center rounded-full border border-transparent px-6 py-1 text-[12px] font-semibold bg-black shadow-xl [background:linear-gradient(#fff,#fff)_padding-box,linear-gradient(to_bottom_right,#2767BC,#142699)_border-box] "
          >
            <p className="bg-linear-to-br from-[#2767BC]  to-[#142699]  bg-clip-text text-transparent hover:text-white">
              Find out more
            </p>
          </button>

          <div className="flex flex-col gap-6 p-5 pb-16 md:flex-row md:items-start md:gap-10 md:p-7 md:pb-16">
            <div className="flex shrink-0 items-center gap-6">
              <div className="ml-40 translate-y-5 h-[200px] w-[160px] rounded-[22px]  md:h-[190px] md:w-[176px]" />
            </div>

            <div className="min-w-0 pt-2">
              <div className="text-[14px] -tracking-[1px] font-bold bg-linear-to-b from-[#2767BC]  to-[#142699] from-20% to-100% bg-clip-text text-transparent ">For Companies</div>
              <div className="mt-1 text-[20px] font-bold leading-none -tracking-[1px]">
                <span className="bg-linear-to-b from-[#2767BC]  to-[#142699]  bg-clip-text text-transparent from-40% to-100% w-full text-[2.1em] -tracking-[2px]">Willing to prepare you for the Digital Space.</span>
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
  )
}
