import Link from 'next/link';
import { RegisterForm } from '@/components/register-form';

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-[#080808] px-4 py-8 text-[#f0ede8] sm:px-6 sm:py-12 md:px-10">
      <div className="mx-auto max-w-xl">
        <Link href="/" className="inline-flex min-h-11 items-center font-mono text-xs font-semibold tracking-[0.16em] text-[#c8a45a] hover:text-white">← AIueoへ戻る</Link>
        <section className="mt-8 border border-[rgba(200,164,90,0.42)] bg-[#12110d] p-6 sm:mt-10 sm:p-10">
          <p className="font-mono text-xs font-semibold tracking-[0.22em] text-[#c8a45a]">MEMBERSHIP</p>
          <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-5xl">会員登録</h1>
          <p className="mt-5 leading-8 text-[rgba(240,237,232,0.78)]">企画を掲載・管理する人だけが会員登録します。イベントに参加するだけなら登録は不要です。会費・利用料はかかりません。</p>
          <ol className="mt-7 space-y-3 border-l border-[#c8a45a]/60 pl-5 text-sm leading-7 text-[rgba(240,237,232,0.76)]">
            <li><span className="mr-2 font-mono text-[#c8a45a]">01</span>外部認証でログイン</li>
            <li><span className="mr-2 font-mono text-[#c8a45a]">02</span>公開名・協力したい内容・年齢確認を登録</li>
            <li><span className="mr-2 font-mono text-[#c8a45a]">03</span>規約に同意して、すぐに企画掲載を開始</li>
          </ol>
          <RegisterForm />
          <p className="mt-7 text-xs leading-6 text-[rgba(240,237,232,0.6)]">登録を進めることで、<Link className="text-[#d7bd82] underline hover:text-white" href="/terms">会員規約</Link>、<Link className="text-[#d7bd82] underline hover:text-white" href="/disclaimer">免責事項</Link>、<Link className="text-[#d7bd82] underline hover:text-white" href="/privacy">プライバシーポリシー</Link>を確認できます。最終同意はプロフィール完了画面で記録します。</p>
        </section>
      </div>
    </main>
  );
}
