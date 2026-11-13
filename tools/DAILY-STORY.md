# Daily story playbook (Down the Middle)

Every weekday: one new data-driven story + two Instagram slides.

1. **Pick the story.** The biggest government story of the day (Executive, Congress, courts or statehouses) that has numbers behind it.
2. **Research.** At least 2 outlets from different sides, plus primary sources (court orders, SEC/agency data, CBO, BLS, CBP, etc.). Write down every figure with its source URL.
3. **Write the post** in `public/blog/<slug>.html` following `public/blog/HOW-TO-ADD-A-POST.md`. Required (house rule):
   - By the numbers stat tiles
   - At least 2 charts from cited figures (inline SVG, hover titles)
   - 2–3 labeled **Insights**
   - "How each side makes its case" panel, including a "what the data shows" column
   - Timeline when the story spans days
   - Every source linked; estimates and unverified claims labeled on the chart
4. **Make the images.** Copy `tools/specs/2026-11-13-asylum.json`, edit, then run
   `python3 tools/ig_slides.py tools/specs/<date>-<topic>.json`
   to create `<slug>-ig-1.png` (read the story), `<slug>-ig-2.png` (the data) and `<slug>-hero.png` in `public/blog/assets/`.
5. **List it** at the top of `POSTS` in `public/blog/index.html` and in `public/sitemap.xml`.
6. **Ship.** Branch, PR, merge to main; Vercel deploys.
7. **Developing story?** Write a new post that links back. Don't rewrite the old one.
