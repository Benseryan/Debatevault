import React, { useState, useEffect } from "react";
import LandingPage from "./LandingPage";

const SUPABASE_URL = "https://rajnjpvmllximwhrdhea.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJham5qcHZtbGx4aW13aHJkaGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTQxNTgsImV4cCI6MjA4ODIzMDE1OH0.Z8tVtTrNPoHF0eGPzoBQb_rdXvZ-8E_mvlJBCVTN1XU";
const ADMIN_PASSWORD = "debatevault2024";

const db = {
  async getAll() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/motions?select=*&order=created_at.desc`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    });
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  },
  async insert(motion, serviceKey) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/motions`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(motion)
    });
    if (!res.ok) throw new Error("Failed to insert");
    return res.json();
  },
  async delete(id, serviceKey) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/motions?id=eq.${id}`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${serviceKey}` }
    });
    if (!res.ok) throw new Error("Failed to delete");
  }
};

const THEME_TREE = {
  "Economics": ["Taxation","Labour & Employment","Trade & Globalisation","Welfare & Inequality","Corporate & Markets"],
  "Environment": ["Climate Change","Energy Policy","Conservation","Pollution","Sustainable Development"],
  "Technology": ["Artificial Intelligence","Social Media","Privacy & Surveillance","Biotech & Medicine","Digital Economy"],
  "International Relations": ["War & Conflict","Diplomacy & Sanctions","International Institutions","Foreign Aid","Nuclear & Security"],
  "Criminal Justice": ["Policing & Reform","Punishment & Prisons","Drug Policy","Restorative Justice","Youth Crime"],
  "Human Rights": ["Civil Liberties","Gender & Identity","Immigration & Refugees","Indigenous Rights","Freedom of Expression"],
  "Health": ["Healthcare Systems","Mental Health","Public Health Policy","Medical Ethics","Addiction & Harm Reduction"],
};
const THEMES = ["All Themes", ...Object.keys(THEME_TREE)];
const DIFFICULTIES = ["All","Easy","Medium","Hard"];

const NEWS_SOURCES = [
  { id: "bbc-world",    name: "BBC World",         url: "https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/news/world/rss.xml",           themes: ["International Relations","Human Rights"] },
  { id: "bbc-business", name: "BBC Business",      url: "https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/news/business/rss.xml",         themes: ["Economics"] },
  { id: "bbc-science",  name: "BBC Science",       url: "https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/news/science_and_environment/rss.xml", themes: ["Environment","Technology","Health"] },
  { id: "reuters",      name: "Reuters",           url: "https://api.rss2json.com/v1/api.json?rss_url=https://feeds.reuters.com/reuters/topNews",               themes: ["International Relations","Economics"] },
  { id: "aljazeera",    name: "Al Jazeera",        url: "https://api.rss2json.com/v1/api.json?rss_url=https://www.aljazeera.com/xml/rss/all.xml",              themes: ["International Relations","Human Rights"] },
  { id: "guardian-world","name":"The Guardian",    url: "https://api.rss2json.com/v1/api.json?rss_url=https://www.theguardian.com/world/rss",                  themes: ["Human Rights","International Relations"] },
  { id: "guardian-env", name: "Guardian Environment", url: "https://api.rss2json.com/v1/api.json?rss_url=https://www.theguardian.com/environment/rss",         themes: ["Environment"] },
  { id: "fp",           name: "Foreign Policy",    url: "https://api.rss2json.com/v1/api.json?rss_url=https://foreignpolicy.com/feed/",                        themes: ["International Relations"] },
  { id: "hrw",          name: "Human Rights Watch",url: "https://api.rss2json.com/v1/api.json?rss_url=https://www.hrw.org/rss/news",                           themes: ["Human Rights","Criminal Justice"] },
  { id: "economist",    name: "The Economist",     url: "https://api.rss2json.com/v1/api.json?rss_url=https://www.economist.com/sections/economics/rss.xml",   themes: ["Economics"] },
];

const SYNONYMS = {
  "tesla":["electric","ev","vehicle","subsidies","car","cars"],"car":["vehicle","ev","electric","transport","tesla"],"cars":["vehicle","ev","electric","transport","tesla","subsidies"],"electric":["ev","vehicle","tesla","green","car"],"ev":["electric","vehicle","tesla","subsidies","car"],"warming":["climate","carbon","environment","emissions"],"pollution":["carbon","climate","environment","emissions"],"tiktok":["social","media","youth","mental","health","ban"],"instagram":["social","media","youth","mental","health"],"facebook":["social","media","youth","mental","health"],"phone":["social","media","technology","youth"],"weed":["drugs","legalisation","cannabis","harm"],"cannabis":["drugs","legalisation","harm","reduction"],"marijuana":["drugs","legalisation","cannabis"],"war":["international","conflict","peace","military"],"prison":["criminal","justice","incarceration","punishment"],"poverty":["economics","income","inequality","welfare"],"immigration":["refugees","borders","international","rights"],"abortion":["rights","autonomy","women","reproductive"],"speech":["censorship","expression","rights","freedom"],
};

