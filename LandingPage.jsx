import { useState, useEffect, useRef, useMemo } from "react";

// ── Motion cards for scatter animation ────────────────────────────────────────
const MOTION_CARDS = [
  { text: "THW ban fossil fuel lobbying", theme: "Environment" },
  { text: "TH supports universal basic income", theme: "Economics" },
  { text: "THW abolish the death penalty", theme: "Criminal Justice" },
  { text: "THBT social media harms democracy", theme: "Technology" },
  { text: "THW legalise all drugs", theme: "Criminal Justice" },
  { text: "TH supports open borders", theme: "Human Rights" },
  { text: "THBT AI will destroy more jobs than it creates", theme: "Technology" },
  { text: "THW make voting compulsory", theme: "International Relations" },
  { text: "TH supports nuclear energy", theme: "Environment" },
  { text: "THBT celebrity culture is harmful", theme: "Human Rights" },
  { text: "THW criminalise climate denial", theme: "Environment" },
  { text: "THW tax the ultra-wealthy at 90%", theme: "Economics" },
];

const THEME_COLORS = {
  "Environment": "#16a34a",
  "Economics": "#0284c7",
  "Criminal Justice": "#dc2626",
  "Technology": "#7c3aed",
  "Human Rights": "#0891b2",
  "International Relations": "#d97706",
};

function MotionCard({ card, target, phase }) {
  const [hovered, setHovered] = useState(false);
  const color = THEME_COLORS[card.theme] || "#666";
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        width: "155px",
        minHeight: "78px",
        transform: `translate(${target.x}px, ${target.y}px) rotate(${target.rotation}deg) scale(${target.scale})`,
        opacity: target.opacity,
        transition: phase === "scatter"
          ? "none"
          : "transform 1.1s cubic-bezier(.34,1.56,.64,1), opacity 0.8s ease",
        background: "white",
        borderRadius: "10px",
        border: `1px solid ${hovered ? color : "#e5e5e5"}`,
        boxShadow: hovered ? `0 8px 28px rgba(0,0,0,0.13)` : "0 2px 10px rgba(0,0,0,0.07)",
        padding: "11px",
        cursor: "default",
        userSelect: "none",
        zIndex: hovered ? 10 : 1,
      }}
    >
      <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color, marginBottom: "5px", fontFamily: "'DM Sans',sans-serif" }}>{card.theme}</div>
      <div style={{ fontSize: "11px", fontWeight: 600, lineHeight: 1.4, color: "#111", fontFamily: "'DM Sans',sans-serif" }}>{card.text}</div>
    </div>
  );
}

function CardAnimation() {
  const [phase, setPhase] = useState("scatter");
  const containerRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const TOTAL = MOTION_CARDS.length;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.offsetWidth, h: el.offsetHeight }));
    ro.observe(el);
    setSize({ w: el.offsetWidth, h: el.offsetHeight });
    return () => ro.disconnect();
  }, []);

  const scatterPositions = useMemo(() => MOTION_CARDS.map(() => ({
    x: (Math.random() - 0.5) * 1000,
    y: (Math.random() - 0.5) * 600,
    rotation: (Math.random() - 0.5) * 80,
    scale: 0.4, opacity: 0,
  })), []);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("line"), 500);
    const t2 = setTimeout(() => setPhase("circle"), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  function getTarget(i) {
    if (phase === "scatter") return scatterPositions[i];
    if (phase === "line") {
      const sp = 175;
      return { x: i * sp - (TOTAL * sp) / 2, y: 0, rotation: 0, scale: 1, opacity: 1 };
    }
    const r = Math.min(size.w, size.h) * 0.34;
    const angle = (i / TOTAL) * Math.PI * 2 - Math.PI / 2;
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r, rotation: (i / TOTAL) * 360, scale: 0.82, opacity: 1 };
  }

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      {MOTION_CARDS.map((card, i) => <MotionCard key={i} card={card} target={getTarget(i)} phase={phase} />)}
    </div>
  );
}

