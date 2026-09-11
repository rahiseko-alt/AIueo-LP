import { STANDING_DESCRIPTIONS, STANDING_GUIDE, STANDING_LABELS, type Standing } from '@/lib/auth/roles';

/**
 * 「この場での立場は3つだけ」を示す表。
 *
 * 会員登録の前（`/register`）と後（`/member`）の両方に、**同じ言葉で**出す。
 * 登録が何のために要るのか、登録しない人は何ができないのかを、
 * 探さずに読めるようにするためのもの。
 */
export function StandingGuide({ current }: { current?: Standing }) {
  return (
    <section className="mt-10 border border-white/15 bg-[#12110d] p-6 sm:p-8">
      <p className="font-mono text-xs tracking-[0.2em] text-[#c8a45a]">WHO CAN DO WHAT</p>
      <h2 className="mt-3 text-2xl font-light">この場での立場は3つだけです</h2>
      <ul className="mt-6 space-y-4">
        {STANDING_GUIDE.map(({ standing, canDo, needs }) => (
          <li
            key={standing}
            className={`border-l-2 pl-4 ${standing === current ? 'border-[#c8a45a]' : 'border-white/15'}`}
          >
            <p className="flex flex-wrap items-center gap-3">
              <span className={standing === current ? 'text-lg text-[#e4d2a6]' : 'text-lg text-white/85'}>
                {STANDING_LABELS[standing]}
              </span>
              {standing === current && (
                <span className="border border-[#c8a45a] px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-[#c8a45a]">
                  いまのあなた
                </span>
              )}
            </p>
            <p className="mt-2 text-sm leading-7 text-white/70">できること: {canDo}</p>
            <p className="mt-1 text-sm leading-7 text-white/55">必要な手続き: {needs}</p>
          </li>
        ))}
      </ul>
      {current && <p className="mt-6 border-t border-white/10 pt-5 text-sm leading-7 text-white/65">{STANDING_DESCRIPTIONS[current]}</p>}
    </section>
  );
}
