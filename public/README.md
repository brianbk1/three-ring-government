# Down the Middle — new post: "What the Pennsylvania Governor Debate Revealed"

Built into your CURRENT files (the ones you just sent), nothing overwritten —
I only added the new post to the JS `POSTS` array and one `<url>` to the sitemap.

## Where each file goes (relative to your site's public root)

| File in this zip | Put it at | Action |
|---|---|---|
| `blog/pennsylvania-governor-debate-shapiro-garrity-october-2026.html` | `/blog/…same name.html` | **Add** (new file) |
| `blog/pa-governor-debate-hero.jpg` | `/blog/pa-governor-debate-hero.jpg` | **Add** (hero image) |
| `blog/index.html` | `/blog/index.html` | **Replace** (adds one post to the list) |
| `sitemap.xml` | `/sitemap.xml` | **Replace** (adds the post URL; bumps 2 lastmods) |
| `pa-governor-debate-instagram.png` | *(not for the site)* | Your Instagram graphic — post separately |

## What changed
- **Post page:** built in your exact current blog chrome (navy `#12233E` / red `#B5382E`,
  Georgia body, `🎪 Down the Middle` header, `← All posts` backlink, sources list, CTA).
  The body is your docx text, unchanged; I added in-page `[1]`–`[5]` source anchors.
- **index.html:** one new object at the top of the `POSTS` array. It sorts newest-first
  by date automatically, so the governor post (2026-10-08) now leads, ahead of the
  10-year-treasury, jobs-report, national-debt and markets-rates posts already there.
- **sitemap.xml:** added the post URL; bumped `/` and `/blog/index.html` lastmod to 2026-10-08.
- **Hero image:** your editorial illustration, optimized from a 2.8 MB PNG to a 121 KB
  JPG (1200px wide) so the page loads fast. Caption kept: "Original AI-generated
  editorial illustration; not a depiction of the debate studio or candidates."

## Instagram graphic
`pa-governor-debate-instagram.png` is the portrait social card from your docx — it's in
the zip root (NOT under blog/) because it isn't referenced by the site. Per your docx
note: post it after the article is live and set the IG link to the published URL.

## Fact check (done)
I confirmed the core premise against live reporting: the Shapiro–Garrity debate did
happen in Harrisburg on October 7, 2026 (their only scheduled debate), covered by
Spotlight PA, WESA, Axios, City & State PA and others, ahead of the November 3 election.
The per-claim attributions are yours and are presented as attributed positions, which
the Sources note already states. No content changes were needed.

## One thing to flag — the Iran post isn't here
The Iran/oil post I prepared last time (`iran-war-oil-markets.html`) is NOT in your
current `POSTS` array or sitemap, so it looks like it was never published. I did NOT
add it back — if you want it live, say so and I'll fold it in. Otherwise ignore.
