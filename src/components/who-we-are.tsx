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
        {/* Left: Photo Slider of Events & Meetups */}
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
                <div className="absolute bottom-4 left-6 rounded bg-black/75 px-3 py-1 font-mono text-xs text-[#f0ede8] backdrop-blur-sm">
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

        {/* Right: Editorial Narrative (Kinetic Style) */}
        <div className="flex flex-col justify-center p-8 sm:p-12 md:p-16">
          <div className="sec-eyebrow">01 / WHO WE ARE</div>
          <h2 className="sec-title text-[#f0ede8]">
            Prioritising the Experience over the Pitch.
          </h2>

          <div className="mt-8 space-y-4 font-sans text-sm font-light leading-relaxed text-[rgba(240,237,232,0.8)] sm:text-base">
            <p>
              交流会で名刺を何十枚配っても、「今度何かやりましょう」で終われば実質的には何も生まれていません。
            </p>
            <p>
              AI League AIueo は、草野球のように週末に集まり、AIを体験し、人と人が気軽につながる「草AIイベント同盟」です。
            </p>
            <p>
              難しい開発知識は不要。美味しいドリンクや食事を楽しみながら、AIで遊んだり、面白い使い方をシェアしたり、一緒にイベントを作ったり。
              まずは1つのイベントに参加してみる。そこから自然なつながりが始まります。
            </p>
          </div>

          <div className="mt-10">
            <a href="#events" className="btn-ghost">
              Upcoming Events →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
