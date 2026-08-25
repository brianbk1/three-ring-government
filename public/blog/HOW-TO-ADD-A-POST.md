# How to publish a new blog post (~5 minutes)

Your blog lives in `public/blog/`. Each post is a standalone HTML file, and
the blog landing page (`index.html`) builds its list automatically from a
short list near the bottom of that file. Here's the weekly routine.

## The steps

### 1. Create the post file
Copy `_TEMPLATE.html` to a new file named after your post, lowercase with
dashes:

```
public/blog/2026-09-01-reading-a-jobs-report.html
```

The part before `.html` is the post's **slug** — you'll need it in step 2.

### 2. Fill in the post
Open your new file and replace every `⟨REPLACE⟩`:
- `<title>` and meta `description`
- the `canonical` link and the two `og:url` links (paste your slug)
- the kicker line (category · read time)
- the `<h1>` headline
- the article body between the `ARTICLE BODY START/END` comments
- the sources line (or delete it)

Then delete the big instructions comment at the very top.

### 3. Add it to the blog list
Open `public/blog/index.html`, find the `POSTS` list near the bottom, and
paste a new entry at the **top** (copy the sample that's already there):

```js
{
  slug: "2026-09-01-reading-a-jobs-report",
  title: "How to Read a Jobs Report Without the Spin",
  date: "2026-09-01",
  category: "Media Literacy",
  readMins: 5,
  excerpt: "The same jobs number gets spun two ways by lunchtime. Here's how to read it straight."
},
```

Posts sort newest-first by `date` automatically, so order in the list
doesn't matter.

### 4. Add it to the sitemap
Open `public/sitemap.xml`, copy an existing `<url>` block, and swap in your
new post's URL and today's date. Bump the `<lastmod>` on the
`/blog/index.html` entry to today too.

### 5. Deploy
Commit and push (Vite build runs on your host). Done.

## Good categories to reuse
Markets · Media Literacy · The Courts · Congress · The White House · Elections

Keeping categories consistent makes the blog feel organized and helps
readers filter mentally.

## Tips
- **Images:** drop an image in `public/blog/` and reference it with
  `<img src="/blog/my-image.jpg" alt="describe it" style="max-width:100%;border-radius:8px;margin:20px 0">`.
- **Highlight box:** wrap a key takeaway in `<div class="tip">…</div>`.
- **Sources matter here.** For a media-literacy brand, always cite your
  sources at the bottom (there's a `.sources` style ready to use) and link
  to originals where you can. It's on-brand and builds trust.
- **Don't rename a slug after publishing** — it changes the URL and breaks
  any links already indexed. If you must, set up a redirect.
- `_TEMPLATE.html` starts with `_` so it's easy to spot and won't be
  mistaken for a real post. Leave it in place; copy it each week.
