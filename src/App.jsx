import React, { useState, useEffect } from "react";

const SUPABASE_URL = "https://rajnjpvmllximwhrdhea.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJham5qcHZtbGx4aW13aHJkaGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTQxNTgsImV4cCI6MjA4ODIzMDE1OH0.Z8tVtTrNPoHF0eGPzoBQb_rdXvZ-8E_mvlJBCVTN1XU";
const ADMIN_PASSWORD = "debatevault2024";

// Supabase client
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

const INITIAL_MOTIONS = [
  { id: 1, motion: "THW implement a global carbon tax", theme: "Environment", keywords: ["climate","taxation","carbon","economics","international"], tournament: "WSDC 2023", difficulty: "Medium", prop_args: [{name:"Carbon pricing sends efficient market signals",summary:"A carbon tax directly internalises the externalities of emissions, forcing producers to account for the true cost of pollution and incentivising a shift to cleaner alternatives.",type:"Practical"},{name:"Revenue can fund green transition in developing nations",summary:"Tax revenue redistributed globally allows developing nations to leapfrog fossil fuels entirely, creating a net benefit that outweighs short-term economic disruption.",type:"Practical"},{name:"State responsibility for intergenerational harm",summary:"Governments have a duty to prevent harm to future generations; a carbon tax is the most direct mechanism to fulfil this obligation.",type:"Principled"}], opp_args: [{name:"Disproportionate burden on developing nations",summary:"A uniform global carbon tax ignores economic inequality — developing nations face a far greater relative cost, effectively penalising them for a crisis they did not create.",type:"Principled"},{name:"Carbon leakage undermines effectiveness",summary:"Without universal compliance, production shifts to unregulated regions, meaning total emissions may not fall while economic harm is concentrated in compliant nations.",type:"Practical"},{name:"Regressive impact on low-income households",summary:"Energy costs rise proportionally more for poorer households who spend a larger share of income on heating, transport, and food — without targeted relief, the tax is deeply inequitable.",type:"Practical"}] },
  { id: 2, motion: "THW ban social media platforms for users under 16", theme: "Technology", keywords: ["social media","youth","mental health","censorship","parenting","instagram","tiktok"], tournament: "IODC 2022", difficulty: "Easy", prop_args: [{name:"Social media causes measurable mental health harms in adolescents",summary:"Longitudinal studies link heavy social media use in under-16s to increased rates of anxiety, depression, and eating disorders, giving the state a clear public health justification.",type:"Practical"},{name:"Children cannot meaningfully consent to data harvesting",summary:"Platforms profit from psychological manipulation of minors who lack the cognitive maturity to understand algorithmic engagement — a ban protects them from exploitation.",type:"Principled"}], opp_args: [{name:"Social media is a vital social lifeline for marginalised youth",summary:"LGBTQ+ youth, disabled teens, and those in isolated communities rely on social media for community, support, and identity formation in ways a ban would sever.",type:"Principled"},{name:"Bans are ineffective and drive harm underground",summary:"Age verification is trivially bypassed; a ban pushes teens to unmoderated corners of the internet where harms are greater and parental visibility is lower.",type:"Practical"},{name:"Parental autonomy should govern, not state prohibition",summary:"Parents, not governments, are best placed to manage their children's digital lives — a blanket ban substitutes state judgment for family judgment without justification.",type:"Principled"}] },
  { id: 3, motion: "THBT the International Criminal Court does more harm than good", theme: "International Relations", keywords: ["ICC","international law","justice","sovereignty","Africa","war crimes"], tournament: "Worlds 2022", difficulty: "Hard", prop_args: [{name:"ICC prosecution obstructs peace negotiations",summary:"Indicting sitting leaders removes their incentive to negotiate peace deals, prolonging conflicts — as seen when the ICC warrant against Omar al-Bashir complicated Sudan peace talks.",type:"Practical"},{name:"Selective enforcement undermines legitimacy",summary:"The ICC has overwhelmingly prosecuted African leaders while Western nations operate with impunity, making it a tool of neo-colonial justice rather than universal accountability.",type:"Principled"}], opp_args: [{name:"ICC deters atrocities through threat of accountability",summary:"Even if enforcement is imperfect, the credible threat of prosecution raises the cost of mass atrocities for leaders and may prevent crimes that would otherwise occur.",type:"Practical"},{name:"Victims deserve recognition regardless of political convenience",summary:"Abandoning prosecution for peace-deal pragmatism denies victims any acknowledgment of their suffering — the ICC's existence affirms that some acts are beyond political bargain.",type:"Principled"}] },
  { id: 4, motion: "THW legalise all recreational drugs", theme: "Criminal Justice", keywords: ["drugs","legalisation","harm reduction","war on drugs","addiction","cannabis","weed"], tournament: "WSDC 2021", difficulty: "Medium", prop_args: [{name:"Criminalisation funds organised crime",summary:"Drug prohibition creates black markets worth hundreds of billions, financing cartels and criminal networks — legalisation redirects this economy above ground and under regulation.",type:"Practical"},{name:"Bodily autonomy: adults have the right to harm themselves",summary:"In a liberal society, the state cannot justifiably criminalise behaviour that affects only the individual — drug use is paradigmatically a personal choice.",type:"Principled"}], opp_args: [{name:"Legalisation normalises use and increases addiction rates",summary:"Evidence from alcohol and tobacco shows that legal availability increases consumption — a significant rise in addiction rates would impose enormous social and healthcare costs.",type:"Practical"},{name:"Drug use rarely harms only the user",summary:"Addiction destroys families, reduces workplace productivity, and increases accident rates — the personal choice framing ignores cascading harms to third parties.",type:"Principled"}] },
  { id: 5, motion: "THW give electric vehicle subsidies only to low-income households", theme: "Economics", keywords: ["electric vehicles","EV","subsidies","tesla","inequality","green transition","cars","vehicle"], tournament: "WSDC 2024", difficulty: "Medium", prop_args: [{name:"Current EV subsidies are regressive wealth transfers",summary:"EV subsidies disproportionately benefit wealthy households who can afford EVs — targeting them at low-income buyers corrects this inequity while maintaining climate incentives.",type:"Principled"},{name:"Maximises climate impact per dollar spent",summary:"Switching low-income households from older, polluting vehicles to EVs achieves greater emissions reduction per subsidy dollar than subsidising luxury EV upgrades.",type:"Practical"}], opp_args: [{name:"Restricting subsidies slows mass-market EV adoption",summary:"Universal subsidies drive down EV prices through economies of scale — means-testing reduces market size, keeping EV prices higher for longer and delaying the green transition.",type:"Practical"},{name:"Low-income households face structural barriers beyond purchase price",summary:"Charging infrastructure, insurance, and maintenance costs mean low-income households benefit less from EVs regardless of subsidies — the motion misidentifies the real barrier.",type:"Practical"}] }
];

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

