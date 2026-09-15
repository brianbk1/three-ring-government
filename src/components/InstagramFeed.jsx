import React, { useState, useEffect } from "react";

/**
 * InstagramFeed — Down the Middle
 * ----------------------------------------------------------------------------
 * Live Instagram grid pulled from a Behold JSON feed, styled to match the
 * "Three-Ring Government" theme (navy stage, Archivo Black labels, circus red).
 *
 * No external script, no exposed tokens — Behold serves a safe public JSON feed
 * and refreshes it automatically (once/day on the free plan, up to 6 posts).
 *
 * Save this at: src/components/InstagramFeed.jsx
 */

const FEED_ID = "j7sCS0feKti2qVleTMQu"; // downthemiddle.ai Behold JSON feed
const IG_URL = "https://instagram.com/downthemiddle.ai"; // update if handle differs

// Local theme tokens (mirrors App.jsx's `T`)
const C = {
  paper: "#FCFDFF",
  marquee: "#E9F1FB",
  ink: "#151C28",
  faded: "#5F6B7C",
  red: "#B5382E",
  redDeep: "#7E1F1A",
};

export default function InstagramFeed({ feedId = FEED_ID, limit = 6 }) {
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    let active = true;
    setStatus("loading");

    fetch(`https://feeds.behold.so/${feedId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Behold feed request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        // Behold may return a bare array or an object with a `posts` key.
        const items = Array.isArray(data) ? data : data?.posts ?? [];
        setPosts(items.slice(0, limit));
        setStatus("ready");
      })
      .catch((err) => {
        if (!active) return;
        console.error(err);
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [feedId, limit]);

  // --- helpers ---------------------------------------------------------------
  const imageFor = (p) =>
    p?.sizes?.medium?.mediaUrl ||
    p?.sizes?.small?.mediaUrl ||
    p?.thumbnailUrl ||
    p?.mediaUrl ||
    "";

  const isVideo = (p) => p?.mediaType === "VIDEO" || p?.isReel === true;

  const altFor = (p) =>
    (p?.prunedCaption || p?.caption || "Instagram post").split("\n")[0].slice(0, 120);

  // --- shared styles ---------------------------------------------------------
  const wrap = { maxWidth: 820, margin: "0 auto", padding: "10px 16px 44px" };
  const label = {
    fontFamily: "'Archivo Black', Impact, sans-serif",
    fontSize: 12,
    letterSpacing: "0.16em",
    color: C.marquee,
    textAlign: "center",
    marginBottom: 16,
  };
  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: 10,
  };

  // --- render ----------------------------------------------------------------
  return (
    <section style={wrap} aria-label="Instagram feed">
      {/* scoped hover + shimmer, since inline styles can't do :hover/@keyframes */}
      <style>{`
        @keyframes dtmPulse { 0%,100% { opacity: 0.35 } 50% { opacity: 0.6 } }
        .dtm-ig-tile img { transition: transform .3s ease; display:block; width:100%; height:100%; object-fit:cover; }
        .dtm-ig-tile:hover img { transform: scale(1.06); }
        .dtm-ig-skel { animation: dtmPulse 1.4s ease-in-out infinite; }
        .dtm-ig-follow:hover { filter: brightness(1.06); }
      `}</style>

      <div style={label}>🎪 FOLLOW THE SHOW ON INSTAGRAM</div>

      {status === "error" ? (
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.7)", fontFamily: "Georgia, serif", fontSize: 15 }}>
          Couldn&apos;t load Instagram right now.{" "}
          <a href={IG_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#7ED0E0" }}>
            View on Instagram →
          </a>
        </p>
      ) : (
        <div style={grid}>
          {status === "loading"
            ? Array.from({ length: limit }).map((_, i) => (
                <div
                  key={i}
                  className="dtm-ig-skel"
                  style={{ aspectRatio: "1 / 1", borderRadius: 10, background: "rgba(233,241,251,0.18)" }}
                />
              ))
            : posts.map((p) => (
                <a
                  key={p.id}
                  className="dtm-ig-tile"
                  href={p.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={altFor(p)}
                  style={{
                    position: "relative",
                    display: "block",
                    aspectRatio: "1 / 1",
                    borderRadius: 10,
                    overflow: "hidden",
                    background: "rgba(0,0,0,0.25)",
                  }}
                >
                  <img src={imageFor(p)} alt={altFor(p)} loading="lazy" />
                  {isVideo(p) && (
                    <span
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 999,
                        fontFamily: "-apple-system, sans-serif",
                      }}
                    >
                      ▶ {p.isReel ? "Reel" : "Video"}
                    </span>
                  )}
                </a>
              ))}
        </div>
      )}

      {status !== "error" && (
        <div style={{ textAlign: "center", marginTop: 22 }}>
          <a
            className="dtm-ig-follow"
            href={IG_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: C.red,
              color: "#fff",
              textDecoration: "none",
              borderRadius: 8,
              padding: "12px 26px",
              fontFamily: "'Archivo Black', Impact, sans-serif",
              fontSize: 14,
              letterSpacing: "0.05em",
              boxShadow: `0 5px 0 ${C.redDeep}`,
            }}
          >
            @downthemiddle.ai
          </a>
        </div>
      )}
    </section>
  );
}