function runSearch(query, motions) {
  const q = query.toLowerCase().trim();
  if (!q) return motions;
  const words = q.split(/\s+/);
  const terms = new Set(words);
  words.forEach(w => { if (SYNONYMS[w]) SYNONYMS[w].forEach(s => terms.add(s)); });
  Object.keys(SYNONYMS).forEach(key => { if (q.includes(key)) SYNONYMS[key].forEach(s => terms.add(s)); });
  return motions.map(m => {
    let score = 0;
    const title = m.motion.toLowerCase();
    const theme = m.theme.toLowerCase();
    const kws = (m.keywords || []).join(" ").toLowerCase();
    const propArgs = m.prop_args || m.propArgs || [];
    const oppArgs = m.opp_args || m.oppArgs || [];
    const args = [...propArgs, ...oppArgs].map(a => (a.name + " " + a.summary).toLowerCase()).join(" ");
    terms.forEach(t => { if (title.includes(t)) score += 12; if (theme.includes(t)) score += 7; if (kws.includes(t)) score += 6; if (args.includes(t)) score += 2; });
    if (title.includes(q)) score += 25;
    return { m, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).map(x => x.m);
}

// Theme and difficulty colors — work for both light and dark
const TC = {"Environment":"#2d6a4f","Technology":"#1a4a7a","International Relations":"#5a3e8a","Criminal Justice":"#7a3e3e","Economics":"#7a6200","Human Rights":"#1a6a6a","Gender & Identity":"#6a2d6a","Health":"#2d5a7a"};
const DC = {"Easy":"#2d6a4f","Medium":"#7a6200","Hard":"#7a3e3e"};

// V2 — editorial, clean, black/white/grey
const DARK = {
  bg: "#0a0a0a", surface: "#111111", surface2: "#161616", surface3: "#1a1a1a",
  border: "#222222", border2: "#2a2a2a", border3: "#333333",
  text: "#f0f0f0", textSub: "#aaaaaa", textMuted: "#666666", textFaint: "#444444",
  nav: "rgba(10,10,10,0.92)", accent: "#0284c7", accentText: "#38bdf8",
  prop: "#16a34a", opp: "#dc2626", propBg: "rgba(22,163,74,.08)", oppBg: "rgba(220,38,38,.08)",
  propBorder: "rgba(22,163,74,.2)", oppBorder: "rgba(220,38,38,.2)",
  scrollThumb: "#333", placeholder: "#555",
};
const LIGHT = {
  bg: "#fafafa", surface: "#ffffff", surface2: "#f5f5f5", surface3: "#efefef",
  border: "#e8e8e8", border2: "#dddddd", border3: "#cccccc",
  text: "#111111", textSub: "#555555", textMuted: "#999999", textFaint: "#bbbbbb",
  nav: "rgba(250,250,250,0.92)", accent: "#0284c7", accentText: "#0284c7",
  prop: "#16a34a", opp: "#dc2626", propBg: "rgba(22,163,74,.06)", oppBg: "rgba(220,38,38,.06)",
  propBorder: "rgba(22,163,74,.2)", oppBorder: "rgba(220,38,38,.2)",
  scrollThumb: "#ddd", placeholder: "#bbb",
};

const EMPTY_FORM = {motion:"",theme:"Economics",subtheme:"",keywords:"",tournament:"",difficulty:"Medium",propArgs:[{name:"",summary:"",type:"Practical"}],oppArgs:[{name:"",summary:"",type:"Practical"}]};

export default function App() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem("debatevault-theme");
    return saved !== null ? saved === "dark" : true;
  });
  const [showLanding, setShowLanding] = useState(() => !sessionStorage.getItem("dv-entered"));
  const [intro, setIntro] = useState(true);
  const [introPhase, setIntroPhase] = useState(0); // 0=logo, 1=tagline, 2=zoom out, 3=done
  const T = dark ? DARK : LIGHT;

  const [motions, setMotions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [view, setView] = useState("browse");
  const [selected, setSelected] = useState(null);
  const [side, setSide] = useState("prop");
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState([]);
  const [filterTheme, setFilterTheme] = useState("All Themes");
  const [filterDiff, setFilterDiff] = useState("All");
  const [filterSubtheme, setFilterSubtheme] = useState("All");
  const [adminTab, setAdminTab] = useState("add");
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiKeySet, setApiKeySet] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [serviceKey, setServiceKey] = useState("");
  const [serviceKeySet, setServiceKeySet] = useState(false);
  const [skInput, setSkInput] = useState("");

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerEndTime, setTimerEndTime] = useState(null);
  const [timerRemaining, setTimerRemaining] = useState(null);
  const [timerFormat, setTimerFormat] = useState("WSDC");
  const [timerSide, setTimerSide] = useState("Proposition");
  const [timerMotion, setTimerMotion] = useState("");
  const [timerCustom, setTimerCustom] = useState(15);
  const timerRef = React.useRef(null);

  // News state
  const [newsArticles, setNewsArticles] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState(false);
  const [newsFilter, setNewsFilter] = useState("All");
  const [newsSourceFilter, setNewsSourceFilter] = useState("All");
  const [newsLoaded, setNewsLoaded] = useState(false);

  // Logic chain state
  const BLOCK_TYPES = [
    { type: "Claim",     color: "#0284c7", bg: "rgba(2,132,199,.12)",   desc: "The 'What' — your core assertion" },
    { type: "Mechanism", color: "#40c090", bg: "rgba(64,192,144,.15)",  desc: "The 'How' — why this happens" },
    { type: "Link",      color: "#ffaa44", bg: "rgba(255,170,68,.15)",  desc: "The 'Logic' — connecting step" },
    { type: "Impact",    color: "#ff7070", bg: "rgba(255,112,112,.15)", desc: "The 'Why it matters' — real world consequence" },
  ];
  const EMPTY_BLOCK = { type: "Claim", text: "" };
  const [chainBlocks, setChainBlocks] = useState([{ type: "Claim", text: "" }]);
  const [chainMotion, setChainMotion] = useState("");
  const [chainSide, setChainSide] = useState("Proposition");
  const [stressTesting, setStressTesting] = useState(false);
  const [stressResult, setStressResult] = useState(null);

  function formatTime(secs) {
    if (secs === null) return "--:--";
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  const FORMATS = {
    "WSDC": { duration: 30 * 60, phases: [
      { at: 20*60, msg: "10 min in — lock in your team split and main arguments" },
      { at: 10*60, msg: "20 min in — case structure should be set. 10 minutes left" },
      { at: 5*60,  msg: "25 min in — write your key lines and examples. 5 minutes left" },
      { at: 2*60,  msg: "28 min in — final 2 minutes. Know your first 30 seconds cold" },
      { at: 0,     msg: "30 min — Time is up! Step into the round." },
    ]},
    "CNDF": { duration: 15 * 60, phases: [
      { at: 10*60, msg: "5 min in — core arguments should be clear. 10 minutes left" },
      { at: 5*60,  msg: "10 min in — halfway. Sharpen your examples and impacts. 5 minutes left" },
      { at: 2*60,  msg: "13 min in — final 2 minutes. Know your opening line cold" },
      { at: 0,     msg: "15 min — Time is up! Step into the round." },
    ]},
    "BP": { duration: 15 * 60, phases: [
      { at: 10*60, msg: "5 min in — split roles and lock your two arguments. 10 minutes left" },
      { at: 5*60,  msg: "10 min in — halfway. Refine examples, think about extensions. 5 minutes left" },
      { at: 2*60,  msg: "13 min in — final 2 minutes. Know exactly who says what" },
      { at: 0,     msg: "15 min — Time is up! Step into the round." },
    ]},
    "Custom": { duration: null, phases: [] },
  };

  useEffect(() => {
    if (!timerRunning) {
      clearInterval(timerRef.current);
      document.title = "DebateVault";
      return;
    }
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((timerEndTime - Date.now()) / 1000));
      setTimerRemaining(remaining);

      // Always update tab title so it's visible from other tabs
      document.title = `⏱ ${formatTime(remaining)} — DebateVault`;

      // Phase alerts
      const duration = timerFormat === "Custom" ? timerCustom * 60 : FORMATS[timerFormat].duration;
      const elapsed = duration - remaining;
      const phases = timerFormat === "Custom"
        ? [
            { triggerElapsed: Math.floor(duration / 3),     msg: `${Math.floor(timerCustom/3)} min in — arguments should be set. ${Math.ceil(timerCustom*2/3)} minutes left` },
            { triggerElapsed: Math.floor(duration * 2 / 3), msg: `${Math.floor(timerCustom*2/3)} min in — tighten your notes. ${Math.ceil(timerCustom/3)} minutes left` },
            { triggerElapsed: duration,                      msg: `${timerCustom} min — Time is up! Step into the round.` },
          ]
        : FORMATS[timerFormat].phases.map(p => ({ triggerElapsed: duration - p.at, msg: p.msg }));

      phases.forEach(phase => {
        if (Math.abs(elapsed - phase.triggerElapsed) < 1) {
          if (Notification.permission === "granted") {
            new Notification("⏱ DebateVault Timer", { body: phase.msg });
          }
          showToast(phase.msg);
        }
      });

      if (remaining === 0) {
        setTimerRunning(false);
        clearInterval(timerRef.current);
        document.title = "⏱ Time's up! — DebateVault";
        setTimeout(() => { document.title = "DebateVault"; }, 10000);
      }
    }, 500);
    return () => clearInterval(timerRef.current);
  }, [timerRunning, timerEndTime]);

  function startTimer() {
    const duration = timerFormat === "Custom" ? timerCustom * 60 : FORMATS[timerFormat].duration;
    if (Notification.permission === "default") Notification.requestPermission();
    setTimerEndTime(Date.now() + duration * 1000);
    setTimerRemaining(duration);
    setTimerRunning(true);
    showToast("Timer started!");
  }

  function stopTimer() { setTimerRunning(false); setTimerRemaining(null); setTimerEndTime(null); }

  function timerProgress() {
    if (!timerRemaining) return 0;
    const duration = timerFormat === "Custom" ? timerCustom * 60 : FORMATS[timerFormat].duration;
    return (timerRemaining / duration) * 100;
  }

  const INP = {width:"100%",padding:"10px 14px",background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:"7px",color:T.text,fontSize:"14px",fontFamily:"inherit",transition:"border-color .2s"};

  // Keep body background in sync with theme
  useEffect(() => {
    document.body.style.background = T.bg;
    document.body.style.transition = "background 0.2s";
    localStorage.setItem("debatevault-theme", dark ? "dark" : "light");
  }, [dark]);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const [mobile, setMobile] = React.useState(isMobile);
  React.useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:4px;}
    ::-webkit-scrollbar-thumb{background:${dark?"#333":"#ddd"};border-radius:2px;}
    .card{transition:border-color .2s,box-shadow .2s,transform .2s;cursor:pointer;}
    .card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.1)!important;}
    input,select,textarea{font-family:inherit;}
    input:focus,select:focus,textarea:focus{outline:none;border-color:#0284c7!important;box-shadow:0 0 0 3px rgba(2,132,199,.12);}
    ::placeholder{color:#888;}
    @media(max-width:768px){
      .sidebar{display:none!important;}
      .main-content{margin-left:0!important;padding-bottom:72px;}
    }
    @media(min-width:769px){
      .bottom-tab-bar{display:none!important;}
    }
    @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes lineDraw{from{width:0}to{width:60%}}
    @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}
    .page-enter{animation:fadeUp .35s cubic-bezier(.22,1,.36,1) both;}
  `;

  useEffect(() => {
    async function load() {
      try {
        const data = await db.getAll();
        setMotions(data && data.length > 0 ? data : []);
      } catch {
        setLoadError(true);
        setMotions([]);
      }
      setLoaded(true);
    }
    load();
  }, []);

  // Intro animation sequence
  useEffect(() => {
    if (!intro) return;
    const t1 = setTimeout(() => setIntroPhase(1), 600);   // tagline appears
    const t2 = setTimeout(() => setIntroPhase(2), 1600);  // line draws
    const t3 = setTimeout(() => setIntroPhase(3), 2400);  // zoom out begins
    const t4 = setTimeout(() => setIntro(false), 3200);   // done
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [intro]);

  function showToast(msg, isError = false) {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3500);
  }

  function doSearch() {
    if (!query.trim()) { setSearched(false); return; }
    setResults(runSearch(query, motions));
    setSearched(true);
  }

  function clearSearch() { setQuery(""); setSearched(false); setResults([]); }
  function openMotion(m) { setSelected(m); setSide("prop"); setView("detail"); }

  function addArg(w) {
    const k = w === "prop" ? "propArgs" : "oppArgs";
    setForm(f => ({ ...f, [k]: [...f[k], { name:"", summary:"", type:"Practical" }] }));
  }

  function setArgF(w, i, field, val) {
    const k = w === "prop" ? "propArgs" : "oppArgs";
    setForm(f => { const a = [...f[k]]; a[i] = { ...a[i], [field]: val }; return { ...f, [k]: a }; });
  }

  async function generateArguments() {
    if (!form.motion.trim()) { showToast("Enter a motion title first", true); return; }

    if (!apiKeySet) { showToast("Enter your Anthropic API key first", true); return; }
    setGenerating(true);
    showToast("Generating arguments...");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motion: form.motion.trim(), apiKey })
      });
      const parsed = await res.json();
      if (!res.ok) throw new Error(parsed.error || "Failed");
      setForm(f => ({
        ...f,
        keywords: parsed.keywords ? parsed.keywords.join(", ") : f.keywords,
        difficulty: parsed.difficulty || f.difficulty,
        propArgs: parsed.prop_args || f.propArgs,
        oppArgs: parsed.opp_args || f.oppArgs,
      }));
      showToast("Arguments generated! Review and save.");
    } catch (e) {
      showToast("Generation failed. Check your API key.", true);
    }
    setGenerating(false);
  }

  async function submit() {
    if (!form.motion.trim()) { alert("Please enter a motion."); return; }
    setSaving(true);
    const nm = {
      id: Date.now(),
      motion: form.motion.trim(),
      theme: form.theme,
      subtheme: form.subtheme || "",
      keywords: typeof form.keywords === "string" ? form.keywords.split(",").map(k => k.trim()).filter(Boolean) : form.keywords,
      tournament: form.tournament.trim(),
      difficulty: form.difficulty,
      prop_args: form.propArgs.filter(a => a.name && a.name.trim()),
      opp_args: form.oppArgs.filter(a => a.name && a.name.trim()),
    };
    try {
      await db.insert(nm, serviceKey);
      setMotions(p => [nm, ...p]);
      setForm(EMPTY_FORM);
      showToast("Motion saved to database!");
    } catch {
      showToast("Failed to save. Check your service key.", true);
    }
    setSaving(false);
  }

  async function deleteMotion(id) {
    if (!confirm("Delete this motion?")) return;
    try {
      await db.delete(id, serviceKey);
      setMotions(p => p.filter(x => x.id !== id));
      showToast("Motion deleted");
    } catch {
      showToast("Failed to delete.", true);
    }
  }

  function exportData() {
    const json = JSON.stringify(motions, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "debatevault-export-" + new Date().toISOString().slice(0,10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported " + motions.length + " motions");
  }

  function exportPDF(m) {
    const propArgs = m.prop_args || m.propArgs || [];
    const oppArgs = m.opp_args || m.oppArgs || [];
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pw = 210; const ph = 297;
    const ml = 14; const mr = 14; const cw = pw - ml - mr;
    let y = 14;

    // Header bar
    doc.setFillColor(120, 100, 255);
    doc.rect(0, 0, pw, 12, "F");
    doc.setFontSize(8); doc.setTextColor(255,255,255); doc.setFont("helvetica","bold");
    doc.text("DEBATEVAULT  ·  debatevault.vercel.app", ml, 8);
    y = 20;

    // Badges
    doc.setFontSize(8); doc.setTextColor(80,80,120); doc.setFont("helvetica","normal");
    doc.text(`${m.theme}  ·  ${m.difficulty}${m.tournament ? "  ·  " + m.tournament : ""}`, ml, y);
    y += 7;

    // Motion title
    doc.setFontSize(15); doc.setTextColor(20,20,40); doc.setFont("helvetica","bold");
    const titleLines = doc.splitTextToSize(m.motion, cw);
    doc.text(titleLines, ml, y);
    y += titleLines.length * 7 + 4;

    // Divider
    doc.setDrawColor(200,200,220); doc.line(ml, y, pw - mr, y);
    y += 8;

    // Two columns
    const colW = (cw - 8) / 2;
    const col1x = ml; const col2x = ml + colW + 8;

    function writeArgs(args, x, startY, label, isP) {
      let cy = startY;
      // Side header
      doc.setFillColor(isP ? 220 : 250, isP ? 240 : 220, isP ? 228 : 220);
      doc.roundedRect(x, cy - 5, colW, 10, 2, 2, "F");
      doc.setFontSize(9); doc.setFont("helvetica","bold");
      doc.setTextColor(isP ? 30 : 100, isP ? 100 : 30, isP ? 50 : 30);
      doc.text(`${label}  (${args.length})`, x + 4, cy + 1);
      cy += 10;

      args.forEach(arg => {
        if (cy > ph - 20) { doc.addPage(); cy = 20; }
        // Arg box
        const summaryLines = doc.splitTextToSize(arg.summary || "", colW - 8);
        const boxH = 6 + 5 + summaryLines.length * 4.5 + 6;
        doc.setFillColor(250, 250, 252);
        doc.setDrawColor(isP ? 180 : 220, isP ? 220 : 180, isP ? 195 : 195);
        doc.roundedRect(x, cy, colW, boxH, 2, 2, "FD");

        // Arg name
        doc.setFontSize(8.5); doc.setFont("helvetica","bold"); doc.setTextColor(20,20,40);
        const nameLines = doc.splitTextToSize(arg.name || "", colW - 8);
        doc.text(nameLines, x + 4, cy + 5);

        // Type badge
        const typeY = cy + 5 + nameLines.length * 4;
        doc.setFontSize(7); doc.setFont("helvetica","normal");
        doc.setTextColor(arg.type === "Principled" ? 96 : 40, arg.type === "Principled" ? 80 : 150, arg.type === "Principled" ? 200 : 100);
        doc.text(arg.type || "Practical", x + 4, typeY);

        // Summary
        doc.setFontSize(7.5); doc.setTextColor(80,80,110); doc.setFont("helvetica","normal");
        doc.text(summaryLines, x + 4, typeY + 4.5);

        cy += boxH + 3;
      });
      return cy;
    }

    const endY1 = writeArgs(propArgs, col1x, y, "PROPOSITION", true);
    const endY2 = writeArgs(oppArgs, col2x, y, "OPPOSITION", false);

    // Footer
    const footerY = Math.max(endY1, endY2) + 6;
    if (footerY < ph - 10) {
      doc.setDrawColor(220,220,230); doc.line(ml, footerY, pw - mr, footerY);
      doc.setFontSize(7); doc.setTextColor(180,180,200); doc.setFont("helvetica","normal");
      doc.text("Generated by DebateVault", ml, footerY + 4);
    }

    const filename = m.motion.slice(0,50).replace(/[^a-z0-9]/gi,"_").toLowerCase();
    doc.save(`${filename}.pdf`);
  }

  function startEdit(m) {
    const propArgs = (m.prop_args || m.propArgs || []);
    const oppArgs = (m.opp_args || m.oppArgs || []);
    setForm({
      motion: m.motion,
      theme: m.theme,
      subtheme: m.subtheme || "",
      keywords: (m.keywords || []).join(", "),
      tournament: m.tournament || "",
      difficulty: m.difficulty || "Medium",
      propArgs: propArgs.length ? propArgs : [{name:"",summary:"",type:"Practical"}],
      oppArgs: oppArgs.length ? oppArgs : [{name:"",summary:"",type:"Practical"}],
    });
    setEditingId(m.id);
    setAdminTab("add");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  async function saveEdit() {
    if (!form.motion.trim()) { alert("Please enter a motion."); return; }
    setSaving(true);
    const updated = {
      id: editingId,
      motion: form.motion.trim(),
      theme: form.theme,
      subtheme: form.subtheme || "",
      keywords: typeof form.keywords === "string" ? form.keywords.split(",").map(k => k.trim()).filter(Boolean) : form.keywords,
      tournament: form.tournament.trim(),
      difficulty: form.difficulty,
      prop_args: form.propArgs.filter(a => a.name && a.name.trim()),
      opp_args: form.oppArgs.filter(a => a.name && a.name.trim()),
    };
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/motions?id=eq.${editingId}`, {
        method: "PATCH",
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      setMotions(p => p.map(x => x.id === editingId ? updated : x));
      setForm(EMPTY_FORM);
      setEditingId(null);
      showToast("Motion updated!");
    } catch {
      showToast("Failed to update.", true);
    }
    setSaving(false);
  }

  async function loadNews() {
    setNewsLoading(true);
    setNewsError(false);
    const results = [];
    await Promise.all(NEWS_SOURCES.map(async source => {
      try {
        const res = await fetch(source.url);
        const data = await res.json();
        if (data.items) {
          data.items.slice(0, 8).forEach(item => {
            // Extract image from enclosure, media content, or description img tag
            let image = null;
            if (item.enclosure && item.enclosure.link) {
              image = item.enclosure.link;
            } else if (item.thumbnail) {
              image = item.thumbnail;
            } else {
              const imgMatch = (item.description || "").match(/<img[^>]+src=["']([^"']+)["']/i);
              if (imgMatch) image = imgMatch[1];
            }
            results.push({
              id: item.guid || item.link,
              title: item.title,
              description: (item.description || "").replace(/<[^>]+>/g, "").slice(0, 160),
              link: item.link,
              pubDate: item.pubDate,
              source: source.name,
              sourceId: source.id,
              themes: source.themes,
              image,
            });
          });
        }
      } catch {}
    }));
    results.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    setNewsArticles(results);
    setNewsLoading(false);
    setNewsLoaded(true);
  }

  async function runStressTest() {
    const filled = chainBlocks.filter(b => b.text.trim());
    if (filled.length < 2) { showToast("Add at least 2 blocks to stress test.", true); return; }

    setStressTesting(true);
    setStressResult(null);
    try {
      const res = await fetch("/api/stresstest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chain: filled })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setStressResult(data);
    } catch (e) {
      showToast("Stress test failed: " + e.message, true);
    }
    setStressTesting(false);
  }

  function checkApiKey() {
    if (apiKeyInput.trim().startsWith("sk-ant")) { setApiKey(apiKeyInput.trim()); setApiKeySet(true); showToast("API key connected!"); }
    else { alert("That doesn't look like an Anthropic API key."); }
  }

  function checkPassword() {
    if (pwInput === ADMIN_PASSWORD) { setAdminUnlocked(true); setPwError(false); }
    else { setPwError(true); }
  }

  function checkServiceKey() {
    if (skInput.trim().startsWith("eyJ")) { setServiceKey(skInput.trim()); setServiceKeySet(true); }
    else { alert("Paste your Supabase service_role key."); }
  }

  const browsed = motions.filter(m =>
    (filterTheme === "All Themes" || m.theme === filterTheme) &&
    (filterSubtheme === "All" || m.subtheme === filterSubtheme) &&
    (filterDiff === "All" || m.difficulty === filterDiff)
  );
  const displayed = searched ? results : browsed;
  const getArgs = (m, s) => s === "prop" ? (m.prop_args || m.propArgs || []) : (m.opp_args || m.oppArgs || []);

  if (!loaded) return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{textAlign:"center",color:T.textMuted}}>
        <div style={{fontSize:"32px",marginBottom:"12px"}}>⚖</div>
        <p>Loading DebateVault...</p>
      </div>
    </div>
  );

  // LANDING PAGE
  if (showLanding) return (
    <LandingPage
      dark={dark}
      setDark={setDark}
      onEnter={() => { sessionStorage.setItem("dv-entered","1"); setShowLanding(false); }}
    />
  );

  // INTRO SCREEN — v2 clean
  if (intro) return (
    <div style={{
      position:"fixed",inset:0,
      background:dark?"#0a0a0a":"#fafafa",
      display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",
      zIndex:9999,
      fontFamily:"'DM Sans',sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,900;1,700&display=swap');
        @keyframes dvUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes dvIn{from{opacity:0}to{opacity:1}}
        @keyframes dvLine{from{width:0}to{width:100%}}
        @keyframes dvPulse{0%,100%{opacity:.3}50%{opacity:1}}
        @keyframes dvExit{to{opacity:0}}
      `}</style>

      <div style={{
        width:"36px",height:"36px",borderRadius:"9px",
        background:dark?"#1a1a1a":"#111",
        border:`1px solid ${dark?"#333":"#222"}`,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:"18px",marginBottom:"22px",
        animation:"dvUp .6s cubic-bezier(.22,1,.36,1) both",
        animationDelay:".1s",opacity:0,
      }}>⚖</div>

      <div style={{
        fontFamily:"'Playfair Display',serif",
        fontSize:"clamp(32px,7vw,60px)",
        fontWeight:900,
        color:dark?"#f0f0f0":"#111",
        letterSpacing:"-2px",
        lineHeight:1,
        textAlign:"center",
        marginBottom:"12px",
        animation:"dvUp .7s cubic-bezier(.22,1,.36,1) both",
        animationDelay:".2s",opacity:0,
      }}>DebateVault</div>

      {introPhase >= 2 && (
        <div style={{
          height:"1px",background:dark?"#333":"#ddd",
          width:"120px",marginBottom:"12px",
          animation:"dvLine .5s ease both",
        }} />
      )}

      {introPhase >= 1 && (
        <div style={{
          fontSize:"12px",color:dark?"#555":"#aaa",
          letterSpacing:".12em",textTransform:"uppercase",
          fontWeight:500,textAlign:"center",
          animation:"dvUp .5s cubic-bezier(.22,1,.36,1) both",
          opacity:0,
        }}>Every argument. Every motion.</div>
      )}

      {introPhase >= 2 && (
        <div style={{display:"flex",gap:"5px",marginTop:"40px"}}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width:"4px",height:"4px",borderRadius:"50%",
              background:dark?"#444":"#ccc",
              animation:"dvPulse 1.2s ease infinite",
              animationDelay:`${i*0.2}s`,
            }} />
          ))}
        </div>
      )}

      {introPhase >= 3 && (
        <div style={{
          position:"absolute",inset:0,
          background:dark?"#0a0a0a":"#fafafa",
          animation:"dvIn .5s ease both",
        }} />
      )}
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'DM Sans',sans-serif",transition:"background .2s,color .2s",display:"flex"}}>
      <style>{STYLES}</style>

      {toast && (
        <div style={{position:"fixed",bottom:"24px",left:"50%",transform:"translateX(-50%)",background:T.surface,border:`1px solid ${toast.isError?"#dc262655":T.border}`,borderRadius:"8px",padding:"11px 22px",fontSize:"13px",color:toast.isError?"#dc2626":T.text,zIndex:999,boxShadow:"0 4px 24px rgba(0,0,0,.15)",whiteSpace:"nowrap",fontWeight:500}}>
          {toast.msg}
        </div>
      )}

      {/* SIDEBAR v2 */}
      <div className="sidebar" style={{width:"200px",minHeight:"100vh",background:T.surface,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,zIndex:99,fontFamily:"'DM Sans',sans-serif"}}>
        <div onClick={() => { setView("browse"); clearSearch(); }} style={{padding:"20px 18px 16px",cursor:"pointer",borderBottom:`1px solid ${T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"3px"}}>
            <div style={{width:"26px",height:"26px",borderRadius:"6px",background:dark?"#1a1a1a":"#111",border:`1px solid ${dark?"#333":"#222"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",flexShrink:0}}>⚖</div>
            <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:"15px",color:T.text}}>DebateVault</span>
          </div>
          <span style={{fontSize:"10px",color:T.textMuted,marginLeft:"34px",letterSpacing:".05em"}}>{motions.length} motions</span>
        </div>
        <nav style={{padding:"10px 10px",flex:1,display:"flex",flexDirection:"column",gap:"2px"}}>
          {[
            ["browse","🗂","Browse"],
            ["timer","⏱","Prep Timer"],
            ["news","📰","News"],
            ["chain","🔗","Logic Chain"],
            ["admin","⚙","Admin"],
          ].map(([v,icon,label]) => {
            const active = view===v||(view==="detail"&&v==="browse");
            return (
              <button key={v} onClick={()=>{setView(v);if(v==="browse")clearSearch();}}
                style={{display:"flex",alignItems:"center",gap:"10px",padding:"9px 12px",borderRadius:"7px",border:"none",background:active?(dark?"#1a1a1a":"#f0f0f0"):"transparent",color:active?T.text:T.textMuted,fontSize:"13px",fontWeight:active?600:400,cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"all .15s",width:"100%"}}>
                <span style={{fontSize:"15px",width:"18px",textAlign:"center",flexShrink:0}}>{icon}</span>
                {label}
              </button>
            );
          })}
        </nav>
        <div style={{padding:"12px 10px",borderTop:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:"8px",justifyContent:"space-between"}}>
          <span style={{fontSize:"11px",color:T.textMuted,paddingLeft:"4px"}}>{dark?"Dark":"Light"}</span>
          <div onClick={()=>setDark(d=>!d)} style={{display:"flex",width:"44px",height:"24px",padding:"2px",borderRadius:"100px",cursor:"pointer",background:dark?"#1a1a1a":"#efefef",border:`1px solid ${T.border}`,alignItems:"center",transition:"all .3s",flexShrink:0}}>
            <div style={{width:"18px",height:"18px",borderRadius:"50%",background:dark?"#444":"#ddd",transform:dark?"translateX(0)":"translateX(20px)",transition:"transform .3s cubic-bezier(.34,1.56,.64,1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px"}}>{dark?"🌙":"☀️"}</div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content" style={{marginLeft:"200px",flex:1,minWidth:0}}>

      {/* MOBILE TOP BAR */}
      {mobile && (
        <div style={{position:"fixed",top:0,left:0,right:0,zIndex:99,background:T.surface,borderBottom:`1px solid ${T.border}`,height:"48px",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",fontFamily:"'DM Sans',sans-serif"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <div style={{width:"26px",height:"26px",borderRadius:"6px",background:dark?"#1a1a1a":"#111",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px"}}>⚖</div>
            <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:"15px",color:T.text}}>DebateVault</span>
          </div>
          <button onClick={() => setDark(d => !d)} style={{background:"none",border:"none",fontSize:"16px",cursor:"pointer",color:T.textMuted}}>
            {dark ? "☀️" : "🌙"}
          </button>
        </div>
      )}

      {/* MOBILE BOTTOM TAB BAR */}
      <div className="bottom-tab-bar" style={{position:"fixed",bottom:0,left:0,right:0,zIndex:99,background:T.surface,borderTop:`1px solid ${T.border}`,height:"60px",display:"flex",alignItems:"center",justifyContent:"space-around",fontFamily:"'DM Sans',sans-serif"}}>
        {[
          ["browse","🗂","Browse"],
          ["timer","⏱","Timer"],
          ["news","📰","News"],
          ["chain","🔗","Chain"],
          ["admin","⚙","Admin"],
        ].map(([v,icon,label]) => {
          const active = view === v || (view === "detail" && v === "browse");
          return (
            <button key={v} onClick={() => { setView(v); if (v==="browse") clearSearch(); }}
              style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:"8px 10px",borderRadius:"8px",transition:"all .15s",flex:1}}>
              <span style={{fontSize:"18px",lineHeight:1}}>{icon}</span>
              <span style={{fontSize:"10px",fontWeight:active?700:400,color:active?T.text:T.textMuted}}>{label}</span>
              {active && <div style={{width:"16px",height:"2px",borderRadius:"2px",background:T.accent,marginTop:"1px"}} />}
            </button>
          );
        })}
      </div>

      {loadError && (
        <div style={{background:dark?"#2a1a00":"#fff8ee",borderBottom:`1px solid ${dark?"#7a520033":"#f0c060"}`,padding:"8px 24px",textAlign:"center",fontSize:"12px",color:dark?"#ffaa44":"#a07000"}}>
          Could not connect to database. Check your internet connection.
        </div>
      )}

      {/* BROWSE */}
      {view === "browse" && (
        <div>
          <div style={{maxWidth:"680px",margin:"0 auto",padding:mobile?"72px 16px 24px":"48px 24px 32px",textAlign:"center"}}>
            <p style={{fontSize:"11px",fontWeight:700,letterSpacing:".1em",textTransform:"uppercase",color:T.textMuted,marginBottom:"14px"}}>WSDC Argument Database</p>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,5vw,48px)",fontWeight:900,lineHeight:1.1,marginBottom:"10px",color:T.text,letterSpacing:"-1px"}}>
              Every argument.<br/><span style={{fontStyle:"italic",color:T.textMuted}}>Every motion.</span>
            </h1>
            <p style={{color:T.textMuted,fontSize:"15px",marginBottom:"28px",lineHeight:1.7}}>Search any topic and find ready-to-use Proposition and Opposition arguments.</p>
            <div style={{display:"flex",gap:"8px",maxWidth:"540px",margin:"0 auto"}}>
              <div style={{flex:1,position:"relative"}}>
                <span style={{position:"absolute",left:"13px",top:"50%",transform:"translateY(-50%)",color:T.textMuted,fontSize:"16px",pointerEvents:"none"}}>⌕</span>
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key==="Enter" && doSearch()}
                  placeholder='Try "social media", "drugs", "climate"...'
                  style={{width:"100%",padding:"12px 36px 12px 38px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:"8px",color:T.text,fontSize:"14px",fontFamily:"inherit",transition:"border-color .2s"}} />
                {query && <button onClick={clearSearch} style={{position:"absolute",right:"10px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:"20px",lineHeight:1,padding:"0 4px"}}>×</button>}
              </div>
              <button onClick={doSearch} style={{padding:"12px 20px",borderRadius:"8px",border:"none",background:dark?"#fff":"#111",color:dark?"#111":"#fff",fontSize:"13px",fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit",transition:"opacity .2s"}}>Search</button>
            </div>
          </div>

          {!searched && (
            <div style={{maxWidth:"1080px",margin:"0 auto",padding:"0 24px 16px",display:"flex",gap:"8px",flexWrap:"wrap",alignItems:"center"}}>
              <select value={filterTheme} onChange={e => { setFilterTheme(e.target.value); setFilterSubtheme("All"); }} style={{padding:"6px 12px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:"6px",color:T.text,fontSize:"12px",cursor:"pointer",fontFamily:"inherit"}}>
                {THEMES.map(t => <option key={t}>{t}</option>)}
              </select>
              {filterTheme !== "All Themes" && THEME_TREE[filterTheme] && (
                <select value={filterSubtheme} onChange={e => setFilterSubtheme(e.target.value)} style={{padding:"6px 12px",background:T.surface,border:`1px solid ${T.accent}55`,borderRadius:"6px",color:T.accent,fontSize:"12px",cursor:"pointer",fontFamily:"inherit"}}>
                  <option value="All">All {filterTheme}</option>
                  {THEME_TREE[filterTheme].map(s => <option key={s}>{s}</option>)}
                </select>
              )}
              {DIFFICULTIES.map(d => (
                <button key={d} onClick={() => setFilterDiff(d)} style={{padding:"6px 12px",borderRadius:"6px",border:`1px solid ${filterDiff===d?(dark?"#e0e0e0":"#111"):T.border}`,background:filterDiff===d?(dark?"#fff":"#111"):"transparent",color:filterDiff===d?(dark?"#111":"#fff"):T.textMuted,fontSize:"12px",cursor:"pointer",fontWeight:500,fontFamily:"inherit",transition:"all .2s"}}>{d}</button>
              ))}
            </div>
          )}

          {searched && (
            <div style={{maxWidth:"1080px",margin:"0 auto",padding:"0 24px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <p style={{fontSize:"13px",color:T.textMuted}}>
                {results.length > 0 ? <><span style={{color:T.text,fontWeight:600}}>{results.length} result{results.length!==1?"s":""}</span> for &ldquo;{query}&rdquo;</> : <span>No results for &ldquo;<b style={{color:T.text}}>{query}</b>&rdquo;</span>}
              </p>
              <button onClick={clearSearch} style={{padding:"5px 12px",borderRadius:"6px",border:`1px solid ${T.border}`,background:"transparent",color:T.textMuted,fontSize:"12px",cursor:"pointer",fontFamily:"inherit"}}>Clear</button>
            </div>
          )}

          <div style={{maxWidth:"1080px",margin:"0 auto",padding:"0 24px 60px",display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(auto-fill,minmax(280px,1fr))",gap:"10px"}}>
            {displayed.map(m => (
              <div key={m.id} className="card" onClick={() => openMotion(m)} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"10px",padding:"20px",boxShadow:"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"10px",alignItems:"flex-start"}}>
                  <span style={{fontSize:"10px",fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",color:T.textMuted}}>{m.subtheme || m.theme}</span>
                  <span style={{fontSize:"10px",fontWeight:600,color:T.textMuted,background:T.surface2,padding:"2px 7px",borderRadius:"4px",border:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>{m.difficulty}</span>
                </div>
                <p style={{fontSize:"14px",fontWeight:600,lineHeight:1.5,color:T.text,marginBottom:"14px"}}>{m.motion}</p>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:`1px solid ${T.border}`,paddingTop:"10px"}}>
                  <div style={{display:"flex",gap:"10px"}}>
                    <span style={{fontSize:"11px",color:T.prop,fontWeight:600}}>↑ {getArgs(m,"prop").length} prop</span>
                    <span style={{fontSize:"11px",color:T.opp,fontWeight:600}}>↓ {getArgs(m,"opp").length} opp</span>
                  </div>
                  {m.tournament && <span style={{fontSize:"10px",color:T.textFaint}}>{m.tournament}</span>}
                </div>
              </div>
            ))}
            {displayed.length === 0 && (
              <div style={{gridColumn:"1/-1",textAlign:"center",padding:"60px",color:T.textFaint}}>
                <div style={{fontSize:"32px",marginBottom:"12px"}}>🔍</div>
                <p>{searched ? "No motions found. Try different keywords." : "No motions yet. Add some via the Admin panel."}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAIL */}
      {view === "detail" && selected && (
        <div style={{maxWidth:"860px",margin:"0 auto",padding:mobile?"72px 16px 80px":"40px 24px 60px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"28px"}}>
            <button onClick={() => setView("browse")} style={{background:"none",border:"none",color:T.textMuted,fontSize:"13px",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:"4px"}}>← Back to Browse</button>
            <button onClick={() => exportPDF(selected)} style={{padding:"7px 16px",borderRadius:"7px",border:`1px solid ${T.border}`,background:"transparent",color:T.textMuted,fontSize:"12px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>↓ PDF</button>
          </div>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"12px",alignItems:"center"}}>
            <span style={{fontSize:"10px",fontWeight:700,letterSpacing:".08em",textTransform:"uppercase",color:T.textMuted}}>{selected.theme}</span>
            <span style={{fontSize:"10px",color:T.textFaint}}>·</span>
            <span style={{fontSize:"10px",fontWeight:600,color:T.textMuted}}>{selected.difficulty}</span>
            {selected.tournament && <><span style={{fontSize:"10px",color:T.textFaint}}>·</span><span style={{fontSize:"10px",color:T.textMuted}}>{selected.tournament}</span></>}
          </div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(20px,4vw,32px)",lineHeight:1.3,marginBottom:"18px",color:T.text}}>{selected.motion}</h1>
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"30px"}}>
            {(selected.keywords||[]).map(k => <span key={k} style={{padding:"3px 11px",background:T.surface2,border:`1px solid ${T.border3}`,borderRadius:"20px",fontSize:"12px",color:T.textSub}}>{k}</span>)}
          </div>
          <div style={{display:"flex",gap:"8px",marginBottom:"24px"}}>
            {[["prop","Proposition",T.prop],["opp","Opposition",T.opp]].map(([s,label,col]) => (
              <button key={s} onClick={() => setSide(s)} style={{padding:"9px 22px",borderRadius:"7px",border:`1px solid ${side===s?col:T.border}`,fontWeight:600,fontSize:"13px",cursor:"pointer",background:side===s?(dark?"#111":"#fff"):"transparent",color:side===s?col:T.textMuted,fontFamily:"inherit",transition:"all .15s"}}>
                {label} ({getArgs(selected,s).length})
              </button>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            {getArgs(selected, side).map((arg, i) => (
              <div key={i} style={{background:T.surface,border:`1px solid ${side==="prop"?T.propBorder:T.oppBorder}`,borderRadius:"10px",padding:"20px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"12px",marginBottom:"10px"}}>
                  <h3 style={{fontSize:"15px",fontWeight:700,color:T.text,lineHeight:1.35}}>{arg.name}</h3>
                  <span style={{padding:"2px 9px",borderRadius:"4px",fontSize:"10px",fontWeight:600,flexShrink:0,letterSpacing:".06em",textTransform:"uppercase",background:arg.type==="Principled"?"rgba(2,132,199,.1)":"rgba(22,163,74,.1)",color:arg.type==="Principled"?T.accent:T.prop,border:`1px solid ${arg.type==="Principled"?"rgba(2,132,199,.2)":"rgba(22,163,74,.2)"}`}}>{arg.type}</span>
                </div>
                <p style={{fontSize:"14px",color:T.textSub,lineHeight:1.8}}>{arg.summary}</p>
              </div>
            ))}
            {getArgs(selected, side).length === 0 && <p style={{color:T.textFaint,textAlign:"center",padding:"40px"}}>No arguments yet for this side.</p>}
          </div>
        </div>
      )}

      {/* NEWS */}
      {view === "news" && (
        <div style={{maxWidth:"1080px",margin:"0 auto",padding:mobile?"80px 16px 80px":"40px 24px 60px"}}>
          <div style={{marginBottom:"28px"}}>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(24px,4vw,38px)",fontWeight:900,marginBottom:"6px",color:T.text,letterSpacing:"-1px"}}>Debate News</h1>
            <p style={{color:T.textMuted,fontSize:"14px"}}>Stay on top of current events across every debate theme.</p>
          </div>

          {/* Filters */}
          <div style={{display:"flex",gap:"10px",flexWrap:"wrap",alignItems:"center",marginBottom:"24px"}}>
            <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
              {["All","Economics","Environment","Technology","International Relations","Criminal Justice","Human Rights","Health"].map(t => (
                <button key={t} onClick={() => setNewsFilter(t)}
                  style={{padding:"5px 12px",borderRadius:"6px",border:`1px solid ${newsFilter===t?(dark?"#e0e0e0":"#111"):T.border}`,background:newsFilter===t?(dark?"#fff":"#111"):"transparent",color:newsFilter===t?(dark?"#111":"#fff"):T.textMuted,fontSize:"11px",fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Source filter */}
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"28px",paddingBottom:"20px",borderBottom:`1px solid ${T.border}`}}>
            <button onClick={() => setNewsSourceFilter("All")}
              style={{padding:"4px 11px",borderRadius:"5px",border:`1px solid ${newsSourceFilter==="All"?T.text:T.border}`,background:newsSourceFilter==="All"?T.text:"transparent",color:newsSourceFilter==="All"?(dark?"#111":"#fff"):T.textMuted,fontSize:"11px",cursor:"pointer",fontFamily:"inherit"}}>
              All
            </button>
            {NEWS_SOURCES.map(s => (
              <button key={s.id} onClick={() => setNewsSourceFilter(s.id)}
                style={{padding:"4px 11px",borderRadius:"5px",border:`1px solid ${newsSourceFilter===s.id?T.text:T.border}`,background:newsSourceFilter===s.id?T.text:"transparent",color:newsSourceFilter===s.id?(dark?"#111":"#fff"):T.textMuted,fontSize:"11px",cursor:"pointer",fontFamily:"inherit"}}>
                {s.name}
              </button>
            ))}
          </div>

          {/* Load button or articles */}
          {!newsLoaded ? (
            <div style={{textAlign:"center",padding:"60px 0"}}>
              <p style={{color:T.textMuted,marginBottom:"20px",fontSize:"15px"}}>Ready to load the latest news from 10 sources.</p>
              <button onClick={loadNews} disabled={newsLoading}
                style={{padding:"12px 28px",borderRadius:"8px",border:"none",background:dark?"#fff":"#111",color:dark?"#111":"#fff",fontSize:"14px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                {newsLoading ? "Loading..." : "Load Today's News"}
              </button>
            </div>
          ) : newsLoading ? (
            <div style={{textAlign:"center",padding:"60px 0",color:T.textMuted}}>Loading articles...</div>
          ) : (
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
                <p style={{fontSize:"13px",color:T.textMuted}}>
                  {newsArticles.filter(a =>
                    (newsFilter === "All" || a.themes.includes(newsFilter)) &&
                    (newsSourceFilter === "All" || a.sourceId === newsSourceFilter)
                  ).length} articles
                </p>
                <button onClick={loadNews}
                  style={{padding:"6px 14px",borderRadius:"8px",border:`1px solid ${T.border2}`,background:"transparent",color:T.textMuted,fontSize:"12px",cursor:"pointer",fontFamily:"inherit"}}>
                  ↻ Refresh
                </button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:mobile?"1fr":"repeat(auto-fill,minmax(300px,1fr))",gap:"14px"}}>
                {newsArticles
                  .filter(a =>
                    (newsFilter === "All" || a.themes.includes(newsFilter)) &&
                    (newsSourceFilter === "All" || a.sourceId === newsSourceFilter)
                  )
                  .map(article => (
                    <a key={article.id} href={article.link} target="_blank" rel="noopener noreferrer"
                      style={{textDecoration:"none",display:"block",background:T.surface,border:`1px solid ${T.border}`,borderRadius:"10px",overflow:"hidden",transition:"border-color .2s,transform .2s",cursor:"pointer"}}
                      onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.borderColor=T.border2; }}
                      onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.borderColor=T.border; }}>
                      {/* Image */}
                      {article.image ? (
                        <div style={{width:"100%",height:"120px",overflow:"hidden",background:T.surface2}}>
                          <img src={article.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",display:"block"}}
                            onError={e => { e.target.parentElement.style.display="none"; }} />
                        </div>
                      ) : (
                        <div style={{width:"100%",height:"100px",background:`linear-gradient(135deg,${TC[article.themes[0]]||"#0284c7"}22,${TC[article.themes[0]]||"#0284c7"}44)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"32px"}}>
                          📰
                        </div>
                      )}
                      {/* Content */}
                      <div style={{padding:"16px"}}>
                        {/* Source + theme */}
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                          <span style={{fontSize:"10px",fontWeight:700,color:T.accent,textTransform:"uppercase",letterSpacing:".07em"}}>{article.source}</span>
                          {article.themes.slice(0,1).map(th => (
                            <span key={th} style={{fontSize:"10px",padding:"2px 8px",borderRadius:"20px",background:`${TC[th]||"#333"}22`,color:TC[th]||T.textMuted,border:`1px solid ${TC[th]||"#333"}33`}}>{th}</span>
                          ))}
                        </div>
                        {/* Title */}
                        <p style={{fontSize:"14px",fontWeight:600,color:T.text,lineHeight:1.5,marginBottom:"6px"}}>{article.title}</p>
                        {/* Description */}
                        {article.description && (
                          <p style={{fontSize:"12px",color:T.textMuted,lineHeight:1.6,marginBottom:"12px"}}>{article.description}{article.description.length >= 160 ? "..." : ""}</p>
                        )}
                        {/* Date + read more */}
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <span style={{fontSize:"11px",color:T.textFaint}}>
                            {article.pubDate ? new Date(article.pubDate).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}) : ""}
                          </span>
                          <span style={{fontSize:"11px",color:T.textMuted,fontWeight:600}}>Read →</span>
                        </div>
                      </div>
                    </a>
                  ))
                }
              </div>
              {newsArticles.filter(a =>
                (newsFilter === "All" || a.themes.includes(newsFilter)) &&
                (newsSourceFilter === "All" || a.sourceId === newsSourceFilter)
              ).length === 0 && (
                <div style={{textAlign:"center",padding:"60px",color:T.textFaint}}>
                  <div style={{fontSize:"32px",marginBottom:"12px"}}>📰</div>
                  <p>No articles found for this filter. Try a different theme or source.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* LOGIC CHAIN */}
      {view === "chain" && (
        <div style={{maxWidth:"720px",margin:"0 auto",padding:"40px 24px 60px"}}>
          <div style={{marginBottom:"28px"}}>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(24px,4vw,38px)",fontWeight:900,marginBottom:"6px",color:T.text,letterSpacing:"-1px"}}>Logic Chain</h1>
            <p style={{color:T.textMuted,fontSize:"14px",lineHeight:1.6}}>Build your argument step by step. Every link in the chain must hold — or an opponent will break it.</p>
          </div>

          {/* Motion + side */}
          <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:"12px",marginBottom:"24px"}}>
            <input value={chainMotion} onChange={e => setChainMotion(e.target.value)}
              placeholder="Motion (optional — e.g. THW implement sanctions on Iran)"
              style={{...INP}} />
            <div style={{display:"flex",gap:"6px"}}>
              {["Proposition","Opposition"].map(s => (
                <button key={s} onClick={() => setChainSide(s)}
                  style={{padding:"9px 14px",borderRadius:"7px",border:`1px solid ${chainSide===s?(s==="Proposition"?T.propBorder:T.oppBorder):T.border}`,background:chainSide===s?(s==="Proposition"?T.propBg:T.oppBg):"transparent",color:chainSide===s?(s==="Proposition"?T.prop:T.opp):T.textMuted,fontSize:"12px",fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                  {s === "Proposition" ? "Prop" : "Opp"}
                </button>
              ))}
            </div>
          </div>

          {/* Block type legend */}
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"20px"}}>
            {BLOCK_TYPES.map(bt => (
              <span key={bt.type} style={{fontSize:"11px",padding:"3px 10px",borderRadius:"20px",background:bt.bg,color:bt.color,border:`1px solid ${bt.color}44`,fontWeight:600}}>{bt.type}</span>
            ))}
          </div>

          {/* Chain blocks */}
          <div style={{display:"flex",flexDirection:"column",gap:"0px",marginBottom:"20px"}}>
            {chainBlocks.map((block, i) => {
              const bt = BLOCK_TYPES.find(b => b.type === block.type) || BLOCK_TYPES[0];
              const isWeak = stressResult && stressResult.weakest_link === i + 1;
              return (
                <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                  <div style={{width:"100%",background:isWeak?"rgba(255,80,80,.08)":T.surface,border:`2px solid ${isWeak?"#ff5050":bt.color}`,borderRadius:"12px",padding:"16px",position:"relative",boxShadow:isWeak?"0 0 20px rgba(255,80,80,.2)":dark?"0 4px 16px rgba(0,0,0,.3)":"0 4px 16px rgba(0,0,0,.08)",transition:"all .3s"}}>
                    {isWeak && (
                      <div style={{position:"absolute",top:"-12px",left:"16px",background:"#ff5050",color:"#fff",fontSize:"11px",fontWeight:700,padding:"2px 10px",borderRadius:"20px"}}>⚠ WEAKEST LINK</div>
                    )}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                      <div style={{display:"flex",gap:"6px",flexWrap:"wrap"}}>
                        {BLOCK_TYPES.map(bt2 => (
                          <button key={bt2.type} onClick={() => { const b=[...chainBlocks]; b[i]={...b[i],type:bt2.type}; setChainBlocks(b); setStressResult(null); }}
                            style={{padding:"3px 10px",borderRadius:"20px",border:`1px solid ${bt2.color}44`,background:block.type===bt2.type?bt2.bg:"transparent",color:bt2.color,fontSize:"11px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                            {bt2.type}
                          </button>
                        ))}
                      </div>
                      {chainBlocks.length > 1 && (
                        <button onClick={() => { setChainBlocks(chainBlocks.filter((_,j)=>j!==i)); setStressResult(null); }}
                          style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:"18px",lineHeight:1,padding:"0 4px"}}>×</button>
                      )}
                    </div>
                    <textarea
                      value={block.text}
                      onChange={e => { const b=[...chainBlocks]; b[i]={...b[i],text:e.target.value}; setChainBlocks(b); setStressResult(null); }}
                      placeholder={
                        block.type==="Claim" ? "e.g. Economic sanctions will lead to regime change" :
                        block.type==="Mechanism" ? "e.g. Sanctions devalue the local currency, cutting off imports" :
                        block.type==="Link" ? "e.g. Middle class loses savings, turning against the regime" :
                        "e.g. Mass protests force the leader to step down to avoid a coup"
                      }
                      style={{...INP,minHeight:"70px",resize:"vertical",border:"none",background:"transparent",padding:"0",fontSize:"14px",lineHeight:1.6}}
                    />
                  </div>
                  {/* Connector arrow */}
                  {i < chainBlocks.length - 1 && (
                    <div style={{width:"2px",height:"24px",background:`linear-gradient(${bt.color},${(BLOCK_TYPES.find(b=>b.type===chainBlocks[i+1].type)||BLOCK_TYPES[0]).color})`,margin:"0",position:"relative"}}>
                      <div style={{position:"absolute",bottom:"-6px",left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"6px solid transparent",borderRight:"6px solid transparent",borderTop:`8px solid ${(BLOCK_TYPES.find(b=>b.type===chainBlocks[i+1].type)||BLOCK_TYPES[0]).color}`}} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add block buttons */}
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"24px"}}>
            {BLOCK_TYPES.map(bt => (
              <button key={bt.type} onClick={() => { setChainBlocks([...chainBlocks,{type:bt.type,text:""}]); setStressResult(null); }}
                style={{padding:"8px 16px",borderRadius:"8px",border:`1px solid ${bt.color}44`,background:bt.bg,color:bt.color,fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                + {bt.type}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{display:"flex",gap:"10px",marginBottom:"28px"}}>
            <button onClick={runStressTest} disabled={stressTesting}
              style={{flex:1,padding:"12px",borderRadius:"8px",border:"none",background:dark?"#fff":"#111",color:dark?"#111":"#fff",fontSize:"14px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",opacity:stressTesting?0.6:1}}>
              {stressTesting ? "Stress testing..." : "⚡ Stress Test this Chain"}
            </button>
            <button onClick={() => { setChainBlocks([{type:"Claim",text:""}]); setStressResult(null); setChainMotion(""); }}
              style={{padding:"12px 18px",borderRadius:"8px",border:`1px solid ${T.border}`,background:"transparent",color:T.textMuted,fontSize:"13px",cursor:"pointer",fontFamily:"inherit"}}>
              Reset
            </button>
          </div>

          {/* Stress test result */}
          {stressResult && (
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"10px",padding:"22px",marginBottom:"24px"}}>
              <p style={{fontSize:"11px",fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:".1em",marginBottom:"16px"}}>Stress Test Result</p>
              <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
                <div>
                  <p style={{fontSize:"11px",color:T.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em",marginBottom:"4px"}}>Verdict</p>
                  <p style={{fontSize:"15px",fontWeight:600,color:T.text,lineHeight:1.5}}>{stressResult.verdict}</p>
                </div>
                <div style={{background:T.oppBg,border:`1px solid ${T.oppBorder}`,borderRadius:"8px",padding:"14px"}}>
                  <p style={{fontSize:"10px",color:T.opp,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",marginBottom:"6px"}}>How an opponent attacks it</p>
                  <p style={{fontSize:"14px",color:T.textSub,lineHeight:1.7,fontStyle:"italic"}}>"{stressResult.attack}"</p>
                </div>
                <div style={{background:T.propBg,border:`1px solid ${T.propBorder}`,borderRadius:"8px",padding:"14px"}}>
                  <p style={{fontSize:"10px",color:T.prop,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",marginBottom:"6px"}}>How to strengthen it</p>
                  <p style={{fontSize:"14px",color:T.textSub,lineHeight:1.7}}>{stressResult.fix}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TIMER */}
      {view === "timer" && (
        <div style={{maxWidth:"520px",margin:"0 auto",padding:"40px 24px 60px"}}>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(24px,4vw,38px)",fontWeight:900,marginBottom:"6px",color:T.text,letterSpacing:"-1px"}}>Prep Timer</h1>
          <p style={{color:T.textMuted,fontSize:"14px",marginBottom:"28px"}}>Runs in the background even when you switch tabs.</p>

          {!timerRunning ? (
            <div style={{display:"flex",flexDirection:"column",gap:"16px"}}>
              {/* Format presets */}
              <div>
                <label style={{display:"block",fontSize:"11px",color:T.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:"8px"}}>Format</label>
                <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
                  {Object.keys(FORMATS).map(f => (
                    <button key={f} onClick={() => setTimerFormat(f)}
                      style={{padding:"8px 16px",borderRadius:"7px",border:`1px solid ${timerFormat===f?(dark?"#e0e0e0":"#111"):T.border}`,background:timerFormat===f?(dark?"#fff":"#111"):"transparent",color:timerFormat===f?(dark?"#111":"#fff"):T.textMuted,fontSize:"12px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                      {f === "WSDC" ? "WSDC (30 min)" : f === "CNDF" ? "CNDF (15 min)" : f === "BP" ? "BP (15 min)" : "Custom"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom duration */}
              {timerFormat === "Custom" && (
                <div>
                  <label style={{display:"block",fontSize:"11px",color:T.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:"8px"}}>Duration (minutes)</label>
                  <input type="number" min="1" max="60" value={timerCustom} onChange={e => setTimerCustom(Number(e.target.value))}
                    style={{width:"120px",padding:"10px 14px",background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:"8px",color:T.text,fontSize:"16px",fontFamily:"inherit"}} />
                </div>
              )}

              {/* Side selector */}
              <div>
                <label style={{display:"block",fontSize:"11px",color:T.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:"8px"}}>Side (optional)</label>
                <div style={{display:"flex",gap:"8px"}}>
                  {["Proposition","Opposition",""].map((s,i) => (
                    <button key={i} onClick={() => setTimerSide(s)}
                      style={{padding:"8px 16px",borderRadius:"7px",border:`1px solid ${timerSide===s?(s==="Proposition"?T.propBorder:s==="Opposition"?T.oppBorder:T.border):T.border}`,background:timerSide===s?(s==="Proposition"?T.propBg:s==="Opposition"?T.oppBg:T.surface2):"transparent",color:timerSide===s?(s==="Proposition"?T.prop:s==="Opposition"?T.opp:T.text):T.textMuted,fontSize:"12px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                      {s || "No side"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Motion input */}
              <div>
                <label style={{display:"block",fontSize:"11px",color:T.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:"8px"}}>Motion (optional)</label>
                <input value={timerMotion} onChange={e => setTimerMotion(e.target.value)}
                  placeholder="Paste or type the motion here..."
                  style={{width:"100%",padding:"10px 14px",background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:"8px",color:T.text,fontSize:"14px",fontFamily:"inherit"}} />
              </div>

              <button onClick={startTimer}
                style={{padding:"13px",borderRadius:"8px",border:"none",background:dark?"#fff":"#111",color:dark?"#111":"#fff",fontSize:"15px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:"4px"}}>
                Start Prep
              </button>
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:"20px"}}>
              {/* Motion display */}
              {timerMotion && (
                <div style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:"12px",padding:"16px"}}>
                  <p style={{fontSize:"11px",color:T.textMuted,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:"6px"}}>Motion</p>
                  <p style={{fontSize:"14px",color:T.text,lineHeight:1.55}}>{timerMotion}</p>
                </div>
              )}

              {/* Side badge */}
              {timerSide && (
                <div style={{display:"inline-flex",alignItems:"center",padding:"5px 14px",borderRadius:"6px",background:timerSide==="Proposition"?T.propBg:T.oppBg,border:`1px solid ${timerSide==="Proposition"?T.propBorder:T.oppBorder}`,width:"fit-content"}}>
                  <span style={{fontSize:"12px",fontWeight:700,letterSpacing:".06em",textTransform:"uppercase",color:timerSide==="Proposition"?T.prop:T.opp}}>{timerSide}</span>
                </div>
              )}

              {/* Big clock */}
              <div style={{textAlign:"center",padding:"32px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:"12px"}}>
                <div style={{fontSize:"72px",fontWeight:900,fontFamily:"'Playfair Display',serif",color:timerRemaining <= 60?T.opp:timerRemaining <= 300?"#d97706":T.text,lineHeight:1,marginBottom:"16px",letterSpacing:"-2px"}}>
                  {formatTime(timerRemaining)}
                </div>
                {/* Progress bar */}
                <div style={{background:T.surface2,borderRadius:"8px",height:"8px",overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:"8px",background:timerRemaining<=60?T.opp:timerRemaining<=300?"#d97706":T.prop,width:`${timerProgress()}%`,transition:"width .5s linear"}} />
                </div>
                <p style={{fontSize:"12px",color:T.textMuted,marginTop:"10px"}}>{timerFormat} prep{timerSide ? ` · ${timerSide}` : ""}</p>
              </div>

              <button onClick={stopTimer}
                style={{padding:"11px",borderRadius:"8px",border:`1px solid ${T.oppBorder}`,background:T.oppBg,color:T.opp,fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>
                Stop Timer
              </button>
            </div>
          )}
        </div>
      )}

      {/* ADMIN */}
      {view === "admin" && (
        <div style={{maxWidth:"780px",margin:"0 auto",padding:"40px 24px 60px"}}>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(24px,4vw,38px)",fontWeight:900,marginBottom:"6px",color:T.text,letterSpacing:"-1px"}}>Admin</h1>
          <p style={{color:T.textMuted,fontSize:"14px",marginBottom:"26px"}}>Changes save directly to your Supabase database.</p>

          {!adminUnlocked ? (
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"10px",padding:"28px",maxWidth:"380px"}}>
              <p style={{fontSize:"14px",color:T.textMuted,marginBottom:"16px"}}>Enter admin password to continue</p>
              <input type="password" style={{...INP,marginBottom:"10px"}} placeholder="Password" value={pwInput} onChange={e => setPwInput(e.target.value)} onKeyDown={e => e.key==="Enter" && checkPassword()} />
              {pwError && <p style={{fontSize:"12px",color:"#ff7070",marginBottom:"10px"}}>Incorrect password</p>}
              <button onClick={checkPassword} style={{padding:"10px 22px",borderRadius:"7px",border:"none",background:dark?"#fff":"#111",color:dark?"#111":"#fff",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Unlock</button>
            </div>
          ) : !serviceKeySet ? (
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"10px",padding:"28px",maxWidth:"520px"}}>
              <p style={{fontSize:"15px",fontWeight:600,color:T.text,marginBottom:"8px"}}>Paste your Supabase service key</p>
              <p style={{fontSize:"13px",color:T.textMuted,marginBottom:"16px"}}>Supabase → Settings → API → service_role key</p>
              <input type="password" style={{...INP,marginBottom:"10px"}} placeholder="eyJ..." value={skInput} onChange={e => setSkInput(e.target.value)} />
              <button onClick={checkServiceKey} style={{padding:"10px 22px",borderRadius:"7px",border:"none",background:dark?"#fff":"#111",color:dark?"#111":"#fff",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Connect</button>
            </div>
          ) : (
            <>
              {!apiKeySet && (
                <div style={{background:T.propBg,border:`1px solid ${T.propBorder}`,borderRadius:"8px",padding:"16px",marginBottom:"20px"}}>
                  <p style={{fontSize:"13px",fontWeight:700,color:T.prop,marginBottom:"5px"}}>Connect AI Generation (optional)</p>
                  <p style={{fontSize:"13px",color:T.textMuted,marginBottom:"12px"}}>Paste your Anthropic API key to enable one-click argument generation.</p>
                  <div style={{display:"flex",gap:"10px"}}>
                    <input type="password" style={{...INP,flex:1}} placeholder="sk-ant-..." value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} />
                    <button onClick={checkApiKey} style={{padding:"10px 18px",borderRadius:"8px",border:"none",background:"#2a6a3a",color:"#fff",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>Connect</button>
                  </div>
                </div>
              )}

              <div style={{display:"flex",gap:"8px",marginBottom:"28px"}}>
                {[["add","Add Motion"],["manage",`Manage (${motions.length})`]].map(([t,label]) => (
                  <button key={t} onClick={() => setAdminTab(t)} style={{padding:"7px 16px",borderRadius:"6px",border:`1px solid ${adminTab===t?(dark?"#e0e0e0":"#111"):T.border}`,background:adminTab===t?(dark?"#fff":"#111"):"transparent",color:adminTab===t?(dark?"#111":"#fff"):T.textMuted,fontSize:"12px",cursor:"pointer",fontWeight:500,fontFamily:"inherit"}}>{label}</button>
                ))}
              </div>

              {adminTab === "add" && (
                <div style={{display:"flex",flexDirection:"column",gap:"18px"}}>
                  {editingId && <div style={{background:"rgba(120,100,255,.1)",border:`1px solid ${T.accent}44`,borderRadius:"8px",padding:"10px 16px",fontSize:"13px",color:T.accentText}}>Editing existing motion. Click Update to save changes.</div>}
                  <Lbl label="Motion Text *" color={T.textMuted}>
                    <input style={INP} placeholder="e.g. THW implement universal basic income" value={form.motion} onChange={e => setForm(f => ({...f,motion:e.target.value}))} />
                  </Lbl>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px"}}>
                    <Lbl label="Theme" color={T.textMuted}><select style={INP} value={form.theme} onChange={e => setForm(f => ({...f,theme:e.target.value,subtheme:""}))}>{Object.keys(THEME_TREE).map(t => <option key={t}>{t}</option>)}</select></Lbl>
                    <Lbl label="Sub-theme" color={T.textMuted}><select style={INP} value={form.subtheme||""} onChange={e => setForm(f => ({...f,subtheme:e.target.value}))}><option value="">-- Select --</option>{(THEME_TREE[form.theme]||[]).map(s => <option key={s}>{s}</option>)}</select></Lbl>
                    <Lbl label="Difficulty" color={T.textMuted}><select style={INP} value={form.difficulty} onChange={e => setForm(f => ({...f,difficulty:e.target.value}))}>{["Easy","Medium","Hard"].map(d => <option key={d}>{d}</option>)}</select></Lbl>
                    <Lbl label="Tournament" color={T.textMuted}><input style={INP} placeholder="e.g. WSDC 2024" value={form.tournament} onChange={e => setForm(f => ({...f,tournament:e.target.value}))} /></Lbl>
                  </div>
                  <Lbl label="Keywords (comma separated)" color={T.textMuted}>
                    <input style={INP} placeholder="e.g. climate, taxation, carbon" value={form.keywords} onChange={e => setForm(f => ({...f,keywords:e.target.value}))} />
                  </Lbl>

                  <button onClick={generateArguments} disabled={generating || !apiKeySet}
                    style={{padding:"11px 22px",borderRadius:"7px",border:`1px solid ${apiKeySet?T.propBorder:T.border}`,background:apiKeySet?T.propBg:"transparent",color:apiKeySet?T.prop:T.textFaint,fontSize:"13px",fontWeight:600,cursor:apiKeySet?"pointer":"not-allowed",fontFamily:"inherit",transition:"all .2s"}}>
                    {generating ? "Generating..." : apiKeySet ? "✦ Generate Arguments with AI" : "Connect API key above to enable AI generation"}
                  </button>

                  {[["prop","Proposition","#40c090"],["opp","Opposition","#ff7070"]].map(([w,label,col]) => (
                    <div key={w}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                        <span style={{fontSize:"11px",fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",color:col}}>{label} Arguments</span>
                        <button onClick={() => addArg(w)} style={{padding:"4px 12px",borderRadius:"6px",border:`1px solid ${col}44`,background:`${col}11`,color:col,fontSize:"12px",cursor:"pointer",fontFamily:"inherit"}}>+ Add manually</button>
                      </div>
                      {form[w==="prop"?"propArgs":"oppArgs"].map((arg, i) => (
                        <div key={i} style={{background:T.surface3,border:`1px solid ${T.border}`,borderRadius:"10px",padding:"14px",marginBottom:"10px",display:"flex",flexDirection:"column",gap:"8px"}}>
                          <input style={INP} placeholder="Argument name" value={arg.name||""} onChange={e => setArgF(w,i,"name",e.target.value)} />
                          <textarea style={{...INP,minHeight:"80px",resize:"vertical"}} placeholder="Summary with mechanism and impact" value={arg.summary||""} onChange={e => setArgF(w,i,"summary",e.target.value)} />
                          <select style={INP} value={arg.type||"Practical"} onChange={e => setArgF(w,i,"type",e.target.value)}>{["Practical","Principled","Rebuttal"].map(t => <option key={t}>{t}</option>)}</select>
                        </div>
                      ))}
                    </div>
                  ))}

                  <div style={{display:"flex",gap:"10px",marginTop:"6px"}}>
                    <button onClick={editingId ? saveEdit : submit} disabled={saving} style={{flex:1,padding:"12px 22px",borderRadius:"7px",border:"none",background:dark?"#fff":"#111",color:dark?"#111":"#fff",fontSize:"14px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",opacity:saving?0.6:1}}>
                      {saving ? "Saving..." : editingId ? "Update Motion" : "Save Motion to Database"}
                    </button>
                    {editingId && <button onClick={() => { setForm(EMPTY_FORM); setEditingId(null); }} style={{padding:"12px 18px",borderRadius:"7px",border:`1px solid ${T.border}`,background:"transparent",color:T.textMuted,fontSize:"13px",cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>}
                  </div>
                </div>
              )}

              {adminTab === "manage" && (
                <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",background:T.surface3,border:`1px solid ${T.border2}`,borderRadius:"12px",marginBottom:"6px"}}>
                    <div>
                      <p style={{fontSize:"14px",fontWeight:600,color:T.text,marginBottom:"3px"}}>Export all motions</p>
                      <p style={{fontSize:"12px",color:T.textMuted}}>Download a backup file of everything in your database</p>
                    </div>
                    <button onClick={exportData} style={{padding:"8px 16px",borderRadius:"6px",border:`1px solid ${T.border}`,background:"transparent",color:T.textMuted,fontSize:"12px",fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>↓ Export ({motions.length})</button>
                  </div>
                  {motions.map(m => (
                    <div key={m.id} style={{display:"flex",alignItems:"center",gap:"10px",padding:"12px 16px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:"8px"}}>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:"14px",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:"3px",color:T.text}}>{m.motion}</p>
                        <p style={{fontSize:"12px",color:T.textMuted}}>{m.theme} · {getArgs(m,"prop").length} prop · {getArgs(m,"opp").length} opp</p>
                      </div>
                      <button onClick={() => openMotion(m)} style={{padding:"5px 12px",borderRadius:"6px",border:`1px solid ${T.border3}`,background:"transparent",color:T.textSub,fontSize:"12px",cursor:"pointer",fontFamily:"inherit"}}>View</button>
                      <button onClick={() => startEdit(m)} style={{padding:"5px 11px",borderRadius:"5px",border:`1px solid ${T.border}`,background:"transparent",color:T.textMuted,fontSize:"11px",cursor:"pointer",fontFamily:"inherit"}}>Edit</button>
                      <button onClick={() => deleteMotion(m.id)} style={{padding:"5px 11px",borderRadius:"5px",border:`1px solid ${T.oppBorder}`,background:"transparent",color:T.opp,fontSize:"11px",cursor:"pointer",fontFamily:"inherit"}}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
      </div>
    </div>
  );
}

function Lbl({ label, color, children }) {
  return (
    <div>
      <label style={{display:"block",fontSize:"11px",color:color||"#666",fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:"6px"}}>{label}</label>
      {children}
    </div>
  );
}

