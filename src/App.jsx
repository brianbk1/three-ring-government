import React, { useState, useEffect } from "react";
import InstagramFeed from "./components/InstagramFeed";

// ---------- Design tokens: blue & white, red for emphasis only ----------
const T = {
  stage: "#12233E",       // deep navy behind the tent
  stageDeep: "#0A1729",
  circusRed: "#B5382E",   // emphasis red — used sparingly
  marquee: "#E9F1FB",     // ice white-blue (bulbs, accents, ticker)
  paper: "#FCFDFF",       // clean white card
  ink: "#151C28",
  faded: "#5F6B7C",
  win: "#2E6FB0",
  weird: "#5B6B85",
};

// The three rings (+ sideshow) — branch filters, multi-select
const RINGS = [
  { id: "Executive", label: "Executive Ring", emoji: "🎩", desc: "White House & agencies", color: "#14406E" },
  { id: "Legislative", label: "Legislative Ring", emoji: "🎪", desc: "Congress", color: "#2E6FB0" },
  { id: "Judicial", label: "Judicial Ring", emoji: "⚖️", desc: "The courts", color: "#5B84B8" },
  { id: "Sideshow", label: "The Sideshow", emoji: "🤹", desc: "States & local", color: "#8298B5" },
];

// Topic filters, multi-select
const TOPICS = [
  { id: "Geopolitical", label: "Geopolitical", emoji: "🌍" },
  { id: "Markets", label: "Markets", emoji: "📈" },
  { id: "Entertainment", label: "Entertainment", emoji: "🎬" },
  { id: "Legal", label: "Legal", emoji: "⚖️" },
];

const RANGES = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "custom", label: "Custom" },
];

const LOADING_LINES = [
  "Warming up the spotlight…",
  "Herding the clowns into one ring…",
  "Fact-checking the ringmaster…",
  "Confirming this actually happened…",
  "Tuning the calliope…",
];

const SPIN_STAMPS = {
  low: { text: "MILD SPIN", color: "#5B6B85", note: "Both sides mostly agree" },
  medium: { text: "SPIN CYCLE", color: "#2E6FB0", note: "Different emphasis" },
  chasm: { text: "TWO DIFFERENT PLANETS", color: "#B5382E", note: "You'd never know it's the same story" },
};

function rangeToText(mode, range, customFrom, customTo) {
  if (mode === "upcoming") return "in the upcoming days and weeks (scheduled or announced future events)";
  if (range === "today") return "published TODAY or YESTERDAY only";
  if (range === "week") return "published within the past 7 days";
  if (range === "month") return "published within the past 30 days";
  if (range === "custom" && customFrom && customTo) return `between ${customFrom} and ${customTo}`;
  return "from the past 7 days";
}

async function fetchStories({ mode, range, customFrom, customTo, rings, topics, searchQuery }) {
  const rangeText = rangeToText(mode, range, customFrom, customTo);
  const ringMap = {
    Executive: "the Executive branch (White House, cabinet, federal agencies)",
    Legislative: "Congress (House and Senate, both parties)",
    Judicial: "the federal courts and Supreme Court",
    Sideshow: "state and local government (governors, statehouses, mayors)",
  };
  const ringText = rings.map((r) => ringMap[r]).join("; ");
  const topicText = topics.join(", ");

  const upcomingClause =
    mode === "upcoming"
      ? `Focus ONLY on scheduled or announced UPCOMING government events: votes, hearings, court arguments and rulings expected, deadlines (funding, debt ceiling), summits, elections, confirmations. The "date" field should be the expected/scheduled date.`
      : `Focus on real government news ${rangeText}.`;

  const focusClause = searchQuery
    ? `The reader searched for: "${searchQuery}". Find the most relevant REAL, current news stories matching that search ${rangeText}. Assign each story's "ring" to the best fit among Executive, Legislative, Judicial, Sideshow, and its "topic" to the best fit among Geopolitical, Markets, Entertainment, Legal.`
    : `${upcomingClause}
Cover ONLY these parts of government: ${ringText}.
Topic lenses to prioritize: ${topicText}.`;

  const prompt = `You are the editor of "DOWN THE MIDDLE — Three-Ring Government", an app that shows how LEFT-leaning and RIGHT-leaning outlets cover the same government story, then gives readers a straight, down-the-middle summary.

${focusClause}
SEARCH METHOD (follow this order):
1. First search today's top headlines from major outlets — e.g. searches like "CNN politics today", "Fox News politics today", "Wall Street Journal news today" — to see what the biggest CURRENT government stories are right now.
2. Pick the freshest stories that BOTH a left-leaning outlet (e.g. CNN, MSNBC, NYT, WaPo) AND a right-leaning outlet (e.g. Fox News, NY Post, Washington Examiner, WSJ opinion) have covered.
3. Then search for each side's specific coverage of those stories to describe their framing and capture real URLs.

HARD RULES:
0. RECENCY IS CRITICAL: only include stories whose coverage was published within the requested window. If a story's most recent coverage is older than the window, DISCARD it — do not pad results with stale news. Fewer fresh stories beats more stale ones.
1. Every story must be real and verifiable in current reporting. Never fabricate events, outlets, or coverage.
2. URLs must be REAL links that appeared in your search results. If you don't have a real URL for a source, use an empty string "" — NEVER invent or guess a URL.
3. Describe each outlet's framing in YOUR OWN words (what they emphasize, what they downplay, the tone). Do not copy their headlines or sentences verbatim.
4. The "middle" field must be neutral, factual reporting in your own words: what verifiably happened, stripped of both sides' spin. 2-3 sentences.
5. NEVER invent quotes.
6. Rate the "spinGap" honestly: "low" = both sides basically agree, "medium" = different emphasis, "chasm" = you'd think they're covering two different planets.

Return exactly 5 stories (or as many as are genuinely fresh — never pad with stale news). Respond with ONLY a raw JSON array — no markdown fences, no preamble, no trailing text:
[{"headline":"neutral factual headline, under 12 words","left":{"outlet":"outlet name","framing":"1-2 sentences, their angle in your words","url":"real URL from search or empty string"},"right":{"outlet":"outlet name","framing":"1-2 sentences, their angle in your words","url":"real URL from search or empty string"},"middle":"2-3 sentence neutral factual summary","whyItMatters":"1 sentence on real significance","ring":"one of: Executive, Legislative, Judicial, Sideshow","topic":"one of: Geopolitical, Markets, Entertainment, Legal","date":"short publication date like Jul 11","sortDate":"publication date as YYYY-MM-DD","spinGap":"low, medium, or chasm"}]\nSort the array newest first by sortDate.`;

  const response = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    }),
  });

  const data = await response.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("[");
  const end = clean.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("No JSON found in response");
  const parsed = JSON.parse(clean.slice(start, end + 1));
  // Sort newest first by publication date (backstop in case the model doesn't)
  return parsed.sort((a, b) => (b.sortDate || "").localeCompare(a.sortDate || ""));
}

