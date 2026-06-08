// recipeVideos.ts
// 40 easy-to-bake sweet recipes across 15 verified YouTube channels.
//
// HOW TO READ THIS DATA
// - `youtubeId`  : set ONLY where the video was confirmed to be the creator's official
//                  channel (title explicitly carried the channel name). These are safe to embed.
// - `youtubeId: null` : not yet confirmed. Do NOT guess — open `recipeUrl`, the creator's own
//                  video is embedded on that page; copy its watch URL and paste the id here.
//                  (See README-recipe-videos.md.) This avoids reupload/dead-embed risk.
// - `recipeUrl`  : verified, working recipe page (has the official video + reader star ratings).
// - `channelId`  : verified YouTube channel id/handle, so any lookup stays pinned to the real channel.
// - `ratingProof`: where known, the page's star-rating count — your "real people made it" signal.

export interface RecipeVideo {
  id: number;
  recipe: string;
  channel: string;
  channelId: string;        // UC… id or @handle, verified
  channelUrl: string;       // verified channel page
  recipeUrl: string | null; // verified recipe page (embeds official video + ratings)
  youtubeId: string | null; // set = confirmed official video, safe to embed
  ratingProof?: string;
  category: string;
  recipeSlug?: string;      // set = we have an on-site companion recipe page (plays video + our recipe)
}

