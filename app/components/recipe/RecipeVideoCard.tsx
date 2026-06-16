import Link from "next/link";
import type { RecipeVideo } from "@/lib/recipeVideos";
import { recipeImages } from "@/lib/recipeImages";
import { YouTubeEmbed } from "./YouTubeEmbed";
import { ui, type Lang } from "@/lib/i18n";

/** One curated baking video. Priority: on-site recipe page (plays video + our recipe)
 *  → embed the confirmed video inline → creator's preview photo → plain link box. */
export function RecipeVideoCard({ video, lang }: { video: RecipeVideo; lang: Lang }) {
  const t = ui[lang];
  const href = video.recipeUrl ?? video.channelUrl;
  const image = recipeImages[video.id];

  return (
    <div className="flex flex-col" style={{ backgroundColor: "var(--vanilla-cream)", border: "1px solid rgba(61, 42, 34, 0.12)" }}>
      {video.recipeSlug && video.youtubeId ? (
        <Link href={`/${lang}/recept/${video.recipeSlug}`} className="group relative block overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`} alt={video.recipe} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex items-center justify-center" style={{ width: 56, height: 56, borderRadius: "9999px", background: "rgba(61, 42, 34, 0.6)", color: "var(--vanilla-cream)", fontSize: "1.25rem" }}>▶</span>
          </span>
          <span className="absolute bottom-0 left-0 right-0 type-caps px-3 py-2" style={{ background: "rgba(61, 42, 34, 0.55)", color: "var(--vanilla-cream)" }}>
            {t.recipeAndVideo}
          </span>
        </Link>
      ) : video.youtubeId ? (
        <YouTubeEmbed id={video.youtubeId} title={`${video.recipe}, ${video.channel}`} />
      ) : image ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="group relative block overflow-hidden" style={{ aspectRatio: "16 / 9" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={video.recipe} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <span className="absolute bottom-0 left-0 right-0 type-caps px-3 py-2" style={{ background: "rgba(61, 42, 34, 0.55)", color: "var(--vanilla-cream)" }}>
            ▶ {t.watchOn} {video.channel}
          </span>
        </a>
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center text-center px-4 type-caps transition-colors hover:text-[var(--dusty-terracotta)]"
          style={{ aspectRatio: "16 / 9", backgroundColor: "rgba(217, 183, 168, 0.2)" }}
        >
          ▶ {t.watchOn} {video.channel}
        </a>
      )}
      <div className="p-5">
        <div className="type-caps ink-muted mb-1">{video.channel} · {video.category}</div>
        <h3 className="type-serif" style={{ fontSize: "1.15rem" }}>{video.recipe}</h3>
        {video.ratingProof && (
          <div className="type-caps ink-muted mt-2" style={{ fontSize: "0.75rem" }}>★ {video.ratingProof}</div>
        )}
      </div>
    </div>
  );
}
