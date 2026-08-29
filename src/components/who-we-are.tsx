'use client';

import { useState } from 'react';
import Image from 'next/image';
import { mockSliderPhotos } from '@/data/mock';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function WhoWeAre() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? mockSliderPhotos.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === mockSliderPhotos.length - 1 ? 0 : prev + 1));
  };

  return (
    <section id="about" className="border-b border-[rgba(240,237,232,0.08)] bg-[#080808]">
      <div className="who-grid min-h-[560px]">
        {/* Left: Photo Slider of Real Activities */}
        <div className="relative min-h-[380px] w-full overflow-hidden bg-[#0e0e0e] md:min-h-[560px]">
          <div
            className="flex h-full w-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {mockSliderPhotos.map((photo, idx) => (
              <div key={idx} className="relative h-full w-full flex-shrink-0">
                <Image
                  src={photo.url}
                  alt={photo.caption}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/25" />
                <div className="absolute bottom-4 left-6 rounded bg-black/80 px-3 py-1 font-mono text-xs text-[#f0ede8] backdrop-blur-sm">
                  {photo.caption}
                </div>
              </div>
            ))}
          </div>

          {/* Slider Controls */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-[rgba(240,237,232,0.2)] bg-[rgba(8,8,8,0.7)] p-2.5 text-white backdrop-blur-sm transition hover:border-[#c8a45a] hover:text-[#c8a45a]"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-[rgba(240,237,232,0.2)] bg-[rgba(8,8,8,0.7)] p-2.5 text-white backdrop-blur-sm transition hover:border-[#c8a45a] hover:text-[#c8a45a]"
            aria-label="Next Slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-4 right-6 flex gap-2">
            {mockSliderPhotos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all ${
                  currentSlide === idx ? 'w-6 bg-[#c8a45a]' : 'w-2 bg-[rgba(240,237,232,0.3)]'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Right: Editorial Narrative */}
        <div className="flex flex-col justify-center p-8 sm:p-12 md:p-16">
          <div className="sec-eyebrow">01 / WHY AI LEAGUE EXISTS</div>
          <h2 className="sec-title text-[#f0ede8]">
            「0はいくつ集めても0」だから、まず1つの活動を作る。
          </h2>

          <div className="mt-8 space-y-4 font-sans text-sm font-light leading-relaxed text-[rgba(240,237,232,0.8)] sm:text-base">
            <p>
              交流会で名刺を100枚交換しても、「今度何かやりましょう」で終われば実質的には何も生まれていません。接点だけでは0です。
            </p>
            <p>
              主婦向けにAIセミナーを開きたい人。地域の子供向けにAI教室をやりたい人。受託開発のチームを組みたい人。深夜にLT会を開きたい人。
            </p>
            <p>
              ジャンルは一切問いません。AIに関わる人たちがそれぞれの「好きな企画」を実際に立ち上げ、
              <strong>「こういうのやるんですけど、一緒にどうですか？」</strong>
              と仲間を募り、形にする場所。それが草AIチーム「AI League AIueo」です。
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <a href="#events" className="btn-solid">
              企画一覧・参加する
            </a>
            <a href="#join" className="btn-ghost">
              企画を持ち込む →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