// ---------- UI pieces ----------

function BulbMarquee() {
  // a row of "bulbs" under the masthead
  return (
    <div aria-hidden="true" style={{ display: "flex", justifyContent: "center", gap: 10, margin: "14px 0 4px" }}>
      {Array.from({ length: 13 }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: T.marquee,
            boxShadow: `0 0 8px ${T.marquee}`,
            animation: `bulb 1.4s ease-in-out ${i * 0.11}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function TentStripes() {
  return (
    <div
      aria-hidden="true"
      style={{
        height: 14,
        background: `repeating-linear-gradient(90deg, #2E6FB0 0 42px, ${T.paper} 42px 84px)`,
        borderBottom: `2px solid ${T.circusRed}`,
      }}
    />
  );
}

// ---------- THE OVERTURN-O-METER™ ----------
// % of lower-court rulings the Supreme Court reversed or vacated this term.
async function fetchOverturnRate() {
  const prompt = `Use web search to find the CURRENT U.S. Supreme Court term's reversal statistics: how many merits cases have been decided this term, and how many of those reversed or vacated the lower court's ruling. If exact current-term counts aren't available yet, use the most recently completed term and say which term it is.

Respond with ONLY a raw JSON object, no markdown fences, no preamble:
{"term":"e.g. OT 2025","decided": number,"reversed": number,"percent": number (0-100, reversed+vacated as % of decided),"quip":"one short funny line (under 10 words) reacting to the number, aimed at the lower courts or SCOTUS, PG-13, no fabricated facts"}`;

  const response = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
      tools: [{ type: "web_search_20250305", name: "web_search" }],
    }),
  });

  const data = await response.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in ticker response");
  return JSON.parse(clean.slice(start, end + 1));
}