export const recipeVideos: RecipeVideo[] = [
  // ── Preppy Kitchen (John Kanell) — rigorously tested ──────────────────────────
  { id: 1, recipe: "Chewy chocolate chip cookies", channel: "Preppy Kitchen",
    channelId: "UCTvYEid8tmg0jqGPDkehc_Q", channelUrl: "https://www.youtube.com/@PreppyKitchen",
    recipeUrl: "https://preppykitchen.com/chewy-chocolate-chip-cookies/", youtubeId: "FvN2oZQ1OJQ",
    ratingProof: "4.95 from 657 ratings", category: "Cookies" },
  { id: 2, recipe: "Best fudgy brownies", channel: "Preppy Kitchen",
    channelId: "UCTvYEid8tmg0jqGPDkehc_Q", channelUrl: "https://www.youtube.com/@PreppyKitchen",
    recipeUrl: "https://preppykitchen.com/brownie-recipe/", youtubeId: "X9hKRIQ3uxc", category: "Bars" },
  { id: 3, recipe: "Brownie cookies", channel: "Preppy Kitchen",
    channelId: "UCTvYEid8tmg0jqGPDkehc_Q", channelUrl: "https://www.youtube.com/@PreppyKitchen",
    recipeUrl: "https://preppykitchen.com/brownie-cookies/", youtubeId: "8zOzzsq924o", category: "Cookies" },
  { id: 4, recipe: "Peanut butter brownies", channel: "Preppy Kitchen",
    channelId: "UCTvYEid8tmg0jqGPDkehc_Q", channelUrl: "https://www.youtube.com/@PreppyKitchen",
    recipeUrl: "https://preppykitchen.com/peanut-butter-brownies/", youtubeId: "3mhFeInBbUI", category: "Bars" },

  // ── Sally's Baking Recipes (Sally McKenney) ───────────────────────────────────
  { id: 5, recipe: "Brownie cookies", channel: "Sally's Baking Recipes",
    channelId: "UCXSCbnLpg23d7WU5bIOAsBg", channelUrl: "https://www.youtube.com/channel/UCXSCbnLpg23d7WU5bIOAsBg",
    recipeUrl: "https://sallysbakingaddiction.com/brownie-cookies/", youtubeId: "7LqX21weXQQ", category: "Cookies" },
  { id: 6, recipe: "Bakery-style blueberry muffins", channel: "Sally's Baking Recipes",
    channelId: "UCXSCbnLpg23d7WU5bIOAsBg", channelUrl: "https://www.youtube.com/channel/UCXSCbnLpg23d7WU5bIOAsBg",
    recipeUrl: "https://sallysbakingaddiction.com/best-blueberry-muffins/", youtubeId: "kyLQc6WgAB4", category: "Muffins" },
  { id: 7, recipe: "Chewy oatmeal raisin cookies", channel: "Sally's Baking Recipes",
    channelId: "UCXSCbnLpg23d7WU5bIOAsBg", channelUrl: "https://www.youtube.com/channel/UCXSCbnLpg23d7WU5bIOAsBg",
    recipeUrl: "https://sallysbakingaddiction.com/oatmeal-raisin-cookies/", youtubeId: "sqLm57ZJb7Y", category: "Cookies" },

  // ── Bigger Bolder Baking (Gemma Stafford) — beginner / no-bake ────────────────
  { id: 8, recipe: "Chocolate mug cake (microwave)", channel: "Bigger Bolder Baking",
    channelId: "UCB9IPcQ_x8dO66s1Y9FZUDg", channelUrl: "https://www.youtube.com/@biggerbolderbaking",
    recipeUrl: "https://www.biggerbolderbaking.com/chocolate-mug-cakes/", youtubeId: "1wX0BqT1fPs",
    category: "No-bake / microwave", recipeSlug: "chocolate-mug-cake" },
  { id: 9, recipe: "Microwave mug brownie", channel: "Bigger Bolder Baking",
    channelId: "UCB9IPcQ_x8dO66s1Y9FZUDg", channelUrl: "https://www.youtube.com/@biggerbolderbaking",
    recipeUrl: "https://www.biggerbolderbaking.com/microwave-mug-brownie/", youtubeId: "6eslIRo9als",
    category: "No-bake / microwave" },
  { id: 10, recipe: "No-bake cheesecake", channel: "Bigger Bolder Baking",
    channelId: "UCB9IPcQ_x8dO66s1Y9FZUDg", channelUrl: "https://www.youtube.com/@biggerbolderbaking",
    recipeUrl: "https://www.biggerbolderbaking.com/no-bake-cheesecake/", youtubeId: "AN5j6fNi0ek",
    category: "No-bake / microwave" },

  // ── Cupcake Jemma (Jemma Wilson) — cupcakes ───────────────────────────────────
  { id: 11, recipe: "Perfect vanilla cupcakes", channel: "Cupcake Jemma",
    channelId: "c/cupcakejemma", channelUrl: "https://www.youtube.com/c/cupcakejemma",
    recipeUrl: null, youtubeId: "lC51CynVHAU", category: "Cupcakes", recipeSlug: "vanilla-cupcakes" },
  { id: 12, recipe: "Classic vanilla cupcakes (bake-at-home)", channel: "Cupcake Jemma",
    channelId: "c/cupcakejemma", channelUrl: "https://www.youtube.com/c/cupcakejemma",
    recipeUrl: null, youtubeId: "p_uSD5ERdro", category: "Cupcakes" },
  { id: 13, recipe: "Funfetti / birthday cake cupcakes", channel: "Cupcake Jemma",
    channelId: "c/cupcakejemma", channelUrl: "https://www.youtube.com/c/cupcakejemma",
    recipeUrl: null, youtubeId: "fq1QIsc-vys", category: "Cupcakes", recipeSlug: "funfetti-cupcakes" },

  // ── Food Wishes (Chef John) ───────────────────────────────────────────────────
  { id: 14, recipe: "Olive oil cake", channel: "Food Wishes",
    channelId: "@foodwishes", channelUrl: "https://www.youtube.com/@foodwishes",
    recipeUrl: "https://www.allrecipes.com/recipe/261319/olive-oil-cake/", youtubeId: "CaG0A0r6Iq4", category: "Cakes" },
  { id: 15, recipe: "Fluffy pancakes", channel: "Food Wishes",
    channelId: "@foodwishes", channelUrl: "https://www.youtube.com/@foodwishes",
    recipeUrl: null, youtubeId: "tPLVNKgs8Lk", category: "Breakfast sweets" },
  { id: 16, recipe: "Sweet cornbread", channel: "Food Wishes",
    channelId: "@foodwishes", channelUrl: "https://www.youtube.com/@foodwishes",
    recipeUrl: null, youtubeId: "A1lsTLs-iZg", category: "Quick breads" },

  // ── Natasha's Kitchen (Natasha Kravchuk) ──────────────────────────────────────
  { id: 17, recipe: "Easy banana bread", channel: "Natasha's Kitchen",
    channelId: "UC-pC1xsFPzcrL09DaW4jlBA", channelUrl: "https://www.youtube.com/channel/UC-pC1xsFPzcrL09DaW4jlBA",
    recipeUrl: "https://natashaskitchen.com/banana-bread-recipe-video/", youtubeId: "qUmDpPfY_h0", category: "Quick breads", recipeSlug: "easy-banana-bread" },
  { id: 18, recipe: "Crepes", channel: "Natasha's Kitchen",
    channelId: "UC-pC1xsFPzcrL09DaW4jlBA", channelUrl: "https://www.youtube.com/channel/UC-pC1xsFPzcrL09DaW4jlBA",
    recipeUrl: "https://natashaskitchen.com/crepe-recipe-2-ways/", youtubeId: "uA4KRfE_MNM", category: "Breakfast sweets" },
  { id: 19, recipe: "Blueberry muffins", channel: "Natasha's Kitchen",
    channelId: "UC-pC1xsFPzcrL09DaW4jlBA", channelUrl: "https://www.youtube.com/channel/UC-pC1xsFPzcrL09DaW4jlBA",
    recipeUrl: "https://natashaskitchen.com/blueberry-muffins-recipe/", youtubeId: "DWqmTGSJiEg", category: "Muffins" },

  // ── Emma's Goodies (Emma Fontanella) ──────────────────────────────────────────
  { id: 20, recipe: "No-bake cheesecake", channel: "Emma's Goodies",
    channelId: "UCgmOd6sRQRK7QoSazOfaIjQ", channelUrl: "https://www.youtube.com/@emmasgoodies",
    recipeUrl: "https://www.emmafontanella.com/no-bake-cheesecake/", youtubeId: "0d6j4-RxbwE", category: "No-bake / microwave" },
  { id: 21, recipe: "Vanilla mug cake (microwave)", channel: "Emma's Goodies",
    channelId: "UCgmOd6sRQRK7QoSazOfaIjQ", channelUrl: "https://www.youtube.com/@emmasgoodies",
    recipeUrl: null, youtubeId: "H3OhTEkNbgU", category: "No-bake / microwave" },
  { id: 22, recipe: "Madeleines", channel: "Emma's Goodies",
    channelId: "UCgmOd6sRQRK7QoSazOfaIjQ", channelUrl: "https://www.youtube.com/@emmasgoodies",
    recipeUrl: null, youtubeId: null, category: "Pastries" },

  // ── Joshua Weissman ───────────────────────────────────────────────────────────
  { id: 23, recipe: "Best easy banana bread", channel: "Joshua Weissman",
    channelId: "c/JoshuaWeissman", channelUrl: "https://www.youtube.com/c/JoshuaWeissman",
    recipeUrl: "https://www.joshuaweissman.com/recipes/best-easy-banana-bread-recipe", youtubeId: null,
    category: "Quick breads" },
  { id: 24, recipe: "Cinnamon rolls", channel: "Joshua Weissman",
    channelId: "c/JoshuaWeissman", channelUrl: "https://www.youtube.com/c/JoshuaWeissman",
    recipeUrl: null, youtubeId: "f6kzypYDLRg", category: "Pastries" },

  // ── Sugar Spun Run (Sam Merritt) ──────────────────────────────────────────────
  { id: 25, recipe: "Brownie cookies", channel: "Sugar Spun Run",
    channelId: "@SugarSpunRun", channelUrl: "https://www.youtube.com/@SugarSpunRun",
    recipeUrl: "https://sugarspunrun.com/brownie-cookies/", youtubeId: "drIoHE1Q7YM", category: "Cookies" },
  { id: 26, recipe: "Sugar cookies", channel: "Sugar Spun Run",
    channelId: "@SugarSpunRun", channelUrl: "https://www.youtube.com/@SugarSpunRun",
    recipeUrl: "https://sugarspunrun.com/the-best-sugar-cookie-recipe/", youtubeId: "hzrq5gW1vQQ", category: "Cookies" },

  // ── America's Test Kitchen — most rigorously tested ───────────────────────────
  { id: 27, recipe: "Chewy brownies", channel: "America's Test Kitchen",
    channelId: "@AmericasTestKitchen", channelUrl: "https://www.youtube.com/@AmericasTestKitchen",
    recipeUrl: null, youtubeId: "DBZH6xl20uo", category: "Bars" },
  { id: 28, recipe: "Chocolate chip cookies", channel: "America's Test Kitchen",
    channelId: "@AmericasTestKitchen", channelUrl: "https://www.youtube.com/@AmericasTestKitchen",
    recipeUrl: null, youtubeId: "oCt3xhKCX1k", category: "Cookies" },
  { id: 29, recipe: "Lemon bars", channel: "America's Test Kitchen",
    channelId: "@AmericasTestKitchen", channelUrl: "https://www.youtube.com/@AmericasTestKitchen",
    recipeUrl: null, youtubeId: "fUinvtDigVk", category: "Bars" },

  // ── How To Cook That (Ann Reardon) ────────────────────────────────────────────
  { id: 30, recipe: "Rich chocolate cake", channel: "How To Cook That",
    channelId: "UCsP7Bpw36J666Fct5M8u-ZA", channelUrl: "https://www.youtube.com/howtocookthat",
    recipeUrl: "https://www.howtocookthat.net/public_html/chocolate-cake-recipe/", youtubeId: "W_l9Xk_2IQQ", category: "Cakes" },
  { id: 31, recipe: "Chocolate mousse cake", channel: "How To Cook That",
    channelId: "UCsP7Bpw36J666Fct5M8u-ZA", channelUrl: "https://www.youtube.com/howtocookthat",
    recipeUrl: null, youtubeId: "SbGpjrHcsIk", category: "Cakes", recipeSlug: "chocolate-mousse-cake" },

  // ── Bincy Chris (MerryBoosters) ───────────────────────────────────────────────
  { id: 32, recipe: "Soft chocolate chip cookies", channel: "Bincy Chris",
    channelId: "UCUo7ymPAoEBmZhv6pku9r0g", channelUrl: "https://www.youtube.com/bincychris",
    recipeUrl: "https://merryboosters.com/soft-chocolate-chip-cookies/", youtubeId: "uweI34rjj5E", category: "Cookies" },
  { id: 33, recipe: "Easy vanilla sponge cake", channel: "Bincy Chris",
    channelId: "UCUo7ymPAoEBmZhv6pku9r0g", channelUrl: "https://www.youtube.com/bincychris",
    recipeUrl: null, youtubeId: "Q2AO5nJvUss", category: "Cakes" },

  // ── The Scran Line (Nick Makrides) ────────────────────────────────────────────
  { id: 34, recipe: "Funfetti cupcakes", channel: "The Scran Line",
    channelId: "thescranline", channelUrl: "https://www.youtube.com/thescranline",
    recipeUrl: null, youtubeId: "fSa_op-kR8U", category: "Cupcakes" },
  { id: 35, recipe: "Fudgy brownies", channel: "The Scran Line",
    channelId: "thescranline", channelUrl: "https://www.youtube.com/thescranline",
    recipeUrl: null, youtubeId: "LyiUrq77LvE", category: "Bars" },

  // ── Tasty (BuzzFeed) — fastest / most beginner-proof ──────────────────────────
  { id: 36, recipe: "3-ingredient peanut butter cookies", channel: "Tasty",
    channelId: "@buzzfeedtasty", channelUrl: "https://www.youtube.com/@buzzfeedtasty",
    recipeUrl: "https://tasty.co/recipe/3-ingredient-peanut-butter-cookies", youtubeId: "4hMfOmqD720", category: "Cookies" },
  { id: 37, recipe: "Rice Krispie treats", channel: "Tasty",
    channelId: "@buzzfeedtasty", channelUrl: "https://www.youtube.com/@buzzfeedtasty",
    recipeUrl: null, youtubeId: "Y0hBAyo187k", category: "No-bake / microwave" },
  { id: 38, recipe: "Brookies (brownie + cookie)", channel: "Tasty",
    channelId: "@buzzfeedtasty", channelUrl: "https://www.youtube.com/@buzzfeedtasty",
    recipeUrl: null, youtubeId: null, category: "Bars" },

  // ── Bake with Jack (Jack Sturgess) — sweet enriched breads ────────────────────
  { id: 39, recipe: "Easy enriched sweet buns", channel: "Bake with Jack",
    channelId: "UCTVR5DSxWPpAVI8TzaaXRqQ", channelUrl: "https://www.youtube.com/@Bakewithjack",
    recipeUrl: null, youtubeId: null, category: "Breads" },
  { id: 40, recipe: "Cinnamon swirl bread", channel: "Bake with Jack",
    channelId: "UCTVR5DSxWPpAVI8TzaaXRqQ", channelUrl: "https://www.youtube.com/@Bakewithjack",
    recipeUrl: null, youtubeId: null, category: "Breads" },
];

// Convenience helpers ---------------------------------------------------------
export const embedUrl = (youtubeId: string) =>
  `https://www.youtube.com/embed/${youtubeId}`;

export const watchUrl = (youtubeId: string) =>
  `https://www.youtube.com/watch?v=${youtubeId}`;

// Recipes that are embed-ready right now (verified official video).
export const readyToEmbed = recipeVideos.filter((r) => r.youtubeId);

// Recipes that still need a video id pasted in (see README).
export const needsVideoId = recipeVideos.filter((r) => !r.youtubeId);
