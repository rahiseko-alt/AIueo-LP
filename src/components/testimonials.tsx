import { mockTestimonials } from '@/data/mock';

export function Testimonials() {
  return (
    <section className="border-b border-[rgba(240,237,232,0.08)] bg-[#080808] py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="sec-eyebrow">06 / MEMBER VOICES</div>
        <h2 className="sec-title text-[#f0ede8]">What Our Players Say</h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {mockTestimonials.map((t) => (
            <div
              key={t.id}
              className="flex flex-col justify-between rounded-2xl border border-[rgba(240,237,232,0.08)] bg-[#0e0e0e] p-8 transition hover:border-[rgba(200,164,90,0.3)]"
            >
              <div>
                <div className="font-serif text-5xl font-extralight text-[#c8a45a]/40 leading-none mb-4">
                  “
                </div>
                <p className="font-sans text-sm font-light leading-relaxed text-[rgba(240,237,232,0.85)]">
                  {t.quote}
                </p>
              </div>

              <div className="mt-8 border-t border-[rgba(240,237,232,0.08)] pt-4">
                <div className="font-sans text-sm font-medium text-[#f0ede8]">{t.author}</div>
                <div className="font-mono text-xs text-[rgba(240,237,232,0.5)]">{t.role}</div>
                <div className="mt-1 font-mono text-[10px] text-[#c8a45a]">{t.activityName}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
