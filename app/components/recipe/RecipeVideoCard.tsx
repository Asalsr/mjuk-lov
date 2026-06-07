import type { RecipeVideo } from "@/lib/recipeVideos";
import { recipeImages } from "@/lib/recipeImages";
import { YouTubeEmbed } from "./YouTubeEmbed";
import { ui, type Lang } from "@/lib/i18n";

/** One curated baking video. Priority: embed the confirmed video → else show the
 *  creator's preview photo linking to their recipe page → else a plain link box. */
export function RecipeVideoCard({ video, lang }: { video: RecipeVideo; lang: Lang }) {
  const t = ui[lang];
  const href = video.recipeUrl ?? video.channelUrl;
  const image = recipeImages[video.id];

  return (
    <div className="flex flex-col" style={{ backgroundColor: "var(--vanilla-cream)", border: "1px solid rgba(61, 42, 34, 0.12)" }}>
      {video.youtubeId ? (
        <YouTubeEmbed id={video.youtubeId} title={`${video.recipe} — ${video.channel}`} />
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
        <div className="type-caps opacity-50 mb-1">{video.channel} · {video.category}</div>
        <h3 className="type-serif" style={{ fontSize: "1.15rem" }}>{video.recipe}</h3>
        {video.ratingProof && (
          <div className="type-caps opacity-40 mt-2" style={{ fontSize: "0.625rem" }}>★ {video.ratingProof}</div>
        )}
      </div>
    </div>
  );
}
