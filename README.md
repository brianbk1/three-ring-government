# Three-Ring Government — The Beltway Bulletin

The left's take. The right's take. Then the story, down the middle.

A React (Vite) app that uses the Anthropic API with live web search to find real government
news covered by both left- and right-leaning outlets, describes each side's framing with
links to the original coverage, and writes a neutral down-the-middle summary. Features the
Overturn-O-Meter™ (live Supreme Court reversal rate) and a WSJ-style SCOTUS docket strip.

## Stack
- React 18 + Vite
- Vercel serverless function (`/api/claude.js`) proxying the Anthropic API
- Model: claude-sonnet-4-6 with the web_search tool

## Local development
```
npm install
npm run dev          # UI only — API calls need the serverless function
```
To run the API locally too:
```
npx vercel dev       # runs Vite AND /api/claude together
```
(You'll need `ANTHROPIC_API_KEY` in a `.env` file or added via `vercel env pull`.)

## Deploy (Vercel)
1. Push this repo to GitHub.
2. In Vercel: Add New → Project → Import the repo. Framework preset: Vite (auto-detected).
3. Settings → Environment Variables → add `ANTHROPIC_API_KEY` = your key (no REACT_APP_ or VITE_ prefix — it's server-side only).
4. Deploy. Every future push to `main` auto-deploys.

## Cost note
Each page load makes one API call (Overturn-O-Meter) and each "START THE SHOW" makes another,
both with web search. For production traffic, cache the Overturn-O-Meter result server-side
(e.g., Upstash Redis, refresh daily) so it isn't fetched on every visit.