function BlurText({ text, delay = 0, style = {}, tag = "span" }) {
  const Tag = tag;
  return (
    <Tag style={{ display: "inline", ...style }}>
      {text.split(" ").map((w, i) => (
        <span key={i} style={{ display: "inline-block", opacity: 0, filter: "blur(8px)", transform: "translateY(10px)", animation: "dvWordIn 0.55s cubic-bezier(.22,1,.36,1) forwards", animationDelay: `${delay + i * 0.07}s`, marginRight: "0.28em" }}>{w}</span>
      ))}
    </Tag>
  );
}

const TICKER = ["THW ban social media for under-16s", "TH supports affirmative action", "THW abolish nuclear weapons", "THBT capitalism has failed the working class", "THW mandate organ donation", "TH supports a global carbon tax", "THBT the UN Security Council should be abolished", "THW decriminalise sex work", "TH supports assisted dying", "THBT China's rise is good for the world"];

function Ticker({ direction = 1 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let x = direction > 0 ? 0 : -(el.scrollWidth / 2);
    let id;
    function tick() {
      x -= 0.45 * direction;
      if (direction > 0 && Math.abs(x) >= el.scrollWidth / 2) x = 0;
      if (direction < 0 && x <= -(el.scrollWidth / 2)) x = 0;
      el.style.transform = `translateX(${x}px)`;
      id = requestAnimationFrame(tick);
    }
    tick();
    return () => cancelAnimationFrame(id);
  }, [direction]);
  const items = [...TICKER, ...TICKER];
  return (
    <div style={{ overflow: "hidden", width: "100%" }}>
      <div ref={ref} style={{ display: "flex", width: "max-content" }}>
        {items.map((m, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: "12px", padding: "0 24px", fontSize: "12px", fontWeight: 500, color: "#888", whiteSpace: "nowrap", fontFamily: "'DM Sans',sans-serif" }}>
            <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#ccc", flexShrink: 0 }} />{m}
          </span>
        ))}
      </div>
    </div>
  );
}

function Feature({ icon, title, desc, dark, delay = 0 }) {
  const [vis, setVis] = useState(false);
  const [hov, setHov] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.12 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ padding: "28px", borderRadius: "10px", border: `1px solid ${hov ? (dark ? "#383838" : "#d0d0d0") : (dark ? "#222" : "#eaeaea")}`, background: dark ? (hov ? "#181818" : "#111") : (hov ? "#fafafa" : "#fff"), transition: "all 0.22s ease", transform: vis ? "translateY(0)" : "translateY(18px)", opacity: vis ? 1 : 0, transitionDelay: `${delay}s`, cursor: "default" }}>
      <div style={{ fontSize: "20px", marginBottom: "14px", display: "inline-flex", alignItems: "center", justifyContent: "center", width: "38px", height: "38px", borderRadius: "7px", background: dark ? "#1a1a1a" : "#f5f5f5", border: `1px solid ${dark ? "#2a2a2a" : "#ebebeb"}`, transition: "transform 0.2s", transform: hov ? "scale(1.1)" : "scale(1)" }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "7px", color: dark ? "#f0f0f0" : "#111" }}>{title}</div>
      <div style={{ fontSize: "13px", lineHeight: 1.7, color: dark ? "#666" : "#888" }}>{desc}</div>
    </div>
  );
}

function Stat({ value, suffix = "", label, dark, delay = 0 }) {
  const [n, setN] = useState(0);
  const [vis, setVis] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.5 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!vis) return;
    const to = setTimeout(() => {
      const end = parseInt(value);
      const id = setInterval(() => {
        setN(p => { const next = Math.min(p + Math.ceil(end / 60), end); if (next >= end) clearInterval(id); return next; });
      }, 16);
    }, delay * 1000);
    return () => clearTimeout(to);
  }, [vis]);
  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div style={{ fontSize: "clamp(40px,6vw,64px)", fontWeight: 900, fontFamily: "'Playfair Display',serif", lineHeight: 1, color: dark ? "#f0f0f0" : "#111" }}>{n}{suffix}</div>
      <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: dark ? "#444" : "#bbb", marginTop: "8px" }}>{label}</div>
    </div>
  );
}

