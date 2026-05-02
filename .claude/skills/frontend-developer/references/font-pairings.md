<!-- Scout Header
Purpose: Curated Google Fonts pairings (display + body) for frontend design decisions
When to use: During Design Thinking phase when selecting typography for new pages/components
Size: ~90 lines
-->

# Font Pairings Reference

Curated font combinations for distinctive frontend design. All fonts available on Google Fonts unless noted.

## Display + Body Pairings

### Editorial / Serious

| Display Font | Body Font | Vibe | Google Fonts Import |
|-------------|-----------|------|---------------------|
| Playfair Display | Source Serif 4 | Classic journalism | `family=Playfair+Display:wght@700;900&family=Source+Serif+4:wght@400;600` |
| Fraunces | Work Sans | Warm editorial | `family=Fraunces:wght@700;900&family=Work+Sans:wght@400;500` |
| Libre Baskerville | Karla | Intellectual, bookish | `family=Libre+Baskerville:wght@400;700&family=Karla:wght@400;500` |
| Cormorant Garamond | Nunito Sans | Elegant longform | `family=Cormorant+Garamond:wght@600;700&family=Nunito+Sans:wght@400;600` |

### Technical / Data-Driven

| Display Font | Body/Data Font | Vibe | Google Fonts Import |
|-------------|---------------|------|---------------------|
| Space Mono | IBM Plex Sans | Terminal meets corporate | `family=Space+Mono:wght@400;700&family=IBM+Plex+Sans:wght@400;500` |
| JetBrains Mono | Outfit | Developer tooling | `family=JetBrains+Mono:wght@400;700&family=Outfit:wght@400;600` |
| Fira Code | Sora | Code-forward dashboard | `family=Fira+Code:wght@400;700&family=Sora:wght@400;600` |
| Inconsolata | Plus Jakarta Sans | Clean data display | `family=Inconsolata:wght@400;700&family=Plus+Jakarta+Sans:wght@400;600` |

### Bold / Impactful

| Display Font | Body Font | Vibe | Google Fonts Import |
|-------------|-----------|------|---------------------|
| Bebas Neue | Lato | Poster/billboard energy | `family=Bebas+Neue&family=Lato:wght@400;700` |
| Oswald | Merriweather Sans | Strong headers, soft body | `family=Oswald:wght@500;700&family=Merriweather+Sans:wght@400;700` |
| Anton | Barlow | Shouting headlines | `family=Anton&family=Barlow:wght@400;500` |
| Archivo Black | Archivo | Monolithic, dense | `family=Archivo+Black&family=Archivo:wght@400;500` |

### Playful / Creative

| Display Font | Body Font | Vibe | Google Fonts Import |
|-------------|-----------|------|---------------------|
| Gochi Hand | Quicksand | Handwritten warmth | `family=Gochi+Hand&family=Quicksand:wght@400;600` |
| Righteous | Nunito | Retro-fun | `family=Righteous&family=Nunito:wght@400;600` |
| Pacifico | Poppins | Casual, friendly | `family=Pacifico&family=Poppins:wght@400;500` |
| Fredoka | Lexend | Rounded, approachable | `family=Fredoka:wght@500;700&family=Lexend:wght@400;500` |

### Geometric / Modern

| Display Font | Body Font | Vibe | Google Fonts Import |
|-------------|-----------|------|---------------------|
| Unbounded | Figtree | Futuristic, clean | `family=Unbounded:wght@500;700&family=Figtree:wght@400;500` |
| Outfit | Outfit | Unified geometric | `family=Outfit:wght@400;600;800` |
| Syne | General Sans* | Art-forward | `family=Syne:wght@500;700` (*General Sans is from fontshare.com) |
| Bricolage Grotesque | Geist* | Modern European | `family=Bricolage+Grotesque:wght@400;700` (*Geist from vercel) |

### Luxury / Refined

| Display Font | Body Font | Vibe | Google Fonts Import |
|-------------|-----------|------|---------------------|
| Cormorant | Jost | High fashion | `family=Cormorant:wght@600;700&family=Jost:wght@400;500` |
| Bodoni Moda | Montserrat | Classic luxury | `family=Bodoni+Moda:wght@700;900&family=Montserrat:wght@400;500` |
| DM Serif Display | DM Sans | Balanced premium | `family=DM+Serif+Display&family=DM+Sans:wght@400;500` |

## Usage Pattern

```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Source+Serif+4:wght@400;600&display=swap');

:root {
  --font-display: 'Playfair Display', serif;
  --font-body: 'Source Serif 4', serif;
}
```

**Always append `&display=swap` to the Google Fonts URL.**

## Fonts Marked with * (Non-Google)

| Font | Source | License |
|------|--------|---------|
| General Sans | fontshare.com | Free for commercial use |
| Geist / Geist Mono | vercel.com/font | SIL Open Font License |
| Berkeley Mono | berkeleygraphics.com | Paid license |

Use `@font-face` with self-hosted files for non-Google fonts.

## Anti-Patterns

Do NOT default to these across multiple designs:
- Inter (the new Arial — ubiquitous, invisible)
- Roboto (Android default, no character)
- Space Grotesk (trending AI-tool default in 2024-2025)
- DM Sans as both display AND body (lazy single-font choice)
- Poppins for everything (overused friendly default)
