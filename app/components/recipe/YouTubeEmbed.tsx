/** Official privacy-friendly YouTube embed (youtube-nocookie). We never
 *  re-host video — the iframe streams from YouTube, creator keeps the view. */
export function YouTubeEmbed({ id, title }: { id: string; title: string }) {
  return (
    <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
      <iframe
        className="absolute inset-0 h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
