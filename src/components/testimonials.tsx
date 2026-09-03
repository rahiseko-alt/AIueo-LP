import { mockTestimonials } from '@/data/mock';

export function Testimonials() {
  return (
    <section className="section-padding border-b border-[rgba(240,237,232,0.08)] bg-[#080808]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-10">
        <div className="sec-eyebrow">05 / MEMBER VOICES</div>
        <h2 className="sec-title text-[#f0ede8]">What Our Players Say</h2>

        <div className="mt-10 sm:mt-12 md:mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockTestimonials.map((t, idx) => (
            <div
              key={t.id}
              className={`flex flex-col justify-between rounded-2xl border border-[rgba(240,237,232,0.08)] bg-[#0e0e0e] p-6 sm:p-7 md:p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-[rgba(200,164,90,0.35)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] ${
                idx === 2 ? 'sm:col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div>
                <div className="font-serif text-4xl sm:text-5xl font-extralight text-[#c8a45a]/40 leading-none mb-3 sm:mb-4">
                  “
                </div>
                <p className="font-sans text-xs sm:text-sm font-light leading-relaxed text-[rgba(240,237,232,0.85)]">
                  {t.quote}
                </p>
              </div>

              <div className="mt-6 sm:mt-8 border-t border-[rgba(240,237,232,0.08)] pt-4">
                <div className="font-sans text-sm sm:text-base font-medium text-[#f0ede8]">{t.author}</div>
                <div className="font-mono text-xs text-[rgba(240,237,232,0.5)]">{t.role}</div>
                <div className="mt-1 font-mono text-[10px] sm:text-[11px] text-[#c8a45a]">{t.activityName}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
