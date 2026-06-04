import Link from "next/link";
import Image from "next/image";
import type { EventItem } from "@/lib/mock-data";

export function EventCard({ event, className = "" }: { event: EventItem; className?: string }) {
  return (
    <Link
      href={`/eventos/${event.slug}`}
      className={`group block overflow-hidden rounded-2xl bg-card transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] ${className}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <Image
          src={event.image}
          alt={event.title}
          fill
          sizes="(max-width: 640px) 78vw, 320px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-background/95 text-center shadow-sm backdrop-blur">
          <span className="font-serif text-xl leading-none text-primary">{event.day}</span>
          <span className="mt-0.5 text-[10px] font-semibold tracking-wider text-muted-foreground">
            {event.month}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 font-serif text-base leading-snug text-foreground">{event.title}</h3>
        <div className="mt-1.5 text-xs text-muted-foreground">{event.venue}</div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{event.time}</span>
          <span className="text-sm font-semibold text-accent">{event.price}</span>
        </div>
      </div>
    </Link>
  );
}
