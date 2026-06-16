"use client";

import { useState } from "react";
import Image from "next/image";

/** Facade ("lite") YouTube embed: we show only the thumbnail + a play button on
 *  page load, and mount YouTube's heavy (~1 MB) player iframe lazily on click.
 *  The page opens instantly; we never re-host video — the iframe streams from
 *  YouTube (youtube-nocookie), so the creator keeps the view. */
export function YouTubeEmbed({ id, title }: { id: string; title: string }) {
  const [active, setActive] = useState(false);

  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16 / 9", backgroundColor: "rgba(61, 42, 34, 0.06)" }}>
      {active ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          aria-label={`${title}, spela video / play video`}
          className="group absolute inset-0 h-full w-full cursor-pointer"
        >
          <Image
            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
            alt={title}
            fill
            sizes="(max-width: 820px) 100vw, 820px"
            className="object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center transition-colors group-hover:bg-[rgba(61,42,34,0.15)]">
            <span
              className="flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ width: 68, height: 68, borderRadius: "9999px", background: "rgba(61, 42, 34, 0.72)", color: "var(--vanilla-cream)", fontSize: "1.5rem", paddingLeft: 4 }}
            >
              ▶
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