function ThemeToggle({ dark, setDark }) {
  return (
    <div onClick={() => setDark(d => !d)} style={{ display: "flex", width: "54px", height: "28px", padding: "3px", borderRadius: "100px", cursor: "pointer", transition: "all 0.3s", background: dark ? "#1a1a1a" : "#efefef", border: `1px solid ${dark ? "#333" : "#ddd"}`, alignItems: "center" }}>
      <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: dark ? "#333" : "#e0e0e0", transform: dark ? "translateX(0)" : "translateX(24px)", transition: "transform 0.3s cubic-bezier(.34,1.56,.64,1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px" }}>
        {dark ? "🌙" : "☀️"}
      </div>
    </div>
  );
}

export default function LandingPage({ onEnter, dark, setDark }) {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const bg = dark ? "#0a0a0a" : "#fafafa";
  const text = dark ? "#f0f0f0" : "#111";
  const muted = dark ? "#555" : "#999";
  const border = dark ? "#222" : "#e8e8e8";
  const surface = dark ? "#111" : "#fff";
  const navBg = scrollY > 20 ? (dark ? "rgba(10,10,10,0.92)" : "rgba(250,250,250,0.92)") : "transparent";

  const FEATURES = [
    { icon: "🗂", title: "750+ Motions", desc: "Every major WSDC tournament motion catalogued by theme, sub-theme, and difficulty.", delay: 0 },
    { icon: "✦", title: "AI Generation", desc: "Generate structured prop and opp cases with mechanisms and impacts in one click.", delay: 0.05 },
    { icon: "⏱", title: "Prep Timer", desc: "WSDC, CNDF, and BP format timers with phase-based coaching alerts.", delay: 0.1 },
    { icon: "📰", title: "Live News", desc: "10 RSS sources filtered by debate theme — stay current on what matters.", delay: 0.15 },
    { icon: "🔗", title: "Logic Chain", desc: "Map your argument step by step. AI finds your weakest link before your opponent does.", delay: 0.2 },
    { icon: "🔍", title: "Smart Search", desc: "Search by keyword or synonym. Finds motions even when wording is unclear.", delay: 0.25 },
  ];

  return (
    <div style={{ background: bg, color: text, fontFamily: "'DM Sans',sans-serif", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');
        @keyframes dvWordIn { to { opacity:1; filter:blur(0); transform:translateY(0); } }
        @keyframes dvFadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes dvFadeIn { from { opacity:0; } to { opacity:1; } }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:${dark?"#333":"#ddd"}; border-radius:2px; }
        .dv-btn:hover { opacity:0.8; transform:translateY(-1px); }
        .dv-btn { transition: all 0.2s ease; }
        @media(max-width:768px){.hero-grid{grid-template-columns:1fr!important;}.hero-right{min-height:50vh!important;}.step-grid{grid-template-columns:1fr!important;}.step-item{border-right:none!important;border-bottom:1px solid ${border}!important;}.prop-grid{grid-template-columns:1fr!important;}}
      `}</style>

      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: "56px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 clamp(20px,5vw,64px)", background: navBg, backdropFilter: scrollY > 20 ? "blur(16px)" : "none", borderBottom: scrollY > 20 ? `1px solid ${border}` : "none", transition: "all 0.3s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: dark ? "#1a1a1a" : "#111", border: `1px solid ${dark?"#333":"#222"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px" }}>⚖</div>
          <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "15px" }}>DebateVault</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <ThemeToggle dark={dark} setDark={setDark} />
          <button className="dv-btn" onClick={onEnter} style={{ padding: "8px 20px", borderRadius: "7px", border: "none", cursor: "pointer", background: dark ? "#fff" : "#111", color: dark ? "#111" : "#fff", fontSize: "13px", fontWeight: 600, fontFamily: "inherit" }}>Enter App</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "100vh", paddingTop: "56px" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px clamp(24px,5vw,72px)", borderRight: `1px solid ${border}` }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", marginBottom: "28px", animation: "dvFadeIn 0.6s ease 0.1s both", opacity: 0 }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#16a34a" }} />
            <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: muted }}>World Schools Debate</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(40px,5vw,68px)", fontWeight: 900, lineHeight: 1.06, letterSpacing: "-2px", marginBottom: "22px" }}>
            <BlurText text="Every argument." delay={0.3} /><br />
            <span style={{ fontStyle: "italic", color: muted }}><BlurText text="Every motion." delay={0.7} /></span>
          </h1>
          <p style={{ fontSize: "15px", lineHeight: 1.8, color: muted, maxWidth: "380px", marginBottom: "36px", animation: "dvFadeUp 0.7s ease 1.2s both", opacity: 0 }}>
            The first WSDC argument database. Search, generate, and master every topic before you step into the round.
          </p>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", animation: "dvFadeUp 0.7s ease 1.5s both", opacity: 0 }}>
            <button className="dv-btn" onClick={onEnter} style={{ padding: "12px 26px", borderRadius: "7px", border: "none", background: dark ? "#fff" : "#111", color: dark ? "#111" : "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Start for free →</button>
            <button className="dv-btn" onClick={onEnter} style={{ padding: "12px 26px", borderRadius: "7px", border: `1px solid ${border}`, background: "transparent", color: text, fontSize: "14px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Browse motions</button>
          </div>
          <div style={{ display: "flex", gap: "16px", marginTop: "44px", animation: "dvFadeIn 0.6s ease 1.8s both", opacity: 0 }}>
            {[["#16a34a","Proposition"],["#dc2626","Opposition"],["#0284c7","Analysis"]].map(([c,l])=>(
              <div key={l} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "2px", background: c }} />
                <span style={{ fontSize: "12px", color: muted, fontWeight: 500 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-right" style={{ position: "relative", minHeight: "100vh", background: dark ? "#0d0d0d" : "#f4f4f4" }}>
          <CardAnimation />
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse at center, transparent 35%, ${dark?"#0d0d0d":"#f4f4f4"} 100%)` }} />
        </div>
      </section>

      {/* Ticker */}
      <div style={{ borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`, padding: "13px 0", overflow: "hidden" }}>
        <Ticker direction={1} />
      </div>

      {/* Stats */}
      <section style={{ padding: "72px clamp(24px,5vw,80px)", borderBottom: `1px solid ${border}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "40px", maxWidth: "760px", margin: "0 auto" }}>
          <Stat value="750" suffix="+" label="Motions" dark={dark} delay={0} />
          <Stat value="7" label="Themes" dark={dark} delay={0.1} />
          <Stat value="10" label="News Sources" dark={dark} delay={0.2} />
          <Stat value="100" suffix="%" label="Free" dark={dark} delay={0.3} />
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: "72px clamp(24px,5vw,80px)", borderBottom: `1px solid ${border}` }}>
        <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: muted, marginBottom: "10px" }}>Features</p>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.1, marginBottom: "44px" }}>Built for serious debaters</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(275px,1fr))", gap: "10px" }}>
            {FEATURES.map((f, i) => <Feature key={i} {...f} dark={dark} />)}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "72px clamp(24px,5vw,80px)", borderBottom: `1px solid ${border}` }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: muted, marginBottom: "10px" }}>Process</p>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.1, marginBottom: "44px" }}>Prep faster. Argue sharper.</h2>
          <div className="step-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
            {[
              { n: "01", title: "Find your motion", desc: "Search 750+ motions by keyword or browse by theme and difficulty." },
              { n: "02", title: "Generate your case", desc: "One click gives you full prop and opp arguments with mechanisms and impacts." },
              { n: "03", title: "Stress test", desc: "Build your logic chain. AI finds the weakest link before your opponent does." },
              { n: "04", title: "Step into the round", desc: "Use the prep timer and news feed to stay sharp right up until you speak." },
            ].map((s, i, arr) => (
              <div key={i} className="step-item" style={{ padding: "28px 24px", borderRight: i < arr.length - 1 ? `1px solid ${border}` : "none" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: muted, letterSpacing: ".08em", marginBottom: "14px" }}>{s.n}</div>
                <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "9px", lineHeight: 1.3 }}>{s.title}</div>
                <div style={{ fontSize: "13px", color: muted, lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prop/Opp sample */}
      <section style={{ padding: "72px clamp(24px,5vw,80px)", borderBottom: `1px solid ${border}` }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: muted, marginBottom: "10px" }}>Both sides</p>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, letterSpacing: "-1px", lineHeight: 1.1, marginBottom: "36px" }}>Proposition & Opposition</h2>
          <div className="prop-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ padding: "26px", borderRadius: "10px", background: surface, border: `1px solid #16a34a33` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "14px" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "2px", background: "#16a34a" }} />
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#16a34a" }}>Proposition</span>
              </div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: dark?"#e0e0e0":"#222", marginBottom: "7px" }}>Practical: Economic efficiency</div>
              <div style={{ fontSize: "13px", lineHeight: 1.75, color: muted }}>What this looks like in practice is a world where the price mechanism accurately reflects the true cost of carbon-intensive activity, creating incentives across every sector to innovate towards cleaner alternatives without requiring heavy-handed regulation.</div>
            </div>
            <div style={{ padding: "26px", borderRadius: "10px", background: surface, border: `1px solid #dc262633` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "14px" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "2px", background: "#dc2626" }} />
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#dc2626" }}>Opposition</span>
              </div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: dark?"#e0e0e0":"#222", marginBottom: "7px" }}>Principled: Disproportionate burden</div>
              <div style={{ fontSize: "13px", lineHeight: 1.75, color: muted }}>The mechanism punishes ordinary households who have no realistic alternative to current energy sources. A flat carbon tax is fundamentally regressive — it takes a larger share of income from those least responsible for emissions, violating basic principles of distributive justice.</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "100px clamp(24px,5vw,80px)", textAlign: "center" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: muted, marginBottom: "18px" }}>Get started</p>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(34px,6vw,68px)", fontWeight: 900, letterSpacing: "-2px", lineHeight: 1.05, marginBottom: "20px", maxWidth: "660px", margin: "0 auto 20px" }}>Ready to win your next round?</h2>
        <p style={{ color: muted, fontSize: "15px", maxWidth: "380px", margin: "0 auto 36px", lineHeight: 1.7 }}>Join debaters who prep smarter and walk into every round with confidence.</p>
        <button className="dv-btn" onClick={onEnter} style={{ padding: "14px 34px", borderRadius: "8px", border: "none", background: dark?"#fff":"#111", color: dark?"#111":"#fff", fontSize: "15px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Enter DebateVault — it's free →</button>
      </section>

      {/* Footer */}
      <footer style={{ padding: "24px clamp(24px,5vw,80px)", borderTop: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "22px", height: "22px", borderRadius: "6px", background: dark?"#1a1a1a":"#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px" }}>⚖</div>
          <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "13px" }}>DebateVault</span>
        </div>
        <span style={{ fontSize: "12px", color: muted }}>The world's first WSDC argument database.</span>
        <button onClick={onEnter} className="dv-btn" style={{ background: "none", border: "none", color: muted, fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Enter App →</button>
      </footer>
    </div>
  );
}
