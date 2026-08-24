"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { AUTH_SHOWCASE_SLIDES } from "@/lib/auth-showcase-slides";
import { MASTERY_PHASES } from "@/lib/track-metadata";
import { TerminalScan } from "./illustrations/TerminalScan";
import { NodeGraphPulse } from "./illustrations/NodeGraphPulse";

const SLIDE_MS = 6000;
/** Cycles per slide so the Ken Burns zoom doesn't feel mechanical. */
const ZOOM_ORIGINS = ["50% 50%", "0% 0%", "100% 50%"];
/** Above this many slides the carousel starts to drag — rotate a random subset per page load instead. */
const MAX_SLIDES_PER_LOAD = 6;

function pickRandomSlides(): typeof AUTH_SHOWCASE_SLIDES {
  if (AUTH_SHOWCASE_SLIDES.length <= MAX_SLIDES_PER_LOAD) return AUTH_SHOWCASE_SLIDES;
  const shuffled = [...AUTH_SHOWCASE_SLIDES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, MAX_SLIDES_PER_LOAD);
}

export function AuthShowcase() {
  const [slides] = useState(pickRandomSlides);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);

  useEffect(() => {
    function onVisibility() {
      setTabHidden(document.hidden);
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (paused || tabHidden) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearInterval(id);
    // slides is fixed for the component's lifetime (chosen once via useState initializer).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, tabHidden]);

  const active = slides[index];

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Photos — all rendered up front (first eager, rest lazy) so crossfades never have to wait on a network fetch. */}
      {slides.map((slide, i) => {
        const isActive = i === index;
        return (
          <div key={slide.image} className="absolute inset-0 transition-opacity duration-[900ms] ease-in-out motion-reduce:transition-none" style={{ opacity: isActive ? 1 : 0 }} aria-hidden={!isActive}>
            <Image
              src={slide.image}
              alt={slide.alt}
              fill
              sizes="50vw"
              priority={i === 0}
              className="object-cover transition-transform ease-linear motion-reduce:!transform-none"
              style={{
                filter: "grayscale(1) contrast(1.05) brightness(0.9)",
                transform: isActive ? "scale(1.08)" : "scale(1)",
                transformOrigin: ZOOM_ORIGINS[i % ZOOM_ORIGINS.length],
                transitionDuration: "6900ms",
                willChange: "transform",
              }}
            />
          </div>
        );
      })}

      {/* Duotone: deep forest multiply + a soft lighter-green glow on top */}
      <div className="pointer-events-none absolute inset-0" style={{ backgroundColor: "#1b3a32", mixBlendMode: "multiply", opacity: 0.75 }} />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(circle at 28% 22%, rgba(111,191,154,0.65), transparent 60%)",
          mixBlendMode: "soft-light",
          opacity: 0.35,
        }}
      />

      {/* Bottom scrim so overlay text always passes contrast */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%]"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(6,26,20,0.92))" }}
      />

      <Link href="/" className="absolute left-10 top-10 z-10 flex items-center gap-1.5 text-sm font-medium text-white">
        <Sparkles className="h-4 w-4" />
        MasteryPath
      </Link>

      {/* Optional glass-card accent — only on the two tracks it was built for, hidden until there's real room for it. */}
      {active.accent ? (
        <div className="absolute right-14 top-1/2 z-10 hidden w-[320px] -translate-y-1/2 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-md 2xl:block">
          {active.accent === "terminal" ? <TerminalScan /> : <NodeGraphPulse />}
        </div>
      ) : null}

      {/* Content overlay */}
      <div className="absolute inset-x-10 bottom-16 z-10">
        {slides.map((slide, i) => (
          <div
            key={slide.image}
            className="absolute inset-x-0 bottom-0 transition-opacity duration-500 motion-reduce:transition-none"
            style={{ opacity: i === index ? 1 : 0, pointerEvents: i === index ? "auto" : "none" }}
          >
            <h2 className="font-display text-4xl font-medium leading-[1.1] text-white">{slide.track}</h2>
            <p className="mt-3 max-w-sm text-sm text-white/75">{slide.outcome}</p>
            <div className="mt-4 flex max-w-[220px] items-center gap-1">
              {MASTERY_PHASES.map((phase, pi) => (
                <div key={phase} className="h-1.5 flex-1 rounded-full bg-white" style={{ opacity: 0.3 + pi * 0.2 }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Segmented progress bar */}
      <div className="absolute inset-x-10 bottom-6 z-10 flex gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Show slide ${i + 1} of ${slides.length}`}
            className="h-1 flex-1 overflow-hidden rounded-full bg-white/25"
          >
            {i === index ? (
              <span
                key={`fill-${index}`}
                className="block h-full bg-white motion-reduce:w-full motion-reduce:[animation:none]"
                style={{
                  animation: "fill-progress 6s linear forwards",
                  animationPlayState: paused || tabHidden ? "paused" : "running",
                }}
              />
            ) : i < index ? (
              <span className="block h-full w-full bg-white" />
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
