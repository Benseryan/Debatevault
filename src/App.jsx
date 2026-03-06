import React, { useState, useEffect } from "react";

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

const THEMES = ["All Themes","Environment","Technology","International Relations","Criminal Justice","Economics","Human Rights","Gender & Identity","Health"];
const DIFFICULTIES = ["All","Easy","Medium","Hard"];

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

// Dark and light theme tokens
const DARK = {
  bg: "#0d0d1a", surface: "#111125", surface2: "#13132a", surface3: "#0d0d1e",
  border: "#1e1e3a", border2: "#2a2a4a", border3: "#2a2a5a",
  text: "#e0e0f0", textSub: "#8080aa", textMuted: "#555", textFaint: "#444",
  nav: "rgba(13,13,26,.96)", accent: "#7864ff", accentText: "#a89aff",
  propBorder: "#1e3a2a", oppBorder: "#3a1e1e",
  scrollThumb: "#2a2a4a", placeholder: "#444",
};
const LIGHT = {
  bg: "#f5f5f0", surface: "#ffffff", surface2: "#f0f0eb", surface3: "#e8e8e2",
  border: "#ddddd5", border2: "#ccccC4", border3: "#bbbbB4",
  text: "#1a1a2e", textSub: "#4a4a6a", textMuted: "#888", textFaint: "#aaa",
  nav: "rgba(245,245,240,.96)", accent: "#6050ee", accentText: "#6050ee",
  propBorder: "#c0ddc8", oppBorder: "#ddc0c0",
  scrollThumb: "#ccccC4", placeholder: "#bbb",
};

const EMPTY_FORM = {motion:"",theme:"Environment",keywords:"",tournament:"",difficulty:"Medium",propArgs:[{name:"",summary:"",type:"Practical"}],oppArgs:[{name:"",summary:"",type:"Practical"}]};

