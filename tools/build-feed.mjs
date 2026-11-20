// Builds public/feed.xml (RSS) from the blog posts in public/blog/*.html.
// Runs automatically before every build ("prebuild" in package.json), so new posts
// show up in the feed with no extra steps. Other sites (like thebkcg.com) read the feed
// at https://<site>/feed to show the latest posts.
//
// For each post it reads: og:title (or <title>), og:description (or meta description),
// og:image (or the first <img>), and the date from article:published_time, JSON-LD
// datePublished, the blog index's POSTS list, or a written date like "October 8, 2026".
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BLOG = path.join(ROOT, "public", "blog");
const cfg = JSON.parse(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "feed.config.json"), "utf8"));
const SITE = cfg.site.replace(/\/$/, "");

const decode = (s) => String(s || "")
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&nbsp;/g, " ").replace(/&mdash;/g, "—").replace(/&ndash;/g, "–").replace(/&rsquo;/g, "’").replace(/&lsquo;/g, "‘")
  .replace(/&rdquo;/g, "”").replace(/&ldquo;/g, "“").replace(/&hellip;/g, "…").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const meta = (html, key) => {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*>`, "i");
  const tag = (html.match(re) || [])[0];
  return tag ? decode((tag.match(/content=["']([^"']*)["']/i) || [])[1]) : "";
};
const abs = (u) => (!u ? "" : /^https?:/i.test(u) ? u : `${SITE}${u.startsWith("/") ? "" : "/blog/"}${u}`);
const mime = (u) => (/\.png(\?|$)/i.test(u) ? "image/png" : /\.webp(\?|$)/i.test(u) ? "image/webp" : /\.gif(\?|$)/i.test(u) ? "image/gif" : "image/jpeg");
const MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December";

// Dates listed in the blog index (downthemiddle keeps a POSTS list with slug + date).
const indexDates = {};
try {
  const idx = fs.readFileSync(path.join(BLOG, "index.html"), "utf8");
  for (const m of idx.matchAll(/slug:\s*"([^"]+)"[\s\S]*?date:\s*"(\d{4}-\d{2}-\d{2})"/g)) indexDates[m[1]] = m[2];
} catch {}

const posts = [];
for (const file of fs.readdirSync(BLOG)) {
  if (!file.endsWith(".html") || file === "index.html" || file.startsWith("_")) continue;
  const slug = file.replace(/\.html$/, "");
  const html = fs.readFileSync(path.join(BLOG, file), "utf8");
  if (/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)) continue;
  const title = meta(html, "og:title") || decode((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1]);
  const description = meta(html, "og:description") || meta(html, "description");
  const link = meta(html, "og:url") || `${SITE}/blog/${file}`;
  const image = abs(meta(html, "og:image") || (html.match(/<img[^>]+src=["']([^"']+)["']/i) || [])[1]);
  let date = meta(html, "article:published_time") || (html.match(/"datePublished"\s*:\s*"([^"]+)"/) || [])[1] || indexDates[slug] || "";
  if (!date) { const m = html.replace(/<[^>]+>/g, " ").match(new RegExp(`(${MONTHS}) \\d{1,2}, 20\\d{2}`)); if (m) date = m[0]; }
  let when = date ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T12:00:00Z` : date) : null;
  if (!when || isNaN(when)) { console.warn(`feed: no date found for ${file}; add <meta property="article:published_time" content="YYYY-MM-DD">. Using today.`); when = new Date(); }
  if (!title) continue;
  posts.push({ title, description, link, image, when });
}
posts.sort((a, b) => b.when - a.when);

const items = posts.slice(0, 50).map((p) => {
  const body = `${p.image ? `<p><img src="${esc(p.image)}" alt="${esc(p.title)}" /></p>` : ""}<p>${esc(p.description)}</p><p><a href="${esc(p.link)}">Read more on ${esc(cfg.name)}</a></p>`;
  return `    <item>
      <title>${esc(p.title)}</title>
      <link>${esc(p.link)}</link>
      <guid isPermaLink="true">${esc(p.link)}</guid>
      <pubDate>${p.when.toUTCString()}</pubDate>
      <description>${esc(p.description)}</description>
      <content:encoded><![CDATA[${body}]]></content:encoded>${p.image ? `
      <media:content url="${esc(p.image)}" medium="image" type="${mime(p.image)}" />
      <enclosure url="${esc(p.image)}" type="${mime(p.image)}" length="0" />` : ""}
    </item>`;
}).join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${esc(cfg.name)} Blog</title>
    <link>${SITE}/blog/</link>
    <atom:link href="${SITE}/feed" rel="self" type="application/rss+xml" />
    <description>${esc(cfg.description)}</description>
    <language>en-us</language>${posts[0] ? `
    <lastBuildDate>${posts[0].when.toUTCString()}</lastBuildDate>` : ""}
${items}
  </channel>
</rss>
`;
fs.writeFileSync(path.join(ROOT, "public", "feed.xml"), xml);
console.log(`feed: wrote public/feed.xml with ${posts.length} posts`);
