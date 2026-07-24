"use client";

import { useState } from "react";
import Link from "next/link";
import { ImageWithSkeleton } from "@/components/ui/image-with-skeleton";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Sparkles } from "lucide-react";
import { featured, type Featured } from "@/lib/mock-data";

const accentBg: Record<Featured["accent"], string> = {
  dark: "bg-[#0A0A0A] text-white",
  red: "bg-primary text-primary-foreground",
};

export function FeaturedShowcase() {
  const [index, setIndex] = useState(0);
  const total = featured.length;
  const current = featured[index];
  const next = featured[(index + 1) % total];
  const after = featured[(index + 2) % total];

  const go = (dir: 1 | -1) => setIndex((i) => (i + dir + total) % total);

  return (
    <section className="mx-auto mt-14 max-w-6xl px-4 sm:px-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Destacados
          </p>
          <h2 className="mt-2 font-serif text-2xl text-foreground md:text-3xl">
            Experiencias <span className="italic">imperdibles</span> esta semana
          </h2>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <button
            aria-label="Anterior"
            onClick={() => go(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            aria-label="Siguiente"
            onClick={() => go(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Slide principal */}
        <Link
          href={current.href}
          key={current.id}
          className="group relative col-span-1 overflow-hidden rounded-3xl lg:col-span-2"
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden sm:aspect-[16/10] lg:aspect-[5/4]">
            <ImageWithSkeleton
              src={current.image}
              alt={current.title}
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              priority
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            <div className="absolute inset-x-5 top-5 flex items-start justify-between gap-3">
              <span className="rounded-full bg-background/95 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground backdrop-blur">
                {current.kicker}
              </span>
              <span className={`hidden rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg sm:inline ${accentBg[current.accent]}`}>
                {current.offer}
              </span>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
              <p className="flex items-center gap-1.5 text-xs text-white/80">
                <MapPin className="h-3.5 w-3.5" />
                {current.location}
              </p>
              <h3 className="mt-2 max-w-2xl font-serif text-2xl leading-tight sm:text-3xl md:text-4xl">
                {current.title}
              </h3>
              <p className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">
                {current.subtitle}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg ${accentBg[current.accent]}`}>
                  {current.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
                <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs text-white backdrop-blur sm:hidden">
                  {current.offer}
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Stack lateral desktop */}
        <div className="hidden flex-col gap-4 lg:flex">
          {[next, after].map((f) => (
            <Link
              key={f.id}
              href={f.href}
              className="group relative flex-1 overflow-hidden rounded-3xl"
            >
              <div className="relative h-full min-h-[180px] w-full overflow-hidden">
                <ImageWithSkeleton
                  src={f.image}
                  alt={f.title}
                  fill
                  sizes="33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                <div className="absolute inset-x-0 top-0 flex justify-between p-4">
                  <span className="rounded-full bg-background/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground">
                    {f.kicker}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <h4 className="font-serif text-lg leading-snug">{f.title}</h4>
                  <p className="mt-1 line-clamp-1 text-xs text-white/80">{f.offer}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Dots y controles mobile */}
      <div className="mt-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {featured.map((f, i) => (
            <button
              key={f.id}
              onClick={() => setIndex(i)}
              aria-label={`Ir a destacado ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-8 bg-primary" : "w-2.5 bg-border hover:bg-muted-foreground"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 sm:hidden">
          <button
            aria-label="Anterior"
            onClick={() => go(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            aria-label="Siguiente"
            onClick={() => go(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <Link
          href="/promos"
          className="hidden text-sm font-medium text-primary hover:text-primary/80 sm:inline"
        >
          ¿Promocionar tu negocio? →
        </Link>
      </div>
    </section>
  );
}