export default function App() {
  const [dark, setDark] = useState(true);
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
  const [adminTab, setAdminTab] = useState("add");
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [serviceKey, setServiceKey] = useState("");
  const [serviceKeySet, setServiceKeySet] = useState(false);
  const [skInput, setSkInput] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiKeySet, setApiKeySet] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");

  const INP = {width:"100%",padding:"10px 14px",background:T.surface2,border:`1px solid ${T.border2}`,borderRadius:"8px",color:T.text,fontSize:"14px",fontFamily:"inherit"};

  // Keep body background in sync with theme
  useEffect(() => {
    document.body.style.background = T.bg;
    document.body.style.transition = "background 0.2s";
  }, [dark]);

  const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;900&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    ::-webkit-scrollbar{width:5px;}
    ::-webkit-scrollbar-thumb{background:#2a2a4a;border-radius:3px;}
    .card{transition:transform .18s,box-shadow .18s;cursor:pointer;}
    .card:hover{transform:translateY(-3px);box-shadow:0 14px 40px rgba(100,80,255,.15)!important;}
    .pill{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;}
    input,select,textarea{font-family:inherit;}
    input:focus,select:focus,textarea:focus{outline:none;border-color:#7864ff!important;box-shadow:0 0 0 3px #7864ff22;}
    ::placeholder{color:#888;}
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

  function printMotion(m) {
    const propArgs = m.prop_args || m.propArgs || [];
    const oppArgs = m.opp_args || m.oppArgs || [];
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${m.motion}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'DM Sans', sans-serif; background: #fff; color: #1a1a2e; padding: 40px; max-width: 900px; margin: 0 auto; }
          .header { border-bottom: 3px solid #7864ff; padding-bottom: 20px; margin-bottom: 28px; }
          .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-right: 8px; border: 1px solid #ccc; color: #555; }
          h1 { font-family: 'Playfair Display', serif; font-size: 26px; line-height: 1.3; margin: 12px 0 8px; color: #1a1a2e; }
          .keywords { font-size: 12px; color: #888; margin-top: 8px; }
          .columns { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 8px; }
          .side-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 8px 14px; border-radius: 8px; margin-bottom: 14px; }
          .prop-title { background: #e8f5ee; color: #2a6a3a; }
          .opp-title { background: #f5e8e8; color: #6a2a2a; }
          .arg { border: 1px solid #e0e0e8; border-radius: 10px; padding: 16px; margin-bottom: 12px; break-inside: avoid; }
          .arg-name { font-size: 14px; font-weight: 600; color: #1a1a2e; margin-bottom: 4px; }
          .arg-type { display: inline-block; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: 10px; margin-bottom: 8px; }
          .practical { background: rgba(40,160,120,.12); color: #2a7a60; border: 1px solid rgba(40,160,120,.3); }
          .principled { background: rgba(120,100,255,.12); color: #6050cc; border: 1px solid rgba(120,100,255,.3); }
          .arg-summary { font-size: 13px; color: #4a4a6a; line-height: 1.7; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #aaa; text-align: center; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <span class="badge">${m.theme}</span>
            <span class="badge">${m.difficulty}</span>
            ${m.tournament ? `<span class="badge">${m.tournament}</span>` : ""}
          </div>
          <h1>${m.motion}</h1>
          ${m.keywords && m.keywords.length ? `<div class="keywords">Keywords: ${m.keywords.join(", ")}</div>` : ""}
        </div>
        <div class="columns">
          <div>
            <div class="side-title prop-title">Proposition (${propArgs.length} arguments)</div>
            ${propArgs.map(a => `
              <div class="arg">
                <div class="arg-name">${a.name}</div>
                <span class="arg-type ${a.type === "Principled" ? "principled" : "practical"}">${a.type}</span>
                <div class="arg-summary">${a.summary}</div>
              </div>
            `).join("")}
          </div>
          <div>
            <div class="side-title opp-title">Opposition (${oppArgs.length} arguments)</div>
            ${oppArgs.map(a => `
              <div class="arg">
                <div class="arg-name">${a.name}</div>
                <span class="arg-type ${a.type === "Principled" ? "principled" : "practical"}">${a.type}</span>
                <div class="arg-summary">${a.summary}</div>
              </div>
            `).join("")}
          </div>
        </div>
        <div class="footer">Generated by DebateVault · debatevault.vercel.app</div>
      </body>
      </html>
    `;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 600);
  }

  function checkPassword() {
    if (pwInput === ADMIN_PASSWORD) { setAdminUnlocked(true); setPwError(false); }
    else { setPwError(true); }
  }

  function checkServiceKey() {
    if (skInput.trim().startsWith("eyJ")) { setServiceKey(skInput.trim()); setServiceKeySet(true); }
    else { alert("Paste your Supabase service_role key."); }
  }

  function checkApiKey() {
    if (apiKeyInput.trim().startsWith("sk-ant")) { setApiKey(apiKeyInput.trim()); setApiKeySet(true); showToast("API key connected!"); }
    else { alert("That doesn't look like an Anthropic API key."); }
  }

  const browsed = motions.filter(m =>
    (filterTheme === "All Themes" || m.theme === filterTheme) &&
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

  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'DM Sans',sans-serif",transition:"background .2s,color .2s"}}>
      <style>{STYLES}</style>

      {toast && (
        <div style={{position:"fixed",bottom:"24px",left:"50%",transform:"translateX(-50%)",background:toast.isError?(dark?"#3a1e1e":"#fff0f0"):(dark?"#1e3a2a":"#f0fff4"),border:`1px solid ${toast.isError?"#ff707066":"#40c09066"}`,borderRadius:"10px",padding:"12px 24px",fontSize:"14px",color:toast.isError?"#ff7070":"#2a8a5a",zIndex:999,boxShadow:"0 8px 32px rgba(0,0,0,.15)",whiteSpace:"nowrap"}}>
          {toast.msg}
        </div>
      )}

      {loadError && (
        <div style={{background:dark?"#2a1a00":"#fff8ee",borderBottom:`1px solid ${dark?"#7a520033":"#f0c060"}`,padding:"8px 24px",textAlign:"center",fontSize:"12px",color:dark?"#ffaa44":"#a07000"}}>
          Could not connect to database. Check your internet connection.
        </div>
      )}

      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:98,background:T.nav,backdropFilter:"blur(10px)",borderBottom:`1px solid ${T.border}`,padding:"0 28px",height:"58px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div onClick={() => { setView("browse"); clearSearch(); }} style={{display:"flex",alignItems:"center",gap:"9px",cursor:"pointer"}}>
          <div style={{width:"30px",height:"30px",borderRadius:"8px",background:"linear-gradient(135deg,#7864ff,#b0a0ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"15px"}}>⚖</div>
          <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:"18px",color:T.text}}>DebateVault</span>
        </div>
        <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
          <span style={{fontSize:"12px",color:T.textFaint,marginRight:"4px"}}>{motions.length} motions</span>

          {/* Light/dark toggle */}
          <button onClick={() => setDark(d => !d)}
            style={{width:"36px",height:"36px",borderRadius:"8px",border:`1px solid ${T.border2}`,background:T.surface2,cursor:"pointer",fontSize:"16px",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
            {dark ? "☀️" : "🌙"}
          </button>

          {[["browse","Browse"],["admin","Admin ✦"]].map(([v,label]) => (
            <button key={v} onClick={() => { setView(v); if (v==="browse") clearSearch(); }}
              style={{padding:"7px 16px",borderRadius:"8px",border:`1px solid ${view===v||(view==="detail"&&v==="browse")?T.accent+"55":T.border2}`,background:view===v||(view==="detail"&&v==="browse")?"rgba(120,100,255,.15)":"transparent",color:view===v||(view==="detail"&&v==="browse")?T.accentText:T.textMuted,fontSize:"13px",fontWeight:500,cursor:"pointer"}}>
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* BROWSE */}
      {view === "browse" && (
        <div>
          <div style={{maxWidth:"720px",margin:"0 auto",padding:"52px 24px 36px",textAlign:"center"}}>
            <div style={{display:"inline-flex",alignItems:"center",padding:"4px 14px",borderRadius:"20px",background:"rgba(120,100,255,.1)",border:"1px solid rgba(120,100,255,.2)",marginBottom:"20px"}}>
              <span style={{fontSize:"11px",color:T.accentText,fontWeight:600,textTransform:"uppercase",letterSpacing:".07em"}}>WSDC Argument Database</span>
            </div>
            <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,6vw,52px)",fontWeight:900,lineHeight:1.15,marginBottom:"12px",color:dark?"#f0f0fa":"#1a1a2e"}}>
              Every argument.<br/>Every motion.
            </h1>
            <p style={{color:T.textMuted,fontSize:"16px",marginBottom:"30px",lineHeight:1.6}}>Search any topic and find ready-to-use Proposition and Opposition arguments.</p>
            <div style={{display:"flex",gap:"10px",maxWidth:"580px",margin:"0 auto"}}>
              <div style={{flex:1,position:"relative"}}>
                <span style={{position:"absolute",left:"14px",top:"50%",transform:"translateY(-50%)",color:T.textFaint,fontSize:"17px",pointerEvents:"none"}}>⌕</span>
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key==="Enter" && doSearch()}
                  placeholder='Try "tesla cars", "social media", "drugs"...'
                  style={{width:"100%",padding:"13px 40px 13px 42px",background:T.surface,border:`1px solid ${T.border2}`,borderRadius:"12px",color:T.text,fontSize:"15px",fontFamily:"inherit",transition:"border-color .2s"}} />
                {query && <button onClick={clearSearch} style={{position:"absolute",right:"10px",top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:"22px",lineHeight:1,padding:"0 4px"}}>×</button>}
              </div>
              <button onClick={doSearch} style={{padding:"13px 22px",borderRadius:"12px",border:"none",background:"linear-gradient(135deg,#7864ff,#b0a0ff)",color:"#fff",fontSize:"14px",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit"}}>Search</button>
            </div>
          </div>

          {!searched && (
            <div style={{maxWidth:"1080px",margin:"0 auto",padding:"0 24px 18px",display:"flex",gap:"10px",flexWrap:"wrap",alignItems:"center"}}>
              <select value={filterTheme} onChange={e => setFilterTheme(e.target.value)} style={{padding:"7px 13px",background:T.surface,border:`1px solid ${T.border2}`,borderRadius:"8px",color:T.text,fontSize:"13px",cursor:"pointer",fontFamily:"inherit"}}>
                {THEMES.map(t => <option key={t}>{t}</option>)}
              </select>
              {DIFFICULTIES.map(d => (
                <button key={d} onClick={() => setFilterDiff(d)} style={{padding:"7px 14px",borderRadius:"8px",border:`1px solid ${filterDiff===d?T.accent:T.border2}`,background:filterDiff===d?"rgba(120,100,255,.15)":"transparent",color:filterDiff===d?T.accentText:T.textMuted,fontSize:"13px",cursor:"pointer",fontWeight:500,fontFamily:"inherit"}}>{d}</button>
              ))}
            </div>
          )}

          {searched && (
            <div style={{maxWidth:"1080px",margin:"0 auto",padding:"0 24px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <p style={{fontSize:"14px",color:T.textMuted}}>
                {results.length > 0 ? <><span style={{color:T.accentText,fontWeight:600}}>{results.length} result{results.length!==1?"s":""}</span> for "{query}"</> : <span>No results for "<b style={{color:T.text}}>{query}</b>"</span>}
              </p>
              <button onClick={clearSearch} style={{padding:"6px 14px",borderRadius:"8px",border:`1px solid ${T.border2}`,background:"transparent",color:T.textMuted,fontSize:"13px",cursor:"pointer",fontFamily:"inherit"}}>Clear</button>
            </div>
          )}

          <div style={{maxWidth:"1080px",margin:"0 auto",padding:"0 24px 60px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:"14px"}}>
            {displayed.map(m => (
              <div key={m.id} className="card" onClick={() => openMotion(m)} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:"16px",padding:"22px",boxShadow:dark?"0 4px 20px rgba(0,0,0,.3)":"0 4px 20px rgba(0,0,0,.06)"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:"12px"}}>
                  <span className="pill" style={{background:`${TC[m.theme]||"#333"}22`,color:TC[m.theme]||T.textMuted,border:`1px solid ${TC[m.theme]||"#333"}44`}}>{m.theme}</span>
                  <span className="pill" style={{background:`${DC[m.difficulty]}22`,color:DC[m.difficulty],border:`1px solid ${DC[m.difficulty]}44`}}>{m.difficulty}</span>
                </div>
                <p style={{fontSize:"14px",fontWeight:500,lineHeight:1.55,color:T.text,marginBottom:"16px"}}>{m.motion}</p>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{display:"flex",gap:"12px"}}>
                    <span style={{fontSize:"12px",color:"#40c090"}}>↑ {getArgs(m,"prop").length} prop</span>
                    <span style={{fontSize:"12px",color:"#ff7070"}}>↓ {getArgs(m,"opp").length} opp</span>
                  </div>
                  {m.tournament && <span style={{fontSize:"11px",color:T.textFaint}}>{m.tournament}</span>}
                </div>
              </div>
            ))}
            {displayed.length === 0 && (
              <div style={{gridColumn:"1/-1",textAlign:"center",padding:"60px",color:T.textFaint}}>
                <div style={{fontSize:"36px",marginBottom:"12px"}}>🔍</div>
                <p>{searched ? "No motions found. Try different keywords." : "No motions yet. Add some via the Admin panel."}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAIL */}
      {view === "detail" && selected && (
        <div style={{maxWidth:"880px",margin:"0 auto",padding:"36px 24px 60px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"28px"}}>
            <button onClick={() => setView("browse")} style={{background:"none",border:"none",color:T.accentText,fontSize:"14px",cursor:"pointer",fontFamily:"inherit"}}>← Back</button>
            <button onClick={() => printMotion(selected)} style={{padding:"8px 18px",borderRadius:"8px",border:`1px solid ${T.border2}`,background:T.surface2,color:T.textSub,fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:"6px"}}>
              🖨 Export PDF
            </button>
          </div>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"14px",alignItems:"center"}}>
            <span className="pill" style={{background:`${TC[selected.theme]||"#333"}22`,color:TC[selected.theme]||T.textMuted,border:`1px solid ${TC[selected.theme]||"#333"}44`}}>{selected.theme}</span>
            <span className="pill" style={{background:`${DC[selected.difficulty]}22`,color:DC[selected.difficulty],border:`1px solid ${DC[selected.difficulty]}44`}}>{selected.difficulty}</span>
            {selected.tournament && <span style={{fontSize:"12px",color:T.textMuted}}>{selected.tournament}</span>}
          </div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(20px,4vw,32px)",lineHeight:1.3,marginBottom:"18px",color:T.text}}>{selected.motion}</h1>
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginBottom:"30px"}}>
            {(selected.keywords||[]).map(k => <span key={k} style={{padding:"3px 11px",background:T.surface2,border:`1px solid ${T.border3}`,borderRadius:"20px",fontSize:"12px",color:T.textSub}}>{k}</span>)}
          </div>
          <div style={{display:"flex",background:T.surface2,border:`1px solid ${T.border}`,borderRadius:"12px",padding:"4px",width:"fit-content",marginBottom:"24px"}}>
            {[["prop","Proposition",dark?"#2a6a4a":"#d0f0dc"],["opp","Opposition",dark?"#6a2a2a":"#f0d0d0"]].map(([s,label,col]) => (
              <button key={s} onClick={() => setSide(s)} style={{padding:"9px 26px",borderRadius:"9px",border:"none",fontWeight:600,fontSize:"14px",cursor:"pointer",background:side===s?col:"transparent",color:side===s?(dark?"#fff":"#1a1a2e"):T.textMuted,fontFamily:"inherit",transition:"all .15s"}}>
                {label} ({getArgs(selected,s).length})
              </button>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            {getArgs(selected, side).map((arg, i) => (
              <div key={i} style={{background:T.surface,border:`1px solid ${side==="prop"?T.propBorder:T.oppBorder}`,borderRadius:"14px",padding:"22px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"12px",marginBottom:"10px"}}>
                  <h3 style={{fontSize:"15px",fontWeight:600,color:T.text,lineHeight:1.4}}>{arg.name}</h3>
                  <span style={{padding:"3px 10px",borderRadius:"20px",fontSize:"11px",fontWeight:500,flexShrink:0,background:arg.type==="Principled"?"rgba(120,100,255,.15)":"rgba(40,160,120,.15)",color:arg.type==="Principled"?"#8060ee":"#2a9a70",border:`1px solid ${arg.type==="Principled"?"rgba(120,100,255,.3)":"rgba(40,160,120,.3)"}`}}>{arg.type}</span>
                </div>
                <p style={{fontSize:"14px",color:T.textSub,lineHeight:1.75}}>{arg.summary}</p>
              </div>
            ))}
            {getArgs(selected, side).length === 0 && <p style={{color:T.textFaint,textAlign:"center",padding:"40px"}}>No arguments yet for this side.</p>}
          </div>
        </div>
      )}

      {/* ADMIN */}
      {view === "admin" && (
        <div style={{maxWidth:"780px",margin:"0 auto",padding:"40px 24px 60px"}}>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:"30px",marginBottom:"6px",color:T.text}}>Admin Panel</h1>
          <p style={{color:T.textMuted,fontSize:"14px",marginBottom:"26px"}}>Changes save directly to your Supabase database.</p>

          {!adminUnlocked ? (
            <div style={{background:T.surface,border:`1px solid ${T.border2}`,borderRadius:"14px",padding:"32px",maxWidth:"400px"}}>
              <p style={{fontSize:"14px",color:T.textMuted,marginBottom:"16px"}}>Enter admin password to continue</p>
              <input type="password" style={{...INP,marginBottom:"10px"}} placeholder="Password" value={pwInput} onChange={e => setPwInput(e.target.value)} onKeyDown={e => e.key==="Enter" && checkPassword()} />
              {pwError && <p style={{fontSize:"12px",color:"#ff7070",marginBottom:"10px"}}>Incorrect password</p>}
              <button onClick={checkPassword} style={{padding:"10px 24px",borderRadius:"8px",border:"none",background:"linear-gradient(135deg,#7864ff,#b0a0ff)",color:"#fff",fontSize:"14px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Unlock</button>
            </div>
          ) : !serviceKeySet ? (
            <div style={{background:T.surface,border:`1px solid ${T.border2}`,borderRadius:"14px",padding:"32px",maxWidth:"560px"}}>
              <p style={{fontSize:"15px",fontWeight:600,color:T.text,marginBottom:"8px"}}>Paste your Supabase service key</p>
              <p style={{fontSize:"13px",color:T.accentText,marginBottom:"16px"}}>Supabase → Settings → API → service_role key</p>
              <input type="password" style={{...INP,marginBottom:"10px"}} placeholder="eyJ..." value={skInput} onChange={e => setSkInput(e.target.value)} />
              <button onClick={checkServiceKey} style={{padding:"10px 24px",borderRadius:"8px",border:"none",background:"linear-gradient(135deg,#7864ff,#b0a0ff)",color:"#fff",fontSize:"14px",fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Connect</button>
            </div>
          ) : (
            <>
              {!apiKeySet && (
                <div style={{background:dark?"#0d1a0d":"#f0fff4",border:`1px solid ${dark?"#2a4a2a":"#b0ddc0"}`,borderRadius:"12px",padding:"20px",marginBottom:"24px"}}>
                  <p style={{fontSize:"14px",fontWeight:600,color:"#2a8a50",marginBottom:"6px"}}>Connect AI Generation (optional)</p>
                  <p style={{fontSize:"13px",color:T.textMuted,marginBottom:"12px"}}>Paste your Anthropic API key to enable one-click argument generation. Get one at console.anthropic.com</p>
                  <div style={{display:"flex",gap:"10px"}}>
                    <input type="password" style={{...INP,flex:1}} placeholder="sk-ant-..." value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} />
                    <button onClick={checkApiKey} style={{padding:"10px 18px",borderRadius:"8px",border:"none",background:"#2a6a3a",color:"#fff",fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>Connect</button>
                  </div>
                </div>
              )}

              <div style={{display:"flex",gap:"8px",marginBottom:"28px"}}>
                {[["add","Add Motion"],["manage",`Manage (${motions.length})`]].map(([t,label]) => (
                  <button key={t} onClick={() => setAdminTab(t)} style={{padding:"8px 18px",borderRadius:"8px",border:`1px solid ${adminTab===t?T.accent:T.border2}`,background:adminTab===t?"rgba(120,100,255,.15)":"transparent",color:adminTab===t?T.accentText:T.textMuted,fontSize:"13px",cursor:"pointer",fontWeight:500,fontFamily:"inherit"}}>{label}</button>
                ))}
              </div>

              {adminTab === "add" && (
                <div style={{display:"flex",flexDirection:"column",gap:"18px"}}>
                  <Lbl label="Motion Text *" color={T.textMuted}>
                    <input style={INP} placeholder="e.g. THW implement universal basic income" value={form.motion} onChange={e => setForm(f => ({...f,motion:e.target.value}))} />
                  </Lbl>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"14px"}}>
                    <Lbl label="Theme" color={T.textMuted}><select style={INP} value={form.theme} onChange={e => setForm(f => ({...f,theme:e.target.value}))}>{THEMES.filter(t => t!=="All Themes").map(t => <option key={t}>{t}</option>)}</select></Lbl>
                    <Lbl label="Difficulty" color={T.textMuted}><select style={INP} value={form.difficulty} onChange={e => setForm(f => ({...f,difficulty:e.target.value}))}>{["Easy","Medium","Hard"].map(d => <option key={d}>{d}</option>)}</select></Lbl>
                    <Lbl label="Tournament" color={T.textMuted}><input style={INP} placeholder="e.g. WSDC 2024" value={form.tournament} onChange={e => setForm(f => ({...f,tournament:e.target.value}))} /></Lbl>
                  </div>
                  <Lbl label="Keywords (comma separated)" color={T.textMuted}>
                    <input style={INP} placeholder="e.g. climate, taxation, carbon" value={form.keywords} onChange={e => setForm(f => ({...f,keywords:e.target.value}))} />
                  </Lbl>

                  <button onClick={generateArguments} disabled={generating || !apiKeySet}
                    style={{padding:"13px 28px",borderRadius:"10px",border:`1px solid ${apiKeySet?"#40c09066":T.border2}`,background:apiKeySet?(dark?"rgba(40,160,120,.15)":"#f0fff4"):"transparent",color:apiKeySet?"#2a9a60":T.textFaint,fontSize:"14px",fontWeight:700,cursor:apiKeySet?"pointer":"not-allowed",fontFamily:"inherit",transition:"all .2s"}}>
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

                  <button onClick={submit} disabled={saving} style={{padding:"13px 28px",borderRadius:"10px",border:"none",background:"linear-gradient(135deg,#7864ff,#b0a0ff)",color:"#fff",fontSize:"15px",fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginTop:"6px",opacity:saving?0.7:1}}>
                    {saving ? "Saving..." : "Save Motion to Database"}
                  </button>
                </div>
              )}

              {adminTab === "manage" && (
                <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 20px",background:T.surface3,border:`1px solid ${T.border2}`,borderRadius:"12px",marginBottom:"6px"}}>
                    <div>
                      <p style={{fontSize:"14px",fontWeight:600,color:T.text,marginBottom:"3px"}}>Export all motions</p>
                      <p style={{fontSize:"12px",color:T.textMuted}}>Download a backup file of everything in your database</p>
                    </div>
                    <button onClick={exportData} style={{padding:"9px 20px",borderRadius:"8px",border:`1px solid ${T.accent}55`,background:"rgba(120,100,255,.15)",color:T.accentText,fontSize:"13px",fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>Export ({motions.length})</button>
                  </div>
                  {motions.map(m => (
                    <div key={m.id} style={{display:"flex",alignItems:"center",gap:"12px",padding:"14px 18px",background:T.surface,border:`1px solid ${T.border}`,borderRadius:"10px"}}>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:"14px",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:"3px",color:T.text}}>{m.motion}</p>
                        <p style={{fontSize:"12px",color:T.textMuted}}>{m.theme} · {getArgs(m,"prop").length} prop · {getArgs(m,"opp").length} opp</p>
                      </div>
                      <button onClick={() => openMotion(m)} style={{padding:"5px 12px",borderRadius:"6px",border:`1px solid ${T.border3}`,background:"transparent",color:T.textSub,fontSize:"12px",cursor:"pointer",fontFamily:"inherit"}}>View</button>
                      <button onClick={() => deleteMotion(m.id)} style={{padding:"5px 12px",borderRadius:"6px",border:"1px solid #cc444444",background:"transparent",color:"#cc4444",fontSize:"12px",cursor:"pointer",fontFamily:"inherit"}}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
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