const TC = {"Environment":"#2d6a4f","Technology":"#1a4a7a","International Relations":"#5a3e8a","Criminal Justice":"#7a3e3e","Economics":"#7a6200","Human Rights":"#1a6a6a","Gender & Identity":"#6a2d6a","Health":"#2d5a7a"};
const DC = {"Easy":"#2d6a4f","Medium":"#7a6200","Hard":"#7a3e3e"};
const INP = {width:"100%",padding:"10px 14px",background:"#13132a",border:"1px solid #2a2a4a",borderRadius:"8px",color:"#e0e0f0",fontSize:"14px",fontFamily:"inherit"};
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#0d0d1a;}
::-webkit-scrollbar{width:5px;}
::-webkit-scrollbar-thumb{background:#2a2a4a;border-radius:3px;}
.card{transition:transform .18s,box-shadow .18s;cursor:pointer;}
.card:hover{transform:translateY(-3px);box-shadow:0 14px 40px rgba(100,80,255,.2)!important;}
.pill{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;}
input,select,textarea{font-family:inherit;}
input:focus,select:focus,textarea:focus{outline:none;border-color:#7864ff!important;box-shadow:0 0 0 3px rgba(120,100,255,.12);}
::placeholder{color:#444;}
`;
const EMPTY_FORM = {motion:"",theme:"Environment",keywords:"",tournament:"",difficulty:"Medium",propArgs:[{name:"",summary:"",type:"Practical"}],oppArgs:[{name:"",summary:"",type:"Practical"}]};

export default function App() {
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
  // Admin auth
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  // Service key for write operations
  const [serviceKey, setServiceKey] = useState("");
  const [serviceKeySet, setServiceKeySet] = useState(false);
  const [skInput, setSkInput] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await db.getAll();
        if (data && data.length > 0) {
          setMotions(data);
        } else {
          // Seed with initial motions — shown locally, not pushed to DB yet
          setMotions(INITIAL_MOTIONS);
        }
      } catch {
        setLoadError(true);
        setMotions(INITIAL_MOTIONS);
      }
      setLoaded(true);
    }
    load();
  }, []);

  function showToast(msg, isError = false) {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
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

  async function submit() {
    if (!form.motion.trim()) { alert("Please enter a motion."); return; }
    setSaving(true);
    const nm = {
      id: Date.now(),
      motion: form.motion.trim(),
      theme: form.theme,
      keywords: form.keywords.split(",").map(k => k.trim()).filter(Boolean),
      tournament: form.tournament.trim(),
      difficulty: form.difficulty,
      prop_args: form.propArgs.filter(a => a.name.trim()),
      opp_args: form.oppArgs.filter(a => a.name.trim()),
    };
    try {
      await db.insert(nm, serviceKey);
      setMotions(p => [nm, ...p]);
      setForm(EMPTY_FORM);
      showToast("Motion saved to database ✓");
    } catch {
      showToast("Failed to save — check your service key", true);
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
      showToast("Failed to delete — check your service key", true);
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
    showToast("Exported " + motions.length + " motions ✓");
  }

  function checkPassword() {
    if (pwInput === ADMIN_PASSWORD) { setAdminUnlocked(true); setPwError(false); }
    else { setPwError(true); }
  }

  function checkServiceKey() {
    if (skInput.trim().startsWith("eyJ")) { setServiceKey(skInput.trim()); setServiceKeySet(true); }
    else { alert("That doesn't look right — paste your Supabase service_role key"); }
  }

  const browsed = motions.filter(m =>
    (filterTheme === "All Themes" || m.theme === filterTheme) &&
    (filterDiff === "All" || m.difficulty === filterDiff)
  );
  const displayed = searched ? results : browsed;

  const getArgs = (m, s) => s === "prop" ? (m.prop_args || m.propArgs || []) : (m.opp_args || m.oppArgs || []);

  if (!loaded) return (
    <div style={{ minHeight:"100vh", background:"#0d0d1a", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ textAlign:"center", color:"#555" }}>
        <div style={{ fontSize:"32px", marginBottom:"12px" }}>⚖</div>
        <p>Loading DebateVault...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#0d0d1a", color:"#e0e0f0", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{STYLES}</style>

      {toast && (
        <div style={{ position:"fixed", bottom:"24px", left:"50%", transform:"translateX(-50%)", background: toast.isError ? "#3a1e1e" : "#1e3a2a", border:`1px solid ${toast.isError?"#ff707066":"#40c09066"}`, borderRadius:"10px", padding:"12px 24px", fontSize:"14px", color: toast.isError ? "#ff7070" : "#40c090", zIndex:999, boxShadow:"0 8px 32px rgba(0,0,0,.4)", whiteSpace:"nowrap" }}>
          {toast.msg}
        </div>
      )}

      {loadError && (
        <div style={{ background:"#2a1a00", borderBottom:"1px solid #7a520033", padding:"8px 24px", textAlign:"center", fontSize:"12px", color:"#ffaa44" }}>
          ⚠ Running in offline mode — could not connect to database. Check your internet connection.
        </div>
      )}

      {/* NAV */}
      <nav style={{ position:"sticky", top:0, zIndex:98, background:"rgba(13,13,26,.96)", backdropFilter:"blur(10px)", borderBottom:"1px solid #1a1a3a", padding:"0 28px", height:"58px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div onClick={() => { setView("browse"); clearSearch(); }} style={{ display:"flex", alignItems:"center", gap:"9px", cursor:"pointer" }}>
          <div style={{ width:"30px", height:"30px", borderRadius:"8px", background:"linear-gradient(135deg,#7864ff,#b0a0ff)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"15px" }}>⚖</div>
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:"18px" }}>DebateVault</span>
        </div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          <span style={{ fontSize:"12px", color:"#333", marginRight:"4px" }}>{motions.length} motions</span>
          {[["browse","Browse"],["admin","Admin ✦"]].map(([v,label]) => (
            <button key={v} onClick={() => { setView(v); if (v==="browse") clearSearch(); }}
              style={{ padding:"7px 16px", borderRadius:"8px", border:`1px solid ${view===v||(view==="detail"&&v==="browse")?"#7864ff55":"#222240"}`, background:view===v||(view==="detail"&&v==="browse")?"rgba(120,100,255,.15)":"transparent", color:view===v||(view==="detail"&&v==="browse")?"#a89aff":"#777", fontSize:"13px", fontWeight:500, cursor:"pointer" }}>
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* BROWSE */}
      {view === "browse" && (
        <div>
          <div style={{ maxWidth:"720px", margin:"0 auto", padding:"52px 24px 36px", textAlign:"center" }}>
            <div style={{ display:"inline-flex", alignItems:"center", padding:"4px 14px", borderRadius:"20px", background:"rgba(120,100,255,.1)", border:"1px solid rgba(120,100,255,.2)", marginBottom:"20px" }}>
              <span style={{ fontSize:"11px", color:"#a89aff", fontWeight:600, textTransform:"uppercase", letterSpacing:".07em" }}>WSDC Argument Database</span>
            </div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(28px,6vw,52px)", fontWeight:900, lineHeight:1.15, marginBottom:"12px", background:"linear-gradient(135deg,#f0f0fa 30%,#a89aff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              Every argument.<br/>Every motion.
            </h1>
            <p style={{ color:"#555", fontSize:"16px", marginBottom:"30px", lineHeight:1.6 }}>Search any topic and find ready-to-use Proposition and Opposition arguments.</p>
            <div style={{ display:"flex", gap:"10px", maxWidth:"580px", margin:"0 auto" }}>
              <div style={{ flex:1, position:"relative" }}>
                <span style={{ position:"absolute", left:"14px", top:"50%", transform:"translateY(-50%)", color:"#444", fontSize:"17px", pointerEvents:"none" }}>⌕</span>
                <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key==="Enter" && doSearch()}
                  placeholder='Try "tesla cars", "social media", "drugs"...'
                  style={{ width:"100%", padding:"13px 40px 13px 42px", background:"#111125", border:"1px solid #2a2a4a", borderRadius:"12px", color:"#e0e0f0", fontSize:"15px", fontFamily:"inherit", transition:"border-color .2s" }} />
                {query && <button onClick={clearSearch} style={{ position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#555", cursor:"pointer", fontSize:"22px", lineHeight:1, padding:"0 4px" }}>×</button>}
              </div>
              <button onClick={doSearch} style={{ padding:"13px 22px", borderRadius:"12px", border:"none", background:"linear-gradient(135deg,#7864ff,#b0a0ff)", color:"#fff", fontSize:"14px", fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", fontFamily:"inherit" }}>Search</button>
            </div>
          </div>

          {!searched && (
            <div style={{ maxWidth:"1080px", margin:"0 auto", padding:"0 24px 18px", display:"flex", gap:"10px", flexWrap:"wrap", alignItems:"center" }}>
              <select value={filterTheme} onChange={e => setFilterTheme(e.target.value)} style={{ padding:"7px 13px", background:"#111125", border:"1px solid #2a2a4a", borderRadius:"8px", color:"#aaa", fontSize:"13px", cursor:"pointer", fontFamily:"inherit" }}>
                {THEMES.map(t => <option key={t}>{t}</option>)}
              </select>
              {DIFFICULTIES.map(d => (
                <button key={d} onClick={() => setFilterDiff(d)} style={{ padding:"7px 14px", borderRadius:"8px", border:`1px solid ${filterDiff===d?"#7864ff":"#222240"}`, background:filterDiff===d?"rgba(120,100,255,.15)":"transparent", color:filterDiff===d?"#a89aff":"#777", fontSize:"13px", cursor:"pointer", fontWeight:500, fontFamily:"inherit" }}>{d}</button>
              ))}
            </div>
          )}

          {searched && (
            <div style={{ maxWidth:"1080px", margin:"0 auto", padding:"0 24px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <p style={{ fontSize:"14px", color:"#666" }}>
                {results.length > 0 ? <><span style={{ color:"#a89aff", fontWeight:600 }}>{results.length} result{results.length!==1?"s":""}</span> for "{query}"</> : <span>No results for "<b style={{ color:"#e0e0f0" }}>{query}</b>"</span>}
              </p>
              <button onClick={clearSearch} style={{ padding:"6px 14px", borderRadius:"8px", border:"1px solid #222240", background:"transparent", color:"#777", fontSize:"13px", cursor:"pointer", fontFamily:"inherit" }}>Clear</button>
            </div>
          )}

          <div style={{ maxWidth:"1080px", margin:"0 auto", padding:"0 24px 60px", display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))", gap:"14px" }}>
            {displayed.map(m => (
              <div key={m.id} className="card" onClick={() => openMotion(m)} style={{ background:"#111125", border:"1px solid #1e1e3a", borderRadius:"16px", padding:"22px", boxShadow:"0 4px 20px rgba(0,0,0,.3)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"12px" }}>
                  <span className="pill" style={{ background:`${TC[m.theme]||"#333"}22`, color:TC[m.theme]||"#aaa", border:`1px solid ${TC[m.theme]||"#333"}44` }}>{m.theme}</span>
                  <span className="pill" style={{ background:`${DC[m.difficulty]}22`, color:DC[m.difficulty], border:`1px solid ${DC[m.difficulty]}44` }}>{m.difficulty}</span>
                </div>
                <p style={{ fontSize:"14px", fontWeight:500, lineHeight:1.55, color:"#e0e0f0", marginBottom:"16px" }}>{m.motion}</p>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", gap:"12px" }}>
                    <span style={{ fontSize:"12px", color:"#40c090" }}>↑ {getArgs(m,"prop").length} prop</span>
                    <span style={{ fontSize:"12px", color:"#ff7070" }}>↓ {getArgs(m,"opp").length} opp</span>
                  </div>
                  {m.tournament && <span style={{ fontSize:"11px", color:"#444" }}>{m.tournament}</span>}
                </div>
              </div>
            ))}
            {displayed.length === 0 && (
              <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"60px", color:"#444" }}>
                <div style={{ fontSize:"36px", marginBottom:"12px" }}>🔍</div>
                <p>{searched ? "No motions found — try different keywords" : "No motions match these filters"}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAIL */}
      {view === "detail" && selected && (
        <div style={{ maxWidth:"880px", margin:"0 auto", padding:"36px 24px 60px" }}>
          <button onClick={() => setView("browse")} style={{ background:"none", border:"none", color:"#7864ff", fontSize:"14px", cursor:"pointer", marginBottom:"28px", fontFamily:"inherit" }}>← Back</button>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"14px", alignItems:"center" }}>
            <span className="pill" style={{ background:`${TC[selected.theme]||"#333"}33`, color:TC[selected.theme]||"#aaa", border:`1px solid ${TC[selected.theme]||"#333"}55` }}>{selected.theme}</span>
            <span className="pill" style={{ background:`${DC[selected.difficulty]}22`, color:DC[selected.difficulty], border:`1px solid ${DC[selected.difficulty]}44` }}>{selected.difficulty}</span>
            {selected.tournament && <span style={{ fontSize:"12px", color:"#555" }}>{selected.tournament}</span>}
          </div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(20px,4vw,32px)", lineHeight:1.3, marginBottom:"18px", color:"#f0f0fa" }}>{selected.motion}</h1>
          <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginBottom:"30px" }}>
            {(selected.keywords||[]).map(k => <span key={k} style={{ padding:"3px 11px", background:"#13132a", border:"1px solid #2a2a5a", borderRadius:"20px", fontSize:"12px", color:"#6060aa" }}>{k}</span>)}
          </div>
          <div style={{ display:"flex", background:"#0f0f22", border:"1px solid #1e1e3a", borderRadius:"12px", padding:"4px", width:"fit-content", marginBottom:"24px" }}>
            {[["prop","Proposition","#2a6a4a"],["opp","Opposition","#6a2a2a"]].map(([s,label,col]) => (
              <button key={s} onClick={() => setSide(s)} style={{ padding:"9px 26px", borderRadius:"9px", border:"none", fontWeight:600, fontSize:"14px", cursor:"pointer", background:side===s?col:"transparent", color:side===s?"#fff":"#555", fontFamily:"inherit", transition:"all .15s" }}>
                {label} ({getArgs(selected,s).length})
              </button>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
            {getArgs(selected, side).map((arg, i) => (
              <div key={i} style={{ background:"#111125", border:`1px solid ${side==="prop"?"#1e3a2a":"#3a1e1e"}`, borderRadius:"14px", padding:"22px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"12px", marginBottom:"10px" }}>
                  <h3 style={{ fontSize:"15px", fontWeight:600, color:"#f0f0fa", lineHeight:1.4 }}>{arg.name}</h3>
                  <span style={{ padding:"3px 10px", borderRadius:"20px", fontSize:"11px", fontWeight:500, flexShrink:0, background:arg.type==="Principled"?"rgba(120,100,255,.15)":"rgba(40,160,120,.15)", color:arg.type==="Principled"?"#a89aff":"#40c090", border:`1px solid ${arg.type==="Principled"?"rgba(120,100,255,.3)":"rgba(40,160,120,.3)"}` }}>{arg.type}</span>
                </div>
                <p style={{ fontSize:"14px", color:"#8080aa", lineHeight:1.75 }}>{arg.summary}</p>
              </div>
            ))}
            {getArgs(selected, side).length === 0 && <p style={{ color:"#444", textAlign:"center", padding:"40px" }}>No arguments yet for this side.</p>}
          </div>
        </div>
      )}

      {/* ADMIN */}
      {view === "admin" && (
        <div style={{ maxWidth:"780px", margin:"0 auto", padding:"40px 24px 60px" }}>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"30px", marginBottom:"6px" }}>Admin Panel</h1>
          <p style={{ color:"#555", fontSize:"14px", marginBottom:"26px" }}>Changes save directly to your Supabase database.</p>

          {/* Password gate */}
          {!adminUnlocked ? (
            <div style={{ background:"#111125", border:"1px solid #2a2a4a", borderRadius:"14px", padding:"32px", maxWidth:"400px" }}>
              <p style={{ fontSize:"14px", color:"#888", marginBottom:"16px" }}>Enter admin password to continue</p>
              <input type="password" style={{ ...INP, marginBottom:"10px" }} placeholder="Password" value={pwInput} onChange={e => setPwInput(e.target.value)} onKeyDown={e => e.key==="Enter" && checkPassword()} />
              {pwError && <p style={{ fontSize:"12px", color:"#ff7070", marginBottom:"10px" }}>Incorrect password</p>}
              <button onClick={checkPassword} style={{ padding:"10px 24px", borderRadius:"8px", border:"none", background:"linear-gradient(135deg,#7864ff,#b0a0ff)", color:"#fff", fontSize:"14px", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Unlock</button>
            </div>
          ) : !serviceKeySet ? (
            /* Service key gate */
            <div style={{ background:"#111125", border:"1px solid #2a2a4a", borderRadius:"14px", padding:"32px", maxWidth:"560px" }}>
              <p style={{ fontSize:"15px", fontWeight:600, color:"#e0e0f0", marginBottom:"8px" }}>One more step — paste your Supabase service key</p>
              <p style={{ fontSize:"13px", color:"#666", marginBottom:"6px" }}>This lets you write to the database. Find it in:</p>
              <p style={{ fontSize:"13px", color:"#a89aff", marginBottom:"16px" }}>Supabase → Settings → API → <b>service_role</b> key (starts with eyJ...)</p>
              <p style={{ fontSize:"12px", color:"#ff7070", marginBottom:"16px" }}>⚠ Never share this key publicly — it's only entered here privately by you.</p>
              <input type="password" style={{ ...INP, marginBottom:"10px" }} placeholder="Paste service_role key..." value={skInput} onChange={e => setSkInput(e.target.value)} />
              <button onClick={checkServiceKey} style={{ padding:"10px 24px", borderRadius:"8px", border:"none", background:"linear-gradient(135deg,#7864ff,#b0a0ff)", color:"#fff", fontSize:"14px", fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Connect</button>
            </div>
          ) : (
            <>
              <div style={{ display:"flex", gap:"8px", marginBottom:"28px" }}>
                {[["add","Add Motion"],["manage",`Manage (${motions.length})`]].map(([t,label]) => (
                  <button key={t} onClick={() => setAdminTab(t)} style={{ padding:"8px 18px", borderRadius:"8px", border:`1px solid ${adminTab===t?"#7864ff":"#222240"}`, background:adminTab===t?"rgba(120,100,255,.15)":"transparent", color:adminTab===t?"#a89aff":"#777", fontSize:"13px", cursor:"pointer", fontWeight:500, fontFamily:"inherit" }}>{label}</button>
                ))}
              </div>

              {adminTab === "add" && (
                <div style={{ display:"flex", flexDirection:"column", gap:"18px" }}>
                  <Lbl label="Motion Text *"><input style={INP} placeholder="e.g. THW implement universal basic income" value={form.motion} onChange={e => setForm(f => ({ ...f, motion:e.target.value }))} /></Lbl>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"14px" }}>
                    <Lbl label="Theme"><select style={INP} value={form.theme} onChange={e => setForm(f => ({ ...f, theme:e.target.value }))}>{THEMES.filter(t => t!=="All Themes").map(t => <option key={t}>{t}</option>)}</select></Lbl>
                    <Lbl label="Difficulty"><select style={INP} value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty:e.target.value }))}>{["Easy","Medium","Hard"].map(d => <option key={d}>{d}</option>)}</select></Lbl>
                    <Lbl label="Tournament"><input style={INP} placeholder="e.g. WSDC 2024" value={form.tournament} onChange={e => setForm(f => ({ ...f, tournament:e.target.value }))} /></Lbl>
                  </div>
                  <Lbl label="Keywords (comma separated)"><input style={INP} placeholder="e.g. climate, taxation, carbon" value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords:e.target.value }))} /></Lbl>
                  {[["prop","Proposition","#40c090"],["opp","Opposition","#ff7070"]].map(([w,label,col]) => (
                    <div key={w}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                        <span style={{ fontSize:"11px", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:col }}>{label} Arguments</span>
                        <button onClick={() => addArg(w)} style={{ padding:"4px 12px", borderRadius:"6px", border:`1px solid ${col}44`, background:`${col}11`, color:col, fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>+ Add</button>
                      </div>
                      {form[w==="prop"?"propArgs":"oppArgs"].map((arg, i) => (
                        <div key={i} style={{ background:"#0d0d1e", border:"1px solid #1e1e3a", borderRadius:"10px", padding:"14px", marginBottom:"10px", display:"flex", flexDirection:"column", gap:"8px" }}>
                          <input style={INP} placeholder="Argument name" value={arg.name} onChange={e => setArgF(w,i,"name",e.target.value)} />
                          <textarea style={{ ...INP, minHeight:"68px", resize:"vertical" }} placeholder="2-3 sentence summary with warrant and impact" value={arg.summary} onChange={e => setArgF(w,i,"summary",e.target.value)} />
                          <select style={INP} value={arg.type} onChange={e => setArgF(w,i,"type",e.target.value)}>{["Practical","Principled","Rebuttal"].map(t => <option key={t}>{t}</option>)}</select>
                        </div>
                      ))}
                    </div>
                  ))}
                  <button onClick={submit} disabled={saving} style={{ padding:"13px 28px", borderRadius:"10px", border:"none", background:"linear-gradient(135deg,#7864ff,#b0a0ff)", color:"#fff", fontSize:"15px", fontWeight:700, cursor:"pointer", fontFamily:"inherit", marginTop:"6px", opacity:saving?0.7:1 }}>
                    {saving ? "Saving..." : "Save Motion to Database"}
                  </button>
                </div>
              )}

              {adminTab === "manage" && (
                <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", background:"#0d0d1e", border:"1px solid #2a2a4a", borderRadius:"12px", marginBottom:"6px" }}>
                    <div>
                      <p style={{ fontSize:"14px", fontWeight:600, color:"#e0e0f0", marginBottom:"3px" }}>Export all motions</p>
                      <p style={{ fontSize:"12px", color:"#555" }}>Download a backup file of everything in your database</p>
                    </div>
                    <button onClick={exportData} style={{ padding:"9px 20px", borderRadius:"8px", border:"1px solid #7864ff55", background:"rgba(120,100,255,.15)", color:"#a89aff", fontSize:"13px", fontWeight:600, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" }}>↓ Export ({motions.length})</button>
                  </div>
                  {motions.map(m => (
                    <div key={m.id} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"14px 18px", background:"#111125", border:"1px solid #1e1e3a", borderRadius:"10px" }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:"14px", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:"3px" }}>{m.motion}</p>
                        <p style={{ fontSize:"12px", color:"#555" }}>{m.theme} · {getArgs(m,"prop").length} prop · {getArgs(m,"opp").length} opp</p>
                      </div>
                      <button onClick={() => openMotion(m)} style={{ padding:"5px 12px", borderRadius:"6px", border:"1px solid #2a2a5a", background:"transparent", color:"#8888bb", fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>View</button>
                      <button onClick={() => deleteMotion(m.id)} style={{ padding:"5px 12px", borderRadius:"6px", border:"1px solid #4a2222", background:"transparent", color:"#ff7070", fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>Delete</button>
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

function Lbl({ label, children }) {
  return (
    <div>
      <label style={{ display:"block", fontSize:"11px", color:"#666", fontWeight:600, textTransform:"uppercase", letterSpacing:".06em", marginBottom:"6px" }}>{label}</label>
      {children}
    </div>
  );
}
