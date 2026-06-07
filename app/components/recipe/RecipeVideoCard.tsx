import type { RecipeVideo } from "@/lib/recipeVideos";
import { YouTubeEmbed } from "./YouTubeEmbed";
import { ui, type Lang } from "@/lib/i18n";

/** One curated baking video: embeds the confirmed official video, otherwise
 *  links to the creator's verified recipe page (their video lives there). */
export function RecipeVideoCard({ video, lang }: { video: RecipeVideo; lang: Lang }) {
  const t = ui[lang];
  const href = video.recipeUrl ?? video.channelUrl;

  return (
    <div className="flex flex-col" style={{ backgroundColor: "var(--vanilla-cream)", border: "1px solid rgba(61, 42, 34, 0.12)" }}>
      {video.youtubeId ? (
        <YouTubeEmbed id={video.youtubeId} title={`${video.recipe} — ${video.channel}`} />
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
