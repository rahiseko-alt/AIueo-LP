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
      <div className="who-grid min-h-[500px] lg:min-h-[580px]">
        {/* Left: Photo Slider of Real Activities */}
        <div
          data-testid="who-slider"
          className="relative min-h-[300px] sm:min-h-[420px] md:min-h-[480px] lg:min-h-[580px] w-full overflow-hidden bg-[#0e0e0e]"
        >
          <div
            className="flex h-full w-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {mockSliderPhotos.map((photo, idx) => (
              <div key={idx} className="relative h-full w-full flex-shrink-0 min-h-[300px] sm:min-h-[420px] lg:min-h-[580px]">
                <Image
                  src={photo.url}
                  alt={photo.caption}
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/25" />
                <div className="absolute bottom-4 left-4 sm:left-6 max-w-[calc(100%-80px)] rounded bg-black/80 px-3 py-1.5 font-mono text-[11px] sm:text-xs text-[#f0ede8] backdrop-blur-sm truncate">
                  {photo.caption}
                </div>
              </div>
            ))}
          </div>

          {/* Slider Controls (44px x 44px touch target) */}
          <button
            onClick={prevSlide}
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(240,237,232,0.2)] bg-[rgba(8,8,8,0.75)] text-white backdrop-blur-md transition-all hover:border-[#c8a45a] hover:text-[#c8a45a] active:scale-95"
            aria-label="前の写真を見る"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(240,237,232,0.2)] bg-[rgba(8,8,8,0.75)] text-white backdrop-blur-md transition-all hover:border-[#c8a45a] hover:text-[#c8a45a] active:scale-95"
            aria-label="次の写真を見る"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots Indicator with accessible touch targets */}
          <div className="absolute bottom-4 right-4 sm:right-6 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full">
            {mockSliderPhotos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className="flex h-7 w-5 items-center justify-center"
                aria-label={`スライド ${idx + 1} を表示`}
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-300 ${
                    currentSlide === idx ? 'w-5 bg-[#c8a45a]' : 'w-1.5 bg-[rgba(240,237,232,0.35)]'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Editorial Narrative */}
        <div className="flex flex-col justify-center px-6 py-12 sm:px-10 sm:py-16 md:px-12 md:py-20 lg:px-14">
          <div className="sec-eyebrow">01 / WHO WE ARE</div>
          <h2 className="sec-title text-[#f0ede8] leading-tight">
            「今度何かやりましょう」を、<br className="hidden sm:inline" />
            「こういうのやるので、一緒にどうですか？」に変える。
          </h2>

          <div className="mt-6 sm:mt-8 space-y-4 font-sans text-xs sm:text-sm md:text-base font-light leading-relaxed text-[rgba(240,237,232,0.8)]">
            <p>
              名刺交換を重ねるよりも、まず実際の企画やイベントを1つやってみる。
            </p>
            <p>
              主婦向けセミナー、子ども向けAI教室、受託開発、LT会。
              ジャンルを問わず、AIに関わる人たちがそれぞれの「やってみたい」を持ち寄り、
              具体的な活動として形にする草AIチームです。
            </p>
          </div>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <a href="#philosophy" className="btn-ghost">
              3つのフェーズ ↓
            </a>
            <a href="#events" className="btn-solid">
              企画・イベントを見る →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