function OverturnOMeter({ stat, failed }) {
  const [displayPct, setDisplayPct] = useState(0);

  // count the percentage up once data lands
  useEffect(() => {
    if (!stat) return;
    const target = Math.round(stat.percent);
    let current = 0;
    const step = Math.max(1, Math.round(target / 40));
    const timer = setInterval(() => {
      current = Math.min(target, current + step);
      setDisplayPct(current);
      if (current >= target) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [stat]);

  return (
    <div
      style={{
        background: T.ink,
        borderBottom: `2px solid ${T.marquee}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        flexWrap: "wrap",
        padding: "9px 14px",
        textAlign: "center",
      }}
    >
      <span
        style={{
          fontFamily: "'Archivo Black', Impact, sans-serif",
          fontSize: 12,
          letterSpacing: "0.16em",
          color: T.marquee,
        }}
      >
        ⚖️ THE OVERTURN-O-METER™
      </span>

      {!stat && !failed && (
        <span style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic" }}>
          counting gavels…
        </span>
      )}

      {failed && (
        <span style={{ color: "rgba(255,255,255,0.6)", fontFamily: "Georgia, serif", fontSize: 13, fontStyle: "italic" }}>
          the meter is in recess — refresh to retry
        </span>
      )}

      {stat && (
        <>
          <span
            style={{
              fontFamily: "'Archivo Black', Impact, sans-serif",
              fontSize: 22,
              color: "#fff",
              lineHeight: 1,
            }}
          >
            {displayPct}%
          </span>
          <span style={{ color: "rgba(255,255,255,0.75)", fontFamily: "Georgia, serif", fontSize: 12.5 }}>
            of lower-court rulings smacked down ({stat.term}: {stat.reversed} of {stat.decided} cases)
          </span>
          {stat.quip && (
            <span style={{ color: T.marquee, fontFamily: "Georgia, serif", fontSize: 12.5, fontStyle: "italic" }}>
              "{stat.quip}"
            </span>
          )}
        </>
      )}
    </div>
  );
}

// WSJ futures-style stat strip: cases brought forward & cases overturned
function ScotusStrip({ stat }) {
  const sans =
    "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif";
  const label = { fontFamily: sans, fontSize: 15, fontWeight: 600, color: "#FFFFFF", whiteSpace: "nowrap" };
  const item = { display: "flex", alignItems: "baseline", gap: 8, whiteSpace: "nowrap" };
  return (
    <div
      style={{
        background: "#0B0F16",
        borderBottom: "1px solid rgba(255,255,255,0.12)",
        display: "flex",
        gap: 34,
        overflowX: "auto",
        padding: "11px 18px",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {!stat ? (
        <span style={{ fontFamily: sans, fontSize: 14, color: "rgba(255,255,255,0.55)", fontStyle: "italic" }}>
          SCOTUS docket data loading…
        </span>
      ) : (
        <>
          <div style={item}>
            <span style={label}>Cases Brought Forward</span>
            <span style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, color: "#3FA34D" }}>
              ↑ {stat.decided}
            </span>
            <span style={{ fontFamily: sans, fontSize: 12.5, color: "rgba(255,255,255,0.45)" }}>{stat.term}</span>
          </div>
          <div style={item}>
            <span style={label}>Cases Overturned</span>
            <span style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, color: "#D84C43" }}>
              ↓ {stat.reversed} ({Math.round(stat.percent)}%)
            </span>
            <span style={{ fontFamily: sans, fontSize: 12.5, color: "rgba(255,255,255,0.45)" }}>
              rough day, lower courts
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function Ticker() {
  const line =
    "THE LEFT SAYS ★ THE RIGHT SAYS ★ WE JUST TELL YOU WHAT HAPPENED ★ ALL THREE RINGS, BOTH SIDES OF THE TENT ★ ";
  return (
    <div style={{ background: T.marquee, overflow: "hidden", whiteSpace: "nowrap" }}>
      <div
        style={{
          display: "inline-block",
          padding: "6px 0",
          fontFamily: "'Archivo Black', Impact, 'Arial Black', sans-serif",
          fontSize: 12,
          letterSpacing: "0.14em",
          color: T.ink,
          animation: "tickerScroll 30s linear infinite",
        }}
      >
        {line + line}
      </div>
    </div>
  );
}

// WSJ-style tab: clean sans text with a white underline when active
function WsjTabs({ items, isActive, onSelect }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 28,
        overflowX: "auto",
        borderBottom: "1px solid rgba(255,255,255,0.15)",
        padding: "0 18px",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {items.map((item) => {
        const active = isActive(item.id);
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            style={{
              background: "none",
              border: "none",
              borderBottom: active ? "3px solid #FFFFFF" : "3px solid transparent",
              color: active ? "#FFFFFF" : "rgba(255,255,255,0.55)",
              fontFamily:
                "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
              fontSize: 17,
              fontWeight: active ? 700 : 400,
              letterSpacing: "0.01em",
              padding: "10px 2px 12px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "color 0.15s ease",
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function Pill({ active, onClick, children, activeBg, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: "10px 16px",
        borderRadius: 999,
        border: active ? `2px solid ${activeBg || T.marquee}` : "2px solid rgba(255,255,255,0.25)",
        background: active ? activeBg || T.marquee : "transparent",
        color: active ? "#fff" : "rgba(255,255,255,0.85)",
        fontFamily: "'Archivo Black', Impact, sans-serif",
        fontSize: 13,
        letterSpacing: "0.04em",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      {children}
    </button>
  );
}

function SourceBox({ side, data }) {
  const isLeft = side === "left";
  const color = isLeft ? "#2E6FB0" : "#B5382E";
  const bg = isLeft ? "rgba(46,111,176,0.07)" : "rgba(181,56,46,0.06)";
  return (
    <div
      style={{
        flex: "1 1 240px",
        background: bg,
        border: `1px solid ${color}33`,
        borderTop: `4px solid ${color}`,
        borderRadius: 5,
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontFamily: "'Archivo Black', Impact, sans-serif",
            fontSize: 11,
            letterSpacing: "0.14em",
            color: color,
          }}
        >
          {isLeft ? "FROM THE LEFT" : "FROM THE RIGHT"}
        </span>
        <span style={{ fontFamily: "Georgia, serif", fontSize: 12.5, fontWeight: 700, color: T.ink }}>
          {data.outlet}
        </span>
      </div>
      <p style={{ fontFamily: "'Spectral', Georgia, serif", fontSize: 14, lineHeight: 1.5, color: T.ink, margin: 0 }}>
        {data.framing}
      </p>
      {data.url && (
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            marginTop: 8,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
            fontSize: 12.5,
            fontWeight: 600,
            color: color,
            textDecoration: "underline",
          }}
        >
          Read their coverage →
        </a>
      )}
    </div>
  );
}

function StoryCard({ story, index }) {
  const stamp = SPIN_STAMPS[story.spinGap] || SPIN_STAMPS.medium;
  const ring = RINGS.find((r) => r.id === story.ring) || RINGS[0];
  return (
    <article
      style={{
        background: T.paper,
        borderRadius: 6,
        padding: "22px 24px 20px",
        boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
        position: "relative",
        overflow: "hidden",
        borderTop: `6px solid ${ring.color}`,
        animation: `cardIn 0.4s ease ${index * 0.08}s both`,
      }}
    >
      {/* meta row */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
        <span
          style={{
            background: ring.color,
            color: "#fff",
            fontSize: 11,
            fontFamily: "'Archivo Black', Impact, sans-serif",
            letterSpacing: "0.1em",
            padding: "3px 8px",
            borderRadius: 3,
            textTransform: "uppercase",
          }}
        >
          {ring.emoji} {ring.label}
        </span>
        {story.topic && (
          <span style={{ fontSize: 11, color: T.faded, fontFamily: "'Archivo Black', Impact, sans-serif", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            {story.topic}
          </span>
        )}
        <span style={{ fontSize: 12, color: T.faded, fontFamily: "Georgia, serif" }}>{story.date}</span>
        <span
          style={{
            marginLeft: "auto",
            border: `2px solid ${stamp.color}`,
            color: stamp.color,
            fontFamily: "'Archivo Black', Impact, sans-serif",
            fontSize: 10,
            letterSpacing: "0.06em",
            padding: "2px 8px",
            borderRadius: 4,
            transform: "rotate(1.5deg)",
            whiteSpace: "nowrap",
          }}
          title={stamp.note}
        >
          {stamp.text}
        </span>
      </div>

      {/* neutral headline */}
      <h2
        style={{
          fontFamily: "'Archivo Black', Impact, 'Arial Black', sans-serif",
          fontSize: "clamp(19px, 3.2vw, 27px)",
          lineHeight: 1.12,
          color: T.ink,
          margin: "0 0 14px",
        }}
      >
        {story.headline}
      </h2>

      {/* left vs right coverage */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        {story.left && <SourceBox side="left" data={story.left} />}
        {story.right && <SourceBox side="right" data={story.right} />}
      </div>

      {/* down the middle */}
      <div style={{ borderTop: `2px solid ${T.ink}`, paddingTop: 12 }}>
        <div
          style={{
            fontFamily: "'Archivo Black', Impact, sans-serif",
            fontSize: 11,
            letterSpacing: "0.14em",
            color: T.faded,
            marginBottom: 6,
          }}
        >
          ⚖ DOWN THE MIDDLE:
        </div>
        <p style={{ fontFamily: "'Spectral', Georgia, serif", fontSize: 15.5, lineHeight: 1.55, color: T.ink, margin: 0 }}>
          {story.middle}
        </p>
        {story.whyItMatters && (
          <p
            style={{
              fontFamily: "'Spectral', Georgia, serif",
              fontStyle: "italic",
              fontSize: 14,
              lineHeight: 1.5,
              color: "#4A4550",
              margin: "10px 0 0",
              borderLeft: `3px solid ${T.circusRed}`,
              paddingLeft: 10,
            }}
          >
            Why it matters: {story.whyItMatters}
          </p>
        )}
      </div>
    </article>
  );
}


function FieldGuide() {
  const h2 = {
    fontFamily: "'Archivo Black', Impact, 'Arial Black', sans-serif",
    fontSize: "clamp(20px, 3vw, 26px)",
    color: T.ink,
    margin: "0 0 10px",
    lineHeight: 1.15,
  };
  const p = {
    fontFamily: "'Spectral', Georgia, serif",
    fontSize: 15.5,
    lineHeight: 1.65,
    color: T.ink,
    margin: "0 0 14px",
  };
  return (
    <section style={{ background: T.paper, marginTop: 30 }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "44px 20px 30px" }}>
        <div
          style={{
            fontFamily: "'Archivo Black', Impact, sans-serif",
            fontSize: 12,
            letterSpacing: "0.22em",
            color: T.circusRed,
            marginBottom: 6,
          }}
        >
          THE FIELD GUIDE
        </div>
        <h1
          style={{
            fontFamily: "'Archivo Black', Impact, 'Arial Black', sans-serif",
            fontSize: "clamp(24px, 4vw, 34px)",
            color: T.ink,
            margin: "0 0 8px",
            lineHeight: 1.1,
          }}
        >
          How to Read the News Like a Pro
        </h1>
        <p style={{ ...p, fontStyle: "italic", color: "#4A4550" }}>
          Down the Middle does the side-by-side comparison for you, but the skill of separating fact from
          spin is worth having everywhere you read. Here's our short course.
        </p>

        <article style={{ borderTop: `2px solid ${T.ink}`, paddingTop: 22, marginTop: 22 }}>
          <h2 style={h2}>News vs. Opinion: Know Which One You're Reading</h2>
          <p style={p}>
            The single most common way readers get misled isn't fake news — it's opinion content mistaken for
            reporting. Newspapers and cable networks publish both, often side by side, and the visual difference
            can be nearly invisible. Before reacting to any article, check where it lives: reputable outlets
            label opinion pieces as "Opinion," "Editorial," "Analysis," or "Commentary," usually near the byline
            or section name. On television, prime-time shows are overwhelmingly commentary, while the daytime
            news desk is closer to straight reporting — even on the same channel.
          </p>
          <p style={p}>
            The language itself is a giveaway. Straight news answers who, what, when, and where, attributes
            claims to named sources, and keeps adjectives boring. Opinion tells you what to think about those
            facts: watch for loaded words like "disastrous," "brilliant," "so-called," or "finally," and for
            arguments about what should happen next. Neither format is bad — good opinion writing is valuable —
            but you should always know which one you're consuming, because only one of them is trying to
            persuade you.
          </p>
        </article>

        <article style={{ borderTop: "1px solid rgba(0,0,0,0.15)", paddingTop: 22, marginTop: 8 }}>
          <h2 style={h2}>Double-Check Before You Share: The Two-Minute Verification</h2>
          <p style={p}>
            Professional fact-checkers use a technique called lateral reading: instead of studying a suspicious
            article more closely, they leave it and check what other sources say about the same story and about
            the outlet itself. You can do this in under two minutes. Open a new tab and search the core claim.
            If a major event is real, multiple unrelated outlets will have it within hours; if only one site on
            earth is reporting a blockbuster story, that's a red flag, not a scoop.
          </p>
          <p style={p}>
            Next, find the original source. Most viral political stories are secondhand summaries of a court
            filing, a bill, a speech, or an agency report — all of which are public documents you can read
            yourself. A headline saying a ruling "bans" something often looks very different once you skim the
            ruling. Check the date, too: old stories recirculate during news cycles and read as breaking when
            they're years stale. And for images, a reverse image search takes seconds and catches photos
            borrowed from entirely different events.
          </p>
        </article>

        <article style={{ borderTop: "1px solid rgba(0,0,0,0.15)", paddingTop: 22, marginTop: 8 }}>
          <h2 style={h2}>Understanding Bias — Including Your Own</h2>
          <p style={p}>
            Media bias is usually less about lying and more about choosing. Outlets choose which stories to
            cover, which to skip, which expert to quote, which detail leads the headline, and which gets buried
            in paragraph nine. Two outlets can publish factually accurate stories about the same event that
            leave readers with opposite impressions — that's exactly the gap this site's "spin meter" measures.
            Story selection and framing are where the lean lives, so comparing coverage across the spectrum
            reveals more than any single outlet ever will.
          </p>
          <p style={p}>
            The harder bias to manage is your own. Confirmation bias means we scrutinize stories we dislike and
            wave through stories we agree with — so the most useful habit in media literacy is applying the same
            skepticism to news that flatters your side. If a story makes you feel triumphant or furious, that's
            the moment to slow down and verify, because emotionally satisfying stories are the ones that spread
            fastest whether or not they're true. A balanced news diet — one straight wire service like AP or
            Reuters, plus one thoughtful outlet from each side — beats any single "unbiased" source, because no
            such source exists.
          </p>
        </article>

        <p style={{ ...p, marginTop: 10, fontSize: 13.5, color: "#4A4550" }}>
          Down the Middle is an independent news-comparison tool covering all three rings of government. Every story shown
          is found via live web search of current reporting. We describe each outlet's framing in our own words,
          link to the original coverage so you can read it yourself, and summarize the verifiable facts down the
          middle. We don't accept payment for placement, and we never invent quotes or sources.
        </p>
      </div>
    </section>
  );
}

export default function ThreeRingGovernment() {
  const [mode, setMode] = useState("now");
  const [range, setRange] = useState("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [rings, setRings] = useState(RINGS.map((r) => r.id));
  const [topics, setTopics] = useState(TOPICS.map((t) => t.id));
  const [stories, setStories] = useState(null);
  const [visibleCount, setVisibleCount] = useState(3);
  // Post-search result filters (client-side, Apply-driven)
  const [showFilter, setShowFilter] = useState(false);
  const [showNarrow, setShowNarrow] = useState(false);
  const [draftRings, setDraftRings] = useState([]);   // empty = all
  const [draftTopics, setDraftTopics] = useState([]);
  const [draftSpin, setDraftSpin] = useState([]);
  const [appliedRings, setAppliedRings] = useState([]);
  const [appliedTopics, setAppliedTopics] = useState([]);
  const [appliedSpin, setAppliedSpin] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadLine, setLoadLine] = useState(LOADING_LINES[0]);
  const [error, setError] = useState("");
  const [scotus, setScotus] = useState(null);
  const [scotusFailed, setScotusFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");

  useEffect(() => {
    let alive = true;
    fetchOverturnRate()
      .then((s) => alive && setScotus(s))
      .catch(() => alive && setScotusFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const toggle = (setter) => (id) =>
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleRing = toggle(setRings);
  const toggleTopic = toggle(setTopics);

  const go = async (searchOverride) => {
    const searchQuery = typeof searchOverride === "string" ? searchOverride : "";
    if (!searchQuery) {
      if (rings.length === 0) return setError("Pick at least one ring — even a one-ring circus needs a ring.");
      if (topics.length === 0) return setError("Pick at least one topic.");
    }
    setActiveQuery(searchQuery);
    setError("");
    setLoading(true);
    setStories(null);
    setVisibleCount(3);
    setDraftRings([]); setDraftTopics([]); setDraftSpin([]);
    setAppliedRings([]); setAppliedTopics([]); setAppliedSpin([]);
    setShowFilter(false);
    const spin = setInterval(
      () => setLoadLine(LOADING_LINES[Math.floor(Math.random() * LOADING_LINES.length)]),
      1800
    );
    try {
      const result = await fetchStories({ mode, range, customFrom, customTo, rings, topics, searchQuery });
      setStories(result);
    } catch (e) {
      console.error(e);
      setError("The tent flap got stuck. Give it another shot.");
    } finally {
      clearInterval(spin);
      setLoading(false);
    }
  };

  const runSearch = () => {
    const q = query.trim();
    if (!q) return setError("Type something to search — a topic, a bill, a ruling, a name.");
    go(q);
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, ${T.stage}, ${T.stageDeep})` }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Spectral:ital,wght@0,400;0,600;1,400&display=swap');
        @keyframes tickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes cardIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes bulb { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
        button:focus-visible, input:focus-visible { outline: 3px solid ${T.marquee}; outline-offset: 2px; }
      `}</style>

      <OverturnOMeter stat={scotus} failed={scotusFailed} />
      <Ticker />
      <TentStripes />

      {/* Masthead */}
      <header style={{ textAlign: "center", padding: "34px 16px 8px" }}>
        <h1
          style={{
            fontFamily: "'Archivo Black', Impact, 'Arial Black', sans-serif",
            fontSize: "clamp(34px, 7vw, 72px)",
            lineHeight: 0.98,
            color: "#fff",
            margin: 0,
            textShadow: `4px 4px 0 ${T.circusRed}`,
          }}
        >
          DOWN THE
          <br />
          MIDDLE
        </h1>
        <BulbMarquee />
        <p
          style={{
            color: T.marquee,
            fontFamily: "'Archivo Black', Impact, sans-serif",
            fontSize: "clamp(14px, 2.2vw, 19px)",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            margin: "6px 0 8px",
          }}
        >
          Three-Ring Government • The Beltway Bulletin
        </p>
        <p style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'Spectral', Georgia, serif", fontStyle: "italic", margin: 0 }}>
          The left's take. The right's take. Then the story, down the middle — from all three rings of government.
        </p>
        <p
          style={{
            color: "rgba(255,255,255,0.55)",
            fontFamily: "'Spectral', Georgia, serif",
            fontSize: 15,
            lineHeight: 1.6,
            maxWidth: 640,
            margin: "16px auto 0",
          }}
        >
          Down the Middle — our three-ring tour of government — finds real, current stories about the Executive branch, Congress, the courts,
          and the statehouses — then shows you how a left-leaning outlet and a right-leaning outlet each covered
          the same story, with links to their original reporting and a neutral, fact-first summary in between.
          No fabricated quotes, no invented sources, no side taken.
        </p>
      </header>

      {/* Controls */}
      <section style={{ maxWidth: 820, margin: "26px auto 0", padding: "0 16px" }}>
        {/* WSJ-style section tabs */}
        <div style={{ marginBottom: 0 }}>
          <WsjTabs
            items={[
              { id: "now", label: "What Happened" },
              { id: "upcoming", label: "Coming Attractions" },
            ]}
            isActive={(id) => mode === id}
            onSelect={setMode}
          />
        </div>

        {/* SCOTUS docket strip — WSJ futures style */}
        <div style={{ margin: "0 -18px 18px" }}>
          <ScotusStrip stat={scotus} />
        </div>

        {/* Search — ask for any story, Google/Claude style */}
        <div
          style={{
            display: "flex",
            gap: 8,
            maxWidth: 640,
            margin: "0 auto 18px",
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 999,
              padding: "0 8px 0 16px",
            }}
          >
            <span aria-hidden="true" style={{ color: "rgba(255,255,255,0.55)", fontSize: 16 }}>⌕</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runSearch();
              }}
              placeholder='Search any story — "tariff ruling", "border bill", "Fed chair"…'
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#fff",
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
                fontSize: 15,
                padding: "12px 0",
                minWidth: 0,
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.55)",
                  fontSize: 16,
                  cursor: "pointer",
                  padding: "4px 6px",
                }}
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={runSearch}
            disabled={loading}
            style={{
              background: T.circusRed,
              color: "#fff",
              border: "none",
              borderRadius: 999,
              padding: "0 22px",
              fontFamily: "'Archivo Black', Impact, sans-serif",
              fontSize: 13,
              letterSpacing: "0.05em",
              cursor: loading ? "wait" : "pointer",
            }}
          >
            SEARCH
          </button>
        </div>
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.45)", fontFamily: "Georgia, serif", fontSize: 12.5, margin: "-8px 0 18px" }}>
          Search any story, or just click START THE SHOW for today's top stories. You can filter the results once they load.
        </p>

        {mode === "now" && (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 12 }}>
              {RANGES.map((r) => (
                <Pill key={r.id} active={range === r.id} onClick={() => setRange(r.id)}>
                  <span style={{ color: range === r.id ? T.ink : undefined }}>{r.label}</span>
                </Pill>
              ))}
            </div>
            {range === "custom" && (
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 12, flexWrap: "wrap" }}>
                {[
                  { v: customFrom, set: setCustomFrom, label: "From" },
                  { v: customTo, set: setCustomTo, label: "To" },
                ].map((f) => (
                  <label key={f.label} style={{ color: "rgba(255,255,255,0.8)", fontFamily: "Georgia, serif", fontSize: 14 }}>
                    {f.label}{" "}
                    <input
                      type="date"
                      value={f.v}
                      onChange={(e) => f.set(e.target.value)}
                      style={{ padding: "8px 10px", borderRadius: 6, border: "none", fontFamily: "Georgia, serif" }}
                    />
                  </label>
                ))}
              </div>
            )}
          </>
        )}

        {/* Optional: narrow what gets pulled */}
        {(() => {
          const nRings = rings.length < RINGS.length ? RINGS.length - rings.length : 0;
          const nTopics = topics.length < TOPICS.length ? TOPICS.length - topics.length : 0;
          const narrowed = (rings.length < RINGS.length || topics.length < TOPICS.length);
          const chip = (label, on, onClick, col) => (
            <button
              key={label}
              onClick={onClick}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: on ? `2px solid ${col}` : "2px solid rgba(0,0,0,0.18)",
                background: on ? col : "transparent",
                color: on ? "#fff" : T.ink,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          );
          return (
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <button
                onClick={() => setShowNarrow((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.65)",
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
                  fontSize: 14,
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                {showNarrow ? "▲" : "▼"} Narrow what I pull{narrowed ? " (on)" : " (optional)"}
              </button>

              {showNarrow && (
                <div style={{ background: T.paper, borderRadius: 10, padding: "18px 20px", marginTop: 10, textAlign: "left" }}>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontFamily: "'Archivo Black', Impact, sans-serif", fontSize: 11, letterSpacing: "0.14em", color: T.faded, marginBottom: 8 }}>BRANCHES</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {RINGS.map((r) => chip(`${r.emoji} ${r.label}`, rings.includes(r.id), () => toggleRing(r.id), r.color))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Archivo Black', Impact, sans-serif", fontSize: 11, letterSpacing: "0.14em", color: T.faded, marginBottom: 8 }}>TOPICS</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {TOPICS.map((t) => chip(t.label, topics.includes(t.id), () => toggleTopic(t.id), T.win))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <button
            onClick={go}
            disabled={loading}
            style={{
              background: T.circusRed,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "16px 34px",
              fontFamily: "'Archivo Black', Impact, sans-serif",
              fontSize: 17,
              letterSpacing: "0.06em",
              cursor: loading ? "wait" : "pointer",
              boxShadow: "0 5px 0 #7E1F1A",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? loadLine : "START THE SHOW"}
          </button>
          {error && <p style={{ color: "#FF9B9B", fontFamily: "Georgia, serif", marginTop: 12 }}>{error}</p>}
        </div>
      </section>

      {/* Results */}
      <main style={{ maxWidth: 820, margin: "0 auto", padding: "0 16px 40px", display: "grid", gap: 18 }}>
        {stories && activeQuery && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ color: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif", fontSize: 15 }}>
              Results for <strong>"{activeQuery}"</strong>
            </span>
            <button
              onClick={() => {
                setActiveQuery("");
                setQuery("");
                setStories(null);
              }}
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: 999,
                color: "rgba(255,255,255,0.75)",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
                fontSize: 12.5,
                padding: "4px 12px",
                cursor: "pointer",
              }}
            >
              ✕ Clear search
            </button>
          </div>
        )}
        {stories && stories.length === 0 && (
          <p style={{ color: "rgba(255,255,255,0.7)", textAlign: "center", fontFamily: "Georgia, serif" }}>
            Somehow… a quiet day under the big top. Try a wider date range.
          </p>
        )}
        {stories && stories.length > 0 && (() => {
          const filtered = stories.filter(
            (s) =>
              (appliedRings.length === 0 || appliedRings.includes(s.ring)) &&
              (appliedTopics.length === 0 || appliedTopics.includes(s.topic)) &&
              (appliedSpin.length === 0 || appliedSpin.includes(s.spinGap))
          );
          const activeCount = appliedRings.length + appliedTopics.length + appliedSpin.length;
          const chip = (label, on, onClick, col) => (
            <button
              key={label}
              onClick={onClick}
              style={{
                padding: "7px 13px",
                borderRadius: 999,
                border: on ? `2px solid ${col}` : "2px solid rgba(0,0,0,0.18)",
                background: on ? col : "transparent",
                color: on ? "#fff" : T.ink,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          );
          const toggleDraft = (val, list, setList) =>
            setList(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
          return (
            <>
              {/* Filter toggle */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <button
                  onClick={() => {
                    setDraftRings(appliedRings); setDraftTopics(appliedTopics); setDraftSpin(appliedSpin);
                    setShowFilter((v) => !v);
                  }}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    borderRadius: 999,
                    color: "#fff",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    padding: "9px 18px",
                    cursor: "pointer",
                  }}
                >
                  ⚙ Filter results{activeCount > 0 ? ` (${activeCount})` : ""}
                </button>
                <span style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Spectral', Georgia, serif", fontSize: 13.5 }}>
                  Showing {Math.min(filtered.length, visibleCount)} of {filtered.length}
                  {activeCount > 0 ? ` filtered` : ""} {filtered.length === 1 ? "story" : "stories"}
                </span>
              </div>

              {/* Filter panel */}
              {showFilter && (
                <div style={{ background: T.paper, borderRadius: 10, padding: "18px 20px", marginTop: 2 }}>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontFamily: "'Archivo Black', Impact, sans-serif", fontSize: 11, letterSpacing: "0.14em", color: T.faded, marginBottom: 8 }}>BRANCH</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {RINGS.map((r) => chip(`${r.emoji} ${r.label}`, draftRings.includes(r.id), () => toggleDraft(r.id, draftRings, setDraftRings), r.color))}
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontFamily: "'Archivo Black', Impact, sans-serif", fontSize: 11, letterSpacing: "0.14em", color: T.faded, marginBottom: 8 }}>TOPIC</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {TOPICS.map((t) => chip(t.label, draftTopics.includes(t.id), () => toggleDraft(t.id, draftTopics, setDraftTopics), T.win))}
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: "'Archivo Black', Impact, sans-serif", fontSize: 11, letterSpacing: "0.14em", color: T.faded, marginBottom: 8 }}>SPIN GAP</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {[["low","Mild Spin"],["medium","Spin Cycle"],["chasm","Two Different Planets"]].map(([id,label]) =>
                        chip(label, draftSpin.includes(id), () => toggleDraft(id, draftSpin, setDraftSpin), (SPIN_STAMPS[id]||{}).color || T.circusRed))}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => {
                        setAppliedRings(draftRings); setAppliedTopics(draftTopics); setAppliedSpin(draftSpin);
                        setVisibleCount(3); setShowFilter(false);
                      }}
                      style={{ background: T.circusRed, color: "#fff", border: "none", borderRadius: 8, padding: "11px 26px", fontFamily: "'Archivo Black', Impact, sans-serif", fontSize: 14, letterSpacing: "0.04em", cursor: "pointer" }}
                    >
                      APPLY
                    </button>
                    <button
                      onClick={() => { setDraftRings([]); setDraftTopics([]); setDraftSpin([]); }}
                      style={{ background: "transparent", color: T.faded, border: `1px solid ${T.faded}`, borderRadius: 8, padding: "11px 20px", fontFamily: "-apple-system, sans-serif", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {filtered.length === 0 && (
                <p style={{ color: "rgba(255,255,255,0.7)", textAlign: "center", fontFamily: "Georgia, serif" }}>
                  No stories match these filters. <button onClick={() => { setAppliedRings([]); setAppliedTopics([]); setAppliedSpin([]); }} style={{ background: "none", border: "none", color: "#7ED0E0", cursor: "pointer", fontFamily: "Georgia, serif", fontSize: 15, textDecoration: "underline" }}>Clear filters</button>
                </p>
              )}

              {filtered.slice(0, visibleCount).map((s, i) => <StoryCard key={i} story={s} index={i} />)}

              {filtered.length > visibleCount && (
                <div style={{ textAlign: "center", marginTop: 4 }}>
                  <button
                    onClick={() => setVisibleCount((c) => c + 3)}
                    style={{ background: "transparent", color: "#fff", border: "2px solid rgba(255,255,255,0.4)", borderRadius: 999, padding: "12px 30px", fontFamily: "'Archivo Black', Impact, sans-serif", fontSize: 14, letterSpacing: "0.05em", cursor: "pointer" }}
                  >
                    SHOW MORE ({filtered.length - visibleCount} MORE)
                  </button>
                </div>
              )}
            </>
          );
        })()}
      </main>

      <FieldGuide />

      <InstagramFeed />

      <footer style={{ textAlign: "center", padding: "24px 16px 34px", color: "rgba(255,255,255,0.45)", fontFamily: "Georgia, serif", fontSize: 12.5 }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 16px", marginBottom: 14 }}>
          {[["/blog/index.html", "Blog"], ["/media-literacy.html", "Media Literacy Guide"], ["/about.html", "About"], ["/contact.html", "Contact"], ["/privacy.html", "Privacy"], ["/terms.html", "Terms"]].map(([href, label]) => (
            <a key={href} href={href} style={{ color: "rgba(233,241,251,0.75)", textDecoration: "none", fontSize: 12.5 }}>{label}</a>
          ))}
        </div>
        Every story is real and found via live web search. "From the Left" and "From the Right" describe each
        outlet's framing in our own words — tap through to read their actual coverage. "Down the Middle" is a
        neutral summary of what verifiably happened. Quotes are never invented.
      </footer>
    </div>
  );
}
