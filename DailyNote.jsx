import { useState, useEffect } from "react";

const GF = `@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Inter:wght@400;500;600;700&display=swap');`;

/* ── TOKENS ──────────────────────────────────────────────────────────────────── */
const T = {
  bg:       "#F8F8F6",
  surface:  "#FFFFFF",
  surface2: "#F2F2F0",
  line:     "#E8E8E5",
  line2:    "#D4D4D0",
  muted:    "#989894",      // icon default
  sub:      "#5A5A55",      // secondary text
  body:     "#1E1E1C",      // primary text (near black)
  title:    "#0D0D0B",      // headings
  blue:     "#2B5CE6",      // selected / accent
  blueL:    "#5580F0",
  blueSoft: "#EBF0FF",
  blueMid:  "#B8C8F8",
  warn:     "#D4621A",
  warnSoft: "#FDF1EA",
  seal:     "#1A8A5C",
  sealSoft: "#E8F7F0",
  shadow:   "rgba(13,13,11,0.06)",
  shadowMd: "rgba(13,13,11,0.11)",
};

/* ── UTILS ───────────────────────────────────────────────────────────────────── */
const todayStr = () => new Date().toISOString().split("T")[0];
const isPast   = (d) => d < todayStr();
const calcPen  = (n) => Math.pow(2, n) - 1;

const isJan1   = (d) => d && d.slice(5) === "01-01";
const isDec31  = (d) => d && d.slice(5) === "12-31";
const getYear  = (d) => d ? d.slice(0, 4) : null;

const fmtLong  = (d) => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
const fmtShort = (d) => new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day:"numeric", month:"short" });
const fmtDay   = (d) => {
  const dt = new Date(d + "T12:00:00");
  const today = new Date(todayStr() + "T12:00:00");
  const diff  = (today - dt) / 86400000;
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Hier";
  return dt.toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" });
};

/* ── ANNUAL PHOTO LOGIC ──────────────────────────────────────────────────────── */
// Jan 1 photo → becomes profile photo for entire year
// Dec 31 photo → seals / "closes" that year
const ANNUAL_PHOTOS = [
  { year:"2025", jan1:"taken",  dec31:null,    emoji:"🧔🏿", note:"Photo du 1er janvier — débuts de l'année en force." },
  { year:"2024", jan1:"taken",  dec31:"taken", emoji:"👨🏿‍💼", note:"Année close le 31 décembre. Chapitre terminé." },
  { year:"2023", jan1:"taken",  dec31:"taken", emoji:"👨🏿",  note:"Année close le 31 décembre. Chapitre terminé." },
];

/* ── SAMPLE DATA ─────────────────────────────────────────────────────────────── */
const INIT_ENTRIES = [
  { id:1, date:"2025-03-19", time:"08:14", type:"text",  cat:"Réflexions", content:"Ce matin j'ai réalisé que mes meilleures idées viennent toujours lors de ma première tasse de café. La vie s'écrit dans les marges des matins calmes.", sealed:false, hash:null,         image:null },
  { id:2, date:"2025-03-18", time:"21:00", type:"text",  cat:"Conseils",   content:"Ne jamais prendre de décisions importantes après 21h. Le cerveau fatigué confond urgence et importance. Dormir est une stratégie.", sealed:true, hash:"a3f8…c291", image:null },
  { id:3, date:"2025-03-18", time:"17:45", type:"photo", cat:"Mémoires",   content:"Vue depuis le bureau au coucher du soleil. Ces moments de beauté ordinaire méritent d'être capturés.", sealed:true, hash:"b7d2…e104", image:"warm" },
  { id:4, date:"2025-03-15", time:"09:30", type:"text",  cat:"Mémos",      content:"Appeler Mama ce weekend. Les connexions humaines sont la vraie richesse — tout le reste n'est que bruit.", sealed:true, hash:"c9a1…f823", image:null },
  { id:5, date:"2025-01-01", time:"09:00", type:"photo", cat:"Mémoires",   content:"Ma photo du 1er janvier 2025. Une nouvelle page blanche. Cette année, j'écris quelque chose qui comptera.", sealed:true, hash:"d4e6…a517", image:"cool", isAnnualOpen:true },
];

const INIT_CATS = [
  { id:1, name:"Réflexions", emoji:"💭" },
  { id:2, name:"Stratégies", emoji:"🎯" },
  { id:3, name:"Conseils",   emoji:"💡" },
  { id:4, name:"Mémos",      emoji:"📌" },
  { id:5, name:"Mémoires",   emoji:"🌿" },
];

const DNA_SECTIONS = [
  { id:"identity", label:"Identité", emoji:"🧬", fields:[
    { id:"blood",  label:"Groupe sanguin",   type:"select", opts:["—","A+","A-","B+","B-","AB+","AB-","O+","O-"] },
    { id:"height", label:"Taille (cm)",       type:"number", ph:"ex: 182" },
    { id:"weight", label:"Poids (kg)",         type:"number", ph:"ex: 78"  },
    { id:"eyes",   label:"Couleur des yeux",  type:"select", opts:["—","Noirs","Marrons","Noisette","Verts","Bleus","Gris"] },
    { id:"mbti",   label:"Profil MBTI",        type:"text",   ph:"ex: ENFJ" },
  ]},
  { id:"food", label:"Gastronomie", emoji:"🍽️", fields:[
    { id:"cuisine",  label:"Cuisine favorite",      type:"text", ph:"ex: Japonaise, Africaine" },
    { id:"dish",     label:"Plat favori",            type:"text", ph:"ex: Poulet yassa" },
    { id:"drink",    label:"Boisson favorite",       type:"text", ph:"ex: Café noir, thé vert" },
    { id:"nodish",   label:"Ce que tu n'aimes pas", type:"text", ph:"ex: Fruits de mer" },
  ]},
  { id:"tech", label:"Technologie", emoji:"⌚", fields:[
    { id:"phone",  label:"Téléphone préféré",  type:"text", ph:"ex: iPhone 16 Pro" },
    { id:"watch",  label:"Montre rêvée",        type:"text", ph:"ex: Rolex Daytona" },
    { id:"car",    label:"Voiture rêvée",       type:"text", ph:"ex: Ferrari 812" },
    { id:"laptop", label:"Ordinateur préféré",  type:"text", ph:"ex: MacBook Pro M4" },
  ]},
  { id:"style", label:"Style", emoji:"👔", fields:[
    { id:"brand1",    label:"Marque #1",           type:"text", ph:"ex: Loro Piana" },
    { id:"brand2",    label:"Marque #2",            type:"text", ph:"ex: Stone Island" },
    { id:"fragrance", label:"Parfum signature",     type:"text", ph:"ex: Tom Ford Oud Wood" },
    { id:"sneakers",  label:"Chaussures favorites", type:"text", ph:"ex: New Balance 992" },
  ]},
  { id:"culture", label:"Culture", emoji:"🎭", fields:[
    { id:"music",  label:"Genre musical",   type:"text", ph:"ex: Jazz, Afrobeats" },
    { id:"artist", label:"Artiste favori",  type:"text", ph:"ex: Fela Kuti" },
    { id:"book",   label:"Livre culte",     type:"text", ph:"ex: L'Alchimiste" },
    { id:"sport",  label:"Sport pratiqué",  type:"text", ph:"ex: Football" },
  ]},
  { id:"values", label:"Valeurs", emoji:"⚖️", fields:[
    { id:"value1", label:"Valeur fondamentale",     type:"text",     ph:"ex: Intégrité" },
    { id:"value2", label:"Valeur secondaire",        type:"text",     ph:"ex: Famille" },
    { id:"motto",  label:"Ta devise personnelle",   type:"textarea", ph:"La phrase qui te définit…" },
    { id:"legacy", label:"Ce que tu veux laisser",  type:"textarea", ph:"Ton héritage…" },
  ]},
];

/* ── ICONS ───────────────────────────────────────────────────────────────────── */
// c = color  sw = strokeWidth  (default gray, black in context, blue when active)
const Ic = ({ n, s=22, c=T.muted, sw=1.8 }) => {
  const p = { fill:"none", stroke:c, strokeWidth:sw, strokeLinecap:"round", strokeLinejoin:"round" };
  const icons = {
    home:    <svg width={s} height={s} viewBox="0 0 24 24" {...p}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
    pen:     <svg width={s} height={s} viewBox="0 0 24 24" {...p}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>,
    book:    <svg width={s} height={s} viewBox="0 0 24 24" {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
    dna:     <svg width={s} height={s} viewBox="0 0 24 24" {...p}><path d="M2 15c6.667-6 13.333 0 20-6"/><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/><path d="m17 6-2.5-2.5"/><path d="m14 8.5-1-1"/><path d="m7 18 2.5 2.5"/><path d="m10 15.5 1 1"/><path d="M2 9c6.667 6 13.333 0 20 6"/></svg>,
    tomb:    <svg width={s} height={s} viewBox="0 0 24 24" {...p}><path d="M5 21V9a7 7 0 0 1 14 0v12"/><line x1="3" y1="21" x2="21" y2="21"/><path d="M12 9v4M10 11h4"/></svg>,
    plus:    <svg width={s} height={s} viewBox="0 0 24 24" {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    x:       <svg width={s} height={s} viewBox="0 0 24 24" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    lock:    <svg width={s} height={s} viewBox="0 0 24 24" {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    shield:  <svg width={s} height={s} viewBox="0 0 24 24" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    warn:    <svg width={s} height={s} viewBox="0 0 24 24" {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    check:   <svg width={s} height={s} viewBox="0 0 24 24" {...p}><polyline points="20 6 9 17 4 12"/></svg>,
    sparkle: <svg width={s} height={s} viewBox="0 0 24 24" {...p}><path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/><path d="M17 4a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2"/></svg>,
    send:    <svg width={s} height={s} viewBox="0 0 24 24" {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    camera:  <svg width={s} height={s} viewBox="0 0 24 24" {...p}><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>,
    mic:     <svg width={s} height={s} viewBox="0 0 24 24" {...p}><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v3M8 22h8"/></svg>,
    robot:   <svg width={s} height={s} viewBox="0 0 24 24" {...p}><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 16h.01M16 16h.01M9 20h6"/></svg>,
    chevron: <svg width={s} height={s} viewBox="0 0 24 24" {...p}><polyline points="9,18 15,12 9,6"/></svg>,
    image:   <svg width={s} height={s} viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>,
    card:    <svg width={s} height={s} viewBox="0 0 24 24" {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
    save:    <svg width={s} height={s} viewBox="0 0 24 24" {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
    tag:     <svg width={s} height={s} viewBox="0 0 24 24" {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    loader:  <svg width={s} height={s} viewBox="0 0 24 24" {...p}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>,
    calendar:<svg width={s} height={s} viewBox="0 0 24 24" {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    star:    <svg width={s} height={s} viewBox="0 0 24 24" {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    globe:   <svg width={s} height={s} viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    vote:    <svg width={s} height={s} viewBox="0 0 24 24" {...p}><path d="m9 12 2 2 4-4"/><path d="M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7z"/><path d="M22 19H2"/></svg>,
    portrait:<svg width={s} height={s} viewBox="0 0 24 24" {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M7 21v-1a5 5 0 0 1 10 0v1"/></svg>,
  };
  return icons[n] || null;
};

/* ── SMALL REUSABLE ──────────────────────────────────────────────────────────── */
const Chip = ({ children, active, color=T.blue, onClick }) => (
  <button onClick={onClick} style={{ padding:"6px 14px", borderRadius:100, border:`1.5px solid ${active?color:T.line2}`, background:active?color+"10":T.surface, color:active?color:T.sub, fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:active?600:500, cursor:"pointer", transition:"all 0.15s", whiteSpace:"nowrap" }}>
    {children}
  </button>
);

const Lbl = ({ children, right }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
    <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:700, color:T.muted, letterSpacing:"0.09em", textTransform:"uppercase" }}>{children}</span>
    {right}
  </div>
);

const Hr = ({ my=20 }) => <div style={{ height:1, background:T.line, margin:`${my}px 0` }}/>;

const Card = ({ children, style={} }) => (
  <div style={{ background:T.surface, borderRadius:18, border:`1px solid ${T.line}`, padding:"20px 18px", boxShadow:`0 2px 8px ${T.shadow}`, ...style }}>
    {children}
  </div>
);

/* ── BUTTONS ─────────────────────────────────────────────────────────────────── */
const Btn = ({ children, onClick, disabled, variant="primary", icon, full, small }) => {
  const v = {
    primary: { bg:T.blue,     fg:"#fff",    bd:"none" },
    outline: { bg:"transparent", fg:T.blue,  bd:`1.5px solid ${T.blueMid}` },
    ghost:   { bg:T.surface2, fg:T.sub,    bd:"none" },
    danger:  { bg:T.warn,     fg:"#fff",    bd:"none" },
    seal:    { bg:T.sealSoft, fg:T.seal,   bd:`1px solid ${T.seal}30` },
  };
  const s = v[variant];
  return (
    <button onClick={onClick} disabled={disabled} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, width:full?"100%":"auto", padding:small?"9px 16px":"13px 22px", borderRadius:13, background:disabled?T.line:s.bg, color:disabled?T.muted:s.fg, border:s.bd||"none", fontFamily:"'Inter',sans-serif", fontSize:small?13:14, fontWeight:600, cursor:disabled?"default":"pointer", transition:"all 0.15s", letterSpacing:"0.01em" }}>
      {icon && <Ic n={icon} s={15} c={disabled?T.muted:s.fg} sw={2}/>}
      {children}
    </button>
  );
};

/* ── FIELD ───────────────────────────────────────────────────────────────────── */
const Field = ({ label, value, onChange, type="text", ph, multi, opts }) => (
  <div style={{ marginBottom:16 }}>
    {label && <label style={{ display:"block", fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:600, color:T.sub, marginBottom:7 }}>{label}</label>}
    {opts ? (
      <select value={value||"—"} onChange={e=>onChange(e.target.value)} style={{ width:"100%", padding:"12px 14px", borderRadius:11, border:`1.5px solid ${T.line2}`, background:T.surface, color:value&&value!=="—"?T.body:T.muted, fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:500, outline:"none", appearance:"none", cursor:"pointer" }}>
        {opts.map(o=><option key={o} value={o}>{o}</option>)}
      </select>
    ) : multi ? (
      <textarea value={value||""} onChange={e=>onChange(e.target.value)} placeholder={ph} rows={3}
        style={{ width:"100%", padding:"13px 14px", borderRadius:11, border:`1.5px solid ${T.line2}`, background:T.surface, color:T.body, fontFamily:"'Lora',serif", fontSize:16, fontWeight:500, lineHeight:1.7, resize:"none", outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" }}
        onFocus={e=>e.target.style.borderColor=T.blue} onBlur={e=>e.target.style.borderColor=T.line2}/>
    ) : (
      <input type={type} value={value||""} onChange={e=>onChange(e.target.value)} placeholder={ph}
        style={{ width:"100%", padding:"12px 14px", borderRadius:11, border:`1.5px solid ${T.line2}`, background:T.surface, color:T.body, fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:500, outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" }}
        onFocus={e=>e.target.style.borderColor=T.blue} onBlur={e=>e.target.style.borderColor=T.line2}/>
    )}
  </div>
);

/* ── PENALTY MODAL ───────────────────────────────────────────────────────────── */
const PenaltySheet = ({ days, onPay, onClose }) => {
  const [paying, setPaying] = useState(false);
  const [done, setDone]     = useState(false);
  const amt = calcPen(days);

  const pay = async () => {
    setPaying(true);
    await new Promise(r=>setTimeout(r,1500));
    setDone(true); setPaying(false);
    setTimeout(onPay, 700);
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:900, background:"rgba(13,13,11,0.55)", display:"flex", alignItems:"flex-end", backdropFilter:"blur(3px)" }}>
      <div style={{ width:"100%", background:T.surface, borderRadius:"22px 22px 0 0", padding:"0 22px 44px", maxHeight:"88vh", overflowY:"auto" }}>
        <div style={{ width:40, height:4, borderRadius:2, background:T.line2, margin:"14px auto 28px" }}/>

        <div style={{ width:52, height:52, borderRadius:16, background:T.warnSoft, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:18 }}>
          <Ic n="warn" s={26} c={T.warn} sw={2}/>
        </div>

        <h2 style={{ fontFamily:"'Lora',serif", fontSize:24, fontWeight:700, color:T.title, margin:"0 0 12px" }}>
          {days === 1 ? "Un jour manqué" : `${days} jours manqués`}
        </h2>
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:500, color:T.sub, lineHeight:1.65, margin:"0 0 26px" }}>
          La meilleure décision est toujours d'avancer. Si tu choisis de revenir en arrière pour combler cette lacune, c'est ton droit — mais le passé a un prix croissant.
        </p>

        {/* Schedule */}
        <div style={{ background:T.surface2, borderRadius:14, padding:"16px 18px", marginBottom:20 }}>
          <Lbl>Barème exponentiel</Lbl>
          {[1,2,3,4,5].map(n=>(
            <div key={n} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:n<5?`1px solid ${T.line}`:"none" }}>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight: n===days?600:500, color: n===days?T.body:T.muted }}>
                {n} jour{n>1?"s":""} manqué{n>1?"s":""}
              </span>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:700, color: n===days?T.warn:T.line2 }}>
                {calcPen(n)} $
              </span>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 20px", background:T.warnSoft, borderRadius:14, marginBottom:26 }}>
          <div>
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:600, color:T.warn, margin:"0 0 4px", letterSpacing:"0.04em" }}>MONTANT DÛ</p>
            <p style={{ fontFamily:"'Lora',serif", fontSize:32, fontWeight:700, color:T.warn, margin:0 }}>{amt} $</p>
          </div>
          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:500, color:T.warn+"99", textAlign:"right", maxWidth:110, lineHeight:1.5 }}>pour {days} jour{days>1?"s":""} de rattrapage</p>
        </div>

        {done ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"15px", borderRadius:13, background:T.sealSoft, color:T.seal, fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:600 }}>
            <Ic n="check" s={18} c={T.seal} sw={2}/> Accès déverrouillé
          </div>
        ) : (
          <div style={{ display:"flex", gap:10 }}>
            <Btn variant="ghost" onClick={onClose}>Ignorer</Btn>
            <Btn variant="danger" onClick={pay} disabled={paying} icon={paying?"loader":"card"} full>
              {paying?"Traitement…":`Payer ${amt} $`}
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── AI PANEL ────────────────────────────────────────────────────────────────── */
const AIPanel = ({ text, onInsert, onClose }) => {
  const [mode, setMode]   = useState("suggest");
  const [res, setRes]     = useState("");
  const [loading, setL]   = useState(false);

  const modes = [{id:"suggest",label:"Continuer"},{id:"rephrase",label:"Reformuler"},{id:"expand",label:"Développer"},{id:"summary",label:"Résumé"}];

  const prompts = {
    suggest: `Continue cette note de journal en 1-2 phrases, même voix, même personne. Réponds directement.\n\n"${text}"`,
    rephrase:`Reformule avec élégance, même sens. Directement.\n\n"${text}"`,
    expand:  `Développe en 2-3 phrases, 1ère personne. Directement.\n\n"${text}"`,
    summary: `Résume en une phrase courte et percutante. Directement.\n\n"${text}"`,
  };

  const run = async (m) => {
    if (!text.trim()) return;
    setL(true); setRes("");
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:250, messages:[{role:"user",content:prompts[m]}] })
      });
      const d = await r.json();
      setRes(d.content?.map(c=>c.text||"").join("")||"");
    } catch { setRes("Connexion indisponible."); }
    setL(false);
  };

  useEffect(()=>{ if(text.trim()) run(mode); },[mode]);

  return (
    <div style={{ background:T.blueSoft, borderRadius:14, padding:16, marginBottom:18 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <Ic n="sparkle" s={15} c={T.blue} sw={2}/>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:700, color:T.blue }}>Assistant IA</span>
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", padding:4 }}><Ic n="x" s={16} c={T.sub} sw={2}/></button>
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:12, overflowX:"auto", paddingBottom:2 }}>
        {modes.map(m=><Chip key={m.id} active={mode===m.id} small onClick={()=>setMode(m.id)}>{m.label}</Chip>)}
      </div>
      <div style={{ background:T.surface, borderRadius:10, padding:"13px 14px", minHeight:64, marginBottom:10 }}>
        {loading
          ? <div style={{ display:"flex", alignItems:"center", gap:8, color:T.muted }}><div style={{ animation:"spin 1s linear infinite" }}><Ic n="loader" s={15} c={T.blue} sw={2}/></div><span style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:500 }}>Génération…</span></div>
          : res
            ? <p style={{ fontFamily:"'Lora',serif", fontSize:15, fontWeight:500, color:T.body, lineHeight:1.7, margin:0, fontStyle:"italic" }}>{res}</p>
            : <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:500, color:T.muted, margin:0 }}>Commence à écrire pour activer l'assistant…</p>
        }
      </div>
      {res && !loading && <Btn variant="outline" onClick={()=>onInsert(res)} icon="send" small full>Insérer dans ma note</Btn>}
    </div>
  );
};

/* ── NEW ENTRY SHEET ─────────────────────────────────────────────────────────── */
const NewEntrySheet = ({ cats, onClose, onSave, missedDays }) => {
  const [txt, setTxt]     = useState("");
  const [cat, setCat]     = useState(cats[0]?.name||"");
  const [type, setType]   = useState("text");
  const [img, setImg]     = useState(null);
  const [showAI, setAI]   = useState(false);
  const [target, setTgt]  = useState(todayStr());

  const today = todayStr();
  const isJan  = target.slice(5) === "01-01";
  const isDec  = target.slice(5) === "12-31";

  const imgOpts = [
    { k:"warm",   bg:"linear-gradient(135deg,#FF9A6C,#FFD4B8)" },
    { k:"cool",   bg:"linear-gradient(135deg,#7EB8F7,#C4DCFC)" },
    { k:"forest", bg:"linear-gradient(135deg,#78BF98,#C2E8D0)" },
    { k:"night",  bg:"linear-gradient(135deg,#525C6E,#2C3344)" },
  ];

  const save = () => {
    if (!txt.trim()) return;
    const hash = Math.random().toString(36).slice(2,6)+"…"+Math.random().toString(36).slice(2,6);
    onSave({ id:Date.now(), date:target, time:new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}), type, cat, content:txt, sealed:false, hash, image:img, isAnnualOpen: isJan, isAnnualClose: isDec });
    onClose();
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:800, background:"rgba(13,13,11,0.45)", display:"flex", alignItems:"flex-end", backdropFilter:"blur(3px)" }}>
      <div style={{ width:"100%", background:T.surface, borderRadius:"22px 22px 0 0", maxHeight:"94vh", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"14px 22px 0", flexShrink:0 }}>
          <div style={{ width:40, height:4, borderRadius:2, background:T.line2, margin:"0 auto 22px" }}/>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
            <h2 style={{ fontFamily:"'Lora',serif", fontSize:22, fontWeight:700, color:T.title, margin:0 }}>Nouvelle entrée</h2>
            <button onClick={onClose} style={{ width:34, height:34, borderRadius:9, background:T.surface2, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Ic n="x" s={17} c={T.body} sw={2}/>
            </button>
          </div>
          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:500, color:T.muted, margin:"0 0 20px" }}>{fmtLong(target)}</p>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"0 22px 28px" }}>
          {/* Annual photo banners */}
          {isJan && (
            <div style={{ background:T.blueSoft, border:`1.5px solid ${T.blue}30`, borderRadius:13, padding:"12px 16px", marginBottom:16, display:"flex", gap:10, alignItems:"flex-start" }}>
              <Ic n="star" s={16} c={T.blue} sw={2}/>
              <div>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:700, color:T.blue, margin:"0 0 3px" }}>Photo de profil annuelle</p>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:500, color:T.blue+"99", margin:0, lineHeight:1.5 }}>
                  La photo d'aujourd'hui (1er janvier) deviendra ta photo de profil pour toute l'année 2025. Choisis-la bien.
                </p>
              </div>
            </div>
          )}
          {isDec && (
            <div style={{ background:"#FBF5EC", border:`1.5px solid #D4A017`, borderRadius:13, padding:"12px 16px", marginBottom:16, display:"flex", gap:10, alignItems:"flex-start" }}>
              <Ic n="calendar" s={16} c="#D4A017" sw={2}/>
              <div>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:700, color:"#A07C10", margin:"0 0 3px" }}>Clôture de l'année</p>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:500, color:"#A07C1099", margin:0, lineHeight:1.5 }}>
                  C'est le dernier jour de l'année. Cette entrée marquera la fin de ce chapitre — une page tournée pour toujours.
                </p>
              </div>
            </div>
          )}

          {/* Missed day picker */}
          {missedDays.length > 0 && (
            <div style={{ background:T.warnSoft, borderRadius:12, padding:"12px 16px", marginBottom:18 }}>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:700, color:T.warn, margin:"0 0 10px" }}>Rattraper un jour manqué</p>
              <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                <Chip active={target===today} onClick={()=>setTgt(today)}>Aujourd'hui</Chip>
                {missedDays.map(d=><Chip key={d} active={target===d} color={T.warn} onClick={()=>setTgt(d)}>{fmtShort(d)}</Chip>)}
              </div>
            </div>
          )}

          {/* Type */}
          <div style={{ display:"flex", gap:8, marginBottom:18 }}>
            {[{id:"text",icon:"pen",label:"Texte"},{id:"voice",icon:"mic",label:"Vocal"},{id:"photo",icon:"camera",label:"Photo"}].map(t=>(
              <button key={t.id} onClick={()=>setType(t.id)} style={{ flex:1, padding:"11px 6px", borderRadius:13, border:`1.5px solid ${type===t.id?T.blue:T.line2}`, background:type===t.id?T.blueSoft:T.surface, color:type===t.id?T.blue:T.sub, fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:type===t.id?700:500, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:7, transition:"all 0.15s" }}>
                <Ic n={t.icon} s={20} c={type===t.id?T.blue:T.muted} sw={type===t.id?2:1.8}/>
                {t.label}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <textarea value={txt} onChange={e=>setTxt(e.target.value)}
            placeholder={type==="text"?"Raconte ta journée…":type==="voice"?"Transcription vocale…":"Décris ce moment…"}
            style={{ width:"100%", minHeight:150, padding:"16px", borderRadius:14, border:`1.5px solid ${T.line}`, background:T.bg, color:T.body, fontFamily:"'Lora',serif", fontSize:17, fontWeight:500, lineHeight:1.8, resize:"none", outline:"none", boxSizing:"border-box", transition:"border-color 0.2s" }}
            onFocus={e=>e.target.style.borderColor=T.blue} onBlur={e=>e.target.style.borderColor=T.line}
          />

          {/* AI */}
          <div style={{ display:"flex", justifyContent:"flex-end", margin:"10px 0 showAI?14:18" }}>
            <button onClick={()=>setAI(!showAI)} style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 14px", borderRadius:100, border:`1.5px solid ${showAI?T.blue:T.line2}`, background:showAI?T.blueSoft:T.surface, color:showAI?T.blue:T.muted, fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:600, cursor:"pointer", transition:"all 0.15s" }}>
              <Ic n="sparkle" s={13} c={showAI?T.blue:T.muted} sw={2}/>{showAI?"IA active":"Aide IA"}
            </button>
          </div>
          {showAI && <AIPanel text={txt} onInsert={s=>setTxt(p=>p+(p?" ":"")+s)} onClose={()=>setAI(false)}/>}

          {/* Image */}
          <div style={{ marginBottom:18 }}>
            <Lbl>Image du jour</Lbl>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <button onClick={()=>setImg(null)} style={{ height:44, padding:"0 14px", borderRadius:10, border:`1.5px solid ${!img?T.blue:T.line2}`, background:!img?T.blueSoft:T.surface, color:!img?T.blue:T.sub, fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                Aucune
              </button>
              {imgOpts.map(o=>(
                <div key={o.k} onClick={()=>setImg(img===o.k?null:o.k)} style={{ flex:1, height:44, borderRadius:10, background:o.bg, border:`2.5px solid ${img===o.k?T.blue:"transparent"}`, cursor:"pointer", transition:"all 0.15s" }}/>
              ))}
            </div>
          </div>

          {/* Category */}
          <div style={{ marginBottom:20 }}>
            <Lbl>Catégorie</Lbl>
            <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
              {cats.map(c=><Chip key={c.id} active={cat===c.name} onClick={()=>setCat(c.name)}>{c.emoji} {c.name}</Chip>)}
            </div>
          </div>

          {/* Seal notice */}
          <div style={{ display:"flex", gap:10, padding:"13px 14px", background:T.sealSoft, borderRadius:12, marginBottom:20 }}>
            <Ic n="shield" s={16} c={T.seal} sw={2}/>
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:500, color:T.seal, margin:0, lineHeight:1.55 }}>
              Scellée <strong>demain à minuit</strong> — plus aucune modification ne sera possible. Un hash certifiera l'authenticité de cette entrée pour toujours.
            </p>
          </div>

          <Btn onClick={save} icon="send" full>Sauvegarder</Btn>
        </div>
      </div>
    </div>
  );
};

/* ── ENTRY CARD ──────────────────────────────────────────────────────────────── */
const EntryCard = ({ e, cats }) => {
  const locked  = isPast(e.date) || e.sealed;
  const imgBg   = { warm:"linear-gradient(135deg,#FF9A6C,#FFD4B8)", cool:"linear-gradient(135deg,#7EB8F7,#C4DCFC)", forest:"linear-gradient(135deg,#78BF98,#C2E8D0)", night:"linear-gradient(135deg,#525C6E,#2C3344)" };
  const catEmoji = cats.find(c=>c.name===e.cat)?.emoji||"";

  const isAnnualOpen  = e.isAnnualOpen;
  const isAnnualClose = e.isAnnualClose;

  return (
    <div style={{ background:T.surface, borderRadius:16, border:`1px solid ${T.line}`, padding:"17px 18px", marginBottom:10, boxShadow:`0 1px 4px ${T.shadow}` }}>
      {/* Annual badge */}
      {isAnnualOpen && (
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10, padding:"6px 10px", background:T.blueSoft, borderRadius:8 }}>
          <Ic n="portrait" s={13} c={T.blue} sw={2}/>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:700, color:T.blue, letterSpacing:"0.04em" }}>PHOTO DE PROFIL · 2025</span>
        </div>
      )}
      {isAnnualClose && (
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10, padding:"6px 10px", background:"#FBF5EC", borderRadius:8 }}>
          <Ic n="calendar" s={13} c="#D4A017" sw={2}/>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:700, color:"#A07C10", letterSpacing:"0.04em" }}>CLÔTURE D'ANNÉE</span>
        </div>
      )}

      {e.image && <div style={{ height:76, borderRadius:10, background:imgBg[e.image]||T.line, marginBottom:12 }}/>}

      <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:10, flexWrap:"wrap" }}>
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:600, color:T.muted }}>{e.time}</span>
        <span style={{ width:3, height:3, borderRadius:"50%", background:T.line2 }}/>
        <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:600, color:T.sub, background:T.surface2, padding:"3px 9px", borderRadius:100 }}>
          {catEmoji} {e.cat}
        </span>
        {locked && e.hash && (
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:600, color:T.seal, background:T.sealSoft, padding:"3px 9px", borderRadius:100, display:"flex", alignItems:"center", gap:4 }}>
            <Ic n="shield" s={9} c={T.seal} sw={2.5}/> {e.hash}
          </span>
        )}
        {!locked && (
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:600, color:T.blue, background:T.blueSoft, padding:"3px 9px", borderRadius:100 }}>Modifiable</span>
        )}
      </div>

      <p style={{ fontFamily:"'Lora',serif", fontSize:16, fontWeight:locked?500:600, color:locked?T.sub:T.body, lineHeight:1.75, margin:0, fontStyle:locked?"italic":"normal" }}>
        {e.content}
      </p>
    </div>
  );
};

/* ── JOURNAL ─────────────────────────────────────────────────────────────────── */
const Journal = ({ entries, cats, onNew, missedDays, onPenalty }) => {
  const [filter, setFilter] = useState(null);
  const filtered = filter ? entries.filter(e=>e.cat===filter) : entries;
  const groups   = filtered.reduce((acc,e)=>{
    const k = fmtDay(e.date);
    if(!acc[k]) acc[k]=[];
    acc[k].push(e);
    return acc;
  },{});

  return (
    <div>
      {/* Missed days */}
      {missedDays.length > 0 && (
        <div onClick={onPenalty} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", background:T.warnSoft, borderRadius:14, marginBottom:20, cursor:"pointer", border:`1px solid ${T.warn}25` }}>
          <div style={{ width:38, height:38, borderRadius:11, background:T.warn+"18", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <Ic n="warn" s={20} c={T.warn} sw={2}/>
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:700, color:T.warn, margin:"0 0 2px" }}>
              {missedDays.length} jour{missedDays.length>1?"s":""} non écrit{missedDays.length>1?"s":""}
            </p>
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:500, color:T.warn+"AA", margin:0 }}>
              Avancer ne coûte rien · Revenir coûte {calcPen(missedDays.length)} $
            </p>
          </div>
          <Ic n="chevron" s={18} c={T.warn} sw={2}/>
        </div>
      )}

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:24 }}>
        {[
          { n:entries.filter(e=>e.date===todayStr()).length, l:"Aujourd'hui", c:T.blue },
          { n:entries.length,                                l:"Total",       c:T.body },
          { n:entries.filter(e=>e.sealed).length,           l:"Scellées",    c:T.seal },
        ].map(s=>(
          <div key={s.l} style={{ background:T.surface, borderRadius:14, padding:"14px 10px", border:`1px solid ${T.line}`, textAlign:"center", boxShadow:`0 1px 3px ${T.shadow}` }}>
            <p style={{ fontFamily:"'Lora',serif", fontSize:26, fontWeight:700, color:s.c, margin:"0 0 2px" }}>{s.n}</p>
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:600, color:T.muted, margin:0 }}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display:"flex", gap:7, marginBottom:24, overflowX:"auto", paddingBottom:4 }}>
        <Chip active={!filter} onClick={()=>setFilter(null)}>Tout</Chip>
        {cats.map(c=>(
          <Chip key={c.id} active={filter===c.name} onClick={()=>setFilter(filter===c.name?null:c.name)}>
            {c.emoji} {c.name}
          </Chip>
        ))}
      </div>

      {/* Entries */}
      {Object.entries(groups).map(([date,day])=>(
        <div key={date} style={{ marginBottom:28 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:700, color:T.muted, textTransform:"uppercase", letterSpacing:"0.07em", whiteSpace:"nowrap" }}>{date}</span>
            <div style={{ flex:1, height:1, background:T.line }}/>
            {date!=="Aujourd'hui" && date!=="Hier" && (
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <Ic n="lock" s={12} c={T.seal} sw={2}/>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:600, color:T.seal }}>Scellé</span>
              </div>
            )}
          </div>
          {day.map(e=><EntryCard key={e.id} e={e} cats={cats}/>)}
        </div>
      ))}
    </div>
  );
};

/* ── PORTRAIT ANNUEL ─────────────────────────────────────────────────────────── */
const PortraitScreen = ({ entries }) => {
  const thisYear = new Date().getFullYear().toString();
  const jan1Entry = entries.find(e => e.date === `${thisYear}-01-01`);
  const dec31Entry = entries.find(e => e.date === `${thisYear}-12-31`);
  const today = todayStr();
  const isJan1Today = today.slice(5) === "01-01";
  const isDec31Today = today.slice(5) === "12-31";

  const imgBg = { warm:"linear-gradient(135deg,#FF9A6C,#FFD4B8)", cool:"linear-gradient(135deg,#7EB8F7,#C4DCFC)", forest:"linear-gradient(135deg,#78BF98,#C2E8D0)", night:"linear-gradient(135deg,#525C6E,#2C3344)" };

  return (
    <div>
      <h2 style={{ fontFamily:"'Lora',serif", fontSize:26, fontWeight:700, color:T.title, margin:"0 0 6px" }}>Portrait annuel</h2>
      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:500, color:T.muted, margin:"0 0 26px" }}>Une photo t'ouvre l'année · Une photo la ferme</p>

      {/* Current year section */}
      <Card style={{ marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
          <span style={{ fontFamily:"'Lora',serif", fontSize:20, fontWeight:700, color:T.title }}>{thisYear}</span>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:600, color:T.blue, background:T.blueSoft, padding:"3px 10px", borderRadius:100 }}>En cours</span>
        </div>

        {/* Jan 1 — profile photo */}
        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <Ic n="portrait" s={16} c={jan1Entry?T.seal:T.warn} sw={2}/>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:700, color:jan1Entry?T.seal:T.warn }}>
                Photo de profil · 1er janvier
              </span>
            </div>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:600, color:jan1Entry?T.seal:T.warn, background:jan1Entry?T.sealSoft:T.warnSoft, padding:"3px 9px", borderRadius:100 }}>
              {jan1Entry ? "✓ Prise" : isJan1Today ? "À prendre" : "Manquée"}
            </span>
          </div>

          {jan1Entry ? (
            <div style={{ borderRadius:12, overflow:"hidden", position:"relative" }}>
              <div style={{ height:120, background: jan1Entry.image ? imgBg[jan1Entry.image] : `linear-gradient(135deg, ${T.blue}, ${T.blueL})`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:52 }}>🧔🏿</span>
              </div>
              <div style={{ position:"absolute", bottom:8, left:10, background:"rgba(0,0,0,0.6)", borderRadius:8, padding:"4px 10px" }}>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:700, color:"white" }}>Photo de profil active</span>
              </div>
            </div>
          ) : (
            <div style={{ height:100, background:T.surface2, borderRadius:12, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:`1.5px dashed ${T.line2}`, gap:8 }}>
              <Ic n="camera" s={24} c={T.muted} sw={1.8}/>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:600, color:T.muted, margin:0 }}>
                {isJan1Today ? "C'est aujourd'hui — prends ta photo !" : `Disponible le 1er janvier ${thisYear}`}
              </p>
            </div>
          )}
        </div>

        <Hr my={14}/>

        {/* Dec 31 — closing */}
        <div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <Ic n="calendar" s={16} c={dec31Entry?T.seal:T.muted} sw={2}/>
              <span style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:700, color:dec31Entry?T.seal:T.sub }}>
                Clôture · 31 décembre
              </span>
            </div>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:600, color:dec31Entry?T.seal:T.muted, background:dec31Entry?T.sealSoft:T.surface2, padding:"3px 9px", borderRadius:100 }}>
              {dec31Entry ? "✓ Close" : isDec31Today ? "Aujourd'hui !" : "En attente"}
            </span>
          </div>
          {dec31Entry ? (
            <p style={{ fontFamily:"'Lora',serif", fontSize:15, fontWeight:500, color:T.sub, fontStyle:"italic", margin:0, lineHeight:1.7 }}>
              "{dec31Entry.content}"
            </p>
          ) : (
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:500, color:T.muted, margin:0, lineHeight:1.6 }}>
              Le 31 décembre, une dernière entrée clôturera l'année — un chapitre scellé pour l'éternité.
            </p>
          )}
        </div>
      </Card>

      {/* Concept explainer */}
      <div style={{ background:T.blueSoft, borderRadius:14, padding:"16px 18px", marginBottom:24 }}>
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:700, color:T.blue, margin:"0 0 8px", letterSpacing:"0.04em" }}>COMMENT ÇA FONCTIONNE</p>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {[
            { icon:"portrait", text:"Le 1er janvier · Ta photo devient ta photo de profil pour toute l'année", color:T.blue },
            { icon:"calendar", text:"Le 31 décembre · Une dernière entrée scelle et clôture l'année définitivement", color:"#D4A017" },
            { icon:"lock",     text:"Une fois l'année close · Son contenu ne peut plus jamais être modifié", color:T.body },
          ].map((item,i)=>(
            <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
              <Ic n={item.icon} s={15} c={item.color} sw={2}/>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:500, color:T.sub, margin:0, lineHeight:1.55 }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Past years */}
      <Lbl>Années précédentes</Lbl>
      {ANNUAL_PHOTOS.filter(p=>p.year!==thisYear).map(yr=>(
        <div key={yr.year} style={{ background:T.surface, borderRadius:14, border:`1px solid ${T.line}`, padding:"14px 16px", marginBottom:10, display:"flex", gap:14, alignItems:"center" }}>
          {/* Year avatar */}
          <div style={{ width:56, height:56, borderRadius:14, background: yr.dec31?`linear-gradient(135deg, ${T.line2}, ${T.sub})` : `linear-gradient(135deg, ${T.blue}, ${T.blueL})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0 }}>
            {yr.emoji}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ fontFamily:"'Lora',serif", fontSize:17, fontWeight:700, color:T.body }}>{yr.year}</span>
              {yr.dec31 && (
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:600, color:T.seal, background:T.sealSoft, padding:"2px 8px", borderRadius:100 }}>
                  ✓ Close
                </span>
              )}
            </div>
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:500, color:T.muted, margin:0, lineHeight:1.5 }}>{yr.note}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ── BIOGRAPHY ───────────────────────────────────────────────────────────────── */
const BiographyScreen = ({ entries }) => {
  const [bio, setBio]   = useState(`Lando est de ceux qui refusent de passer dans ce monde sans y laisser une trace. À travers le fil de ses journées, une vérité s'impose : il vit avec l'intensité rare de quelqu'un qui sait que chaque heure compte dans l'écriture du grand récit.\n\nSes matins lui appartiennent — *"La simplicité est une force"* revient comme un fil d'or dans ses notes. Ce qui le définit profondément, c'est un ancrage inébranlable dans l'humain.\n\nIl est en train d'écrire quelque chose d'important. Pas seulement dans ses notes — dans l'histoire.`);
  const [loading, setL] = useState(false);

  const gen = async () => {
    setL(true);
    const txt = entries.slice(0,8).map(e=>`[${e.cat} · ${e.date}] ${e.content}`).join("\n\n");
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:700,messages:[{role:"user",content:`Tu es un biographe. 3 paragraphes, poétique, 3e personne. 1-2 citations *italique*. Directement.\n\n${txt}`}]})});
      const d=await r.json();
      setBio(d.content?.map(c=>c.text||"").join("")||bio);
    } catch{}
    setL(false);
  };

  const render = (t) => t.split("\n\n").map((p,i) => {
    const parts = p.split(/(\*[^*]+\*)/).map((s,j)=>{
      if(s.startsWith("*")&&s.endsWith("*")) return <em key={j} style={{color:T.blue,fontStyle:"italic"}}>{s.slice(1,-1)}</em>;
      return <span key={j}>{s.replace(/\*\*/g,"")}</span>;
    });
    return <p key={i} style={{fontFamily:"'Lora',serif",fontSize:17,fontWeight:500,color:T.body,lineHeight:1.9,margin:"0 0 18px"}}>{parts}</p>;
  });

  return (
    <div>
      <h2 style={{ fontFamily:"'Lora',serif", fontSize:26, fontWeight:700, color:T.title, margin:"0 0 6px" }}>Ton histoire</h2>
      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:500, color:T.muted, margin:"0 0 24px" }}>Portrait biographique · généré à partir de tes entrées scellées</p>

      <Card style={{ marginBottom:14 }}>
        {loading
          ? <div style={{ display:"flex", alignItems:"center", gap:10, color:T.muted, padding:"20px 0" }}><div style={{ animation:"spin 1s linear infinite" }}><Ic n="loader" s={18} c={T.blue} sw={2}/></div><span style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:500 }}>L'IA tisse ton histoire…</span></div>
          : render(bio)
        }
        <div style={{ display:"flex", gap:8, padding:"11px 13px", background:T.sealSoft, borderRadius:10, marginTop:4 }}>
          <Ic n="shield" s={14} c={T.seal} sw={2}/>
          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:500, color:T.seal, margin:0, lineHeight:1.5 }}>
            Généré uniquement depuis des entrées authentifiées et scellées.
          </p>
        </div>
      </Card>

      <Btn variant="outline" onClick={gen} disabled={loading} icon={loading?"loader":"sparkle"} full>
        {loading ? "Génération…" : "Régénérer mon portrait"}
      </Btn>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

/* ── DNA SCREEN ──────────────────────────────────────────────────────────────── */
const DNAScreen = () => {
  const [profile, setP] = useState({});
  const [open, setOpen] = useState("identity");
  const [summary, setSummary] = useState("");
  const [loadingS, setLS] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (id,val) => setP(p=>({...p,[id]:val}));
  const filled = DNA_SECTIONS.reduce((a,s)=>a+s.fields.filter(f=>profile[f.id]&&String(profile[f.id]).trim()&&profile[f.id]!=="—").length,0);
  const total  = DNA_SECTIONS.reduce((a,s)=>a+s.fields.length,0);
  const pct    = Math.round(filled/total*100);

  const genSummary = async () => {
    setLS(true);
    const str = DNA_SECTIONS.map(s=>s.label+":\n"+s.fields.map(f=>f.label+": "+(profile[f.id]||"—")).join(", ")).join("\n\n");
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,messages:[{role:"user",content:`Portrait de vie en 2-3 phrases poétiques, puis sur une nouvelle ligne une épigraphe de 15 mots max.\n\nFormat:\n[Portrait]\n---\n[Épigraphe]\n\nProfil:\n${str}`}]})});
      const d=await r.json();
      setSummary(d.content?.map(c=>c.text||"").join("")||"");
    } catch{}
    setLS(false);
  };

  return (
    <div>
      <h2 style={{ fontFamily:"'Lora',serif", fontSize:26, fontWeight:700, color:T.title, margin:"0 0 6px" }}>Mon ADN de vie</h2>
      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:500, color:T.muted, margin:"0 0 22px" }}>Ce qui te définit · pour l'éternité</p>

      {/* Progress */}
      <Card style={{ marginBottom:18 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:600, color:T.body }}>Profil complété</span>
          <span style={{ fontFamily:"'Lora',serif", fontSize:18, fontWeight:700, color:pct>70?T.seal:pct>40?T.warn:T.blue }}>{pct}%</span>
        </div>
        <div style={{ height:6, background:T.line, borderRadius:3, overflow:"hidden" }}>
          <div style={{ width:`${pct}%`, height:"100%", background:pct>70?T.seal:pct>40?T.warn:T.blue, borderRadius:3, transition:"width 0.5s" }}/>
        </div>
      </Card>

      {/* Sections */}
      {DNA_SECTIONS.map(section=>(
        <div key={section.id} style={{ marginBottom:8 }}>
          <button onClick={()=>setOpen(open===section.id?null:section.id)}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:12, padding:"15px 17px", background:T.surface, borderRadius: open===section.id?"13px 13px 0 0":"13px", border:`1px solid ${open===section.id?T.blue+"50":T.line}`, cursor:"pointer", transition:"all 0.2s" }}>
            <span style={{ fontSize:20 }}>{section.emoji}</span>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:600, color:T.body, flex:1, textAlign:"left" }}>{section.label}</span>
            <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:600, color:T.muted }}>
              {section.fields.filter(f=>profile[f.id]&&String(profile[f.id]).trim()&&profile[f.id]!=="—").length}/{section.fields.length}
            </span>
            <div style={{ transform:`rotate(${open===section.id?90:0}deg)`, transition:"transform 0.2s" }}>
              <Ic n="chevron" s={17} c={open===section.id?T.blue:T.muted} sw={open===section.id?2.5:2}/>
            </div>
          </button>

          {open===section.id && (
            <div style={{ background:T.bg, border:`1px solid ${T.blue}30`, borderTop:"none", borderRadius:"0 0 13px 13px", padding:"18px 17px 20px" }}>
              {section.fields.map(f=>(
                <Field key={f.id} label={f.label} value={profile[f.id]||""} onChange={v=>set(f.id,v)}
                  type={f.type==="number"?"number":"text"} ph={f.ph} multi={f.type==="textarea"} opts={f.opts}/>
              ))}
            </div>
          )}
        </div>
      ))}

      <div style={{ display:"flex", gap:10, margin:"18px 0" }}>
        <Btn variant={saved?"seal":"outline"} icon={saved?"check":"save"} onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),2000);}} full>
          {saved ? "Sauvegardé ✓" : "Sauvegarder"}
        </Btn>
      </div>

      <Hr/>

      {/* AI Portrait */}
      <Lbl>Portrait public · Sépulture</Lbl>
      {summary ? (
        <Card style={{ marginBottom:12 }}>
          {summary.split("---").map((p,i)=>(
            <p key={i} style={{ fontFamily:i===0?"'Lora',serif":"'Inter',sans-serif", fontSize:i===0?16:14, fontWeight:i===0?500:700, color:i===0?T.body:T.blue, lineHeight:i===0?1.8:1.4, margin:`0 0 ${i===0?14:0}px`, fontStyle:i===0?"italic":"normal" }}>
              {i===1 ? `❝ ${p.trim()} ❞` : p.trim()}
            </p>
          ))}
        </Card>
      ) : (
        <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:500, color:T.muted, lineHeight:1.6, marginBottom:12 }}>
          Génère ton portrait public à partir de ton ADN de vie — il apparaîtra sur ta sépulture.
        </p>
      )}
      <Btn variant="outline" onClick={genSummary} disabled={loadingS} icon={loadingS?"loader":"sparkle"} full>
        {loadingS ? "Génération…" : summary ? "Régénérer" : "Générer mon portrait public"}
      </Btn>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

/* ── CATEGORIES ──────────────────────────────────────────────────────────────── */
const CategoriesScreen = ({ cats, onAdd }) => {
  const [showForm, setForm] = useState(false);
  const [name, setName]     = useState("");
  const [emoji, setEmoji]   = useState("📝");
  const emojis = ["📝","💡","🧠","❤️","🌿","📌","🎯","💎","🔥","🎵","📖","✈️","💪","🍀","🌙","⚡","🏆","🎭","🌍","🧬"];

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
        <div>
          <h2 style={{ fontFamily:"'Lora',serif", fontSize:26, fontWeight:700, color:T.title, margin:"0 0 4px" }}>Catégories</h2>
          <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:500, color:T.muted, margin:0 }}>Les chapitres que tu inventes</p>
        </div>
        <button onClick={()=>setForm(!showForm)} style={{ width:42, height:42, borderRadius:13, background:T.blueSoft, border:`1.5px solid ${T.blueMid}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
          <Ic n="plus" s={20} c={T.blue} sw={2.5}/>
        </button>
      </div>

      {showForm && (
        <Card style={{ marginBottom:16 }}>
          <Field label="Nom" value={name} onChange={setName} ph="ex: Santé, Business, Famille…"/>
          <Lbl>Icône</Lbl>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:16 }}>
            {emojis.map(e=>(
              <button key={e} onClick={()=>setEmoji(e)} style={{ width:42, height:42, borderRadius:11, border:`1.5px solid ${emoji===e?T.blue:T.line2}`, background:emoji===e?T.blueSoft:T.surface, cursor:"pointer", fontSize:20, display:"flex", alignItems:"center", justifyContent:"center" }}>{e}</button>
            ))}
          </div>
          <Btn onClick={()=>{ if(name.trim()){ onAdd({id:Date.now(),name:name.trim(),emoji,count:0}); setForm(false); setName(""); }}} full>Créer</Btn>
        </Card>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {cats.map(cat=>(
          <div key={cat.id} style={{ display:"flex", alignItems:"center", gap:14, background:T.surface, borderRadius:14, border:`1px solid ${T.line}`, padding:"14px 17px", boxShadow:`0 1px 3px ${T.shadow}` }}>
            <div style={{ width:46, height:46, borderRadius:13, background:T.surface2, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>
              {cat.emoji}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:15, fontWeight:600, color:T.body, margin:"0 0 2px" }}>{cat.name}</p>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:500, color:T.muted, margin:0 }}>{cat.count} entrées</p>
            </div>
            <Ic n="chevron" s={18} c={T.muted} sw={2}/>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── SEPULTURE ────────────────────────────────────────────────────────────────── */
const SepultureScreen = ({ entries }) => {
  const [isPublic, setPub] = useState(false);
  const [votes, setVotes]  = useState(1247);
  const [voted, setVoted]  = useState(false);
  const pct = Math.min(100, votes/10000*100);

  // Get current year profile photo
  const thisYear = new Date().getFullYear().toString();
  const profileEntry = entries.find(e=>e.date===`${thisYear}-01-01`);

  return (
    <div>
      <h2 style={{ fontFamily:"'Lora',serif", fontSize:26, fontWeight:700, color:T.title, margin:"0 0 6px" }}>Ma sépulture</h2>
      <p style={{ fontFamily:"'Inter',sans-serif", fontSize:13, fontWeight:500, color:T.muted, margin:"0 0 22px" }}>Ton monument public · ce que tu laisseras au monde</p>

      {/* Visibility */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <Ic n={isPublic?"globe":"lock"} s={20} c={isPublic?T.blue:T.muted} sw={2}/>
            <div>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:14, fontWeight:600, color:T.body, margin:"0 0 2px" }}>{isPublic?"Profil public":"Profil privé"}</p>
              <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:500, color:T.muted, margin:0 }}>{isPublic?"Visible · votes ouverts":"Seul toi peux voir ce profil"}</p>
            </div>
          </div>
          <div onClick={()=>setPub(p=>!p)} style={{ width:50, height:28, borderRadius:100, background:isPublic?T.blue:T.line2, cursor:"pointer", position:"relative", transition:"background 0.2s" }}>
            <div style={{ width:22, height:22, borderRadius:"50%", background:"white", position:"absolute", top:3, left:isPublic?25:3, transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }}/>
          </div>
        </div>
      </Card>

      {/* Monument */}
      <Card style={{ overflow:"hidden", marginBottom:16, padding:0 }}>
        {/* Header */}
        <div style={{ height:160, background:"linear-gradient(160deg,#1A2B50 0%,#2B5098 60%,#3B6FD4 100%)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
          {[...Array(18)].map((_,i)=>(
            <div key={i} style={{ position:"absolute", left:`${(i*37+11)%100}%`, top:`${(i*53+7)%100}%`, width:i%5===0?2:1, height:i%5===0?2:1, borderRadius:"50%", background:"white", opacity:0.08+((i*17)%10)/30 }}/>
          ))}
          <div style={{ textAlign:"center", position:"relative" }}>
            {/* Profile avatar — pulls from Jan 1 photo */}
            <div style={{ width:72, height:72, borderRadius:"50%", border:"3px solid rgba(255,255,255,0.4)", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, margin:"0 auto 12px" }}>
              {profileEntry ? "🧔🏿" : "👤"}
            </div>
            <p style={{ fontFamily:"'Lora',serif", fontSize:22, fontWeight:700, color:"white", margin:"0 0 4px" }}>Lando</p>
            <p style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:500, color:"rgba(255,255,255,0.6)", margin:0, letterSpacing:"0.12em" }}>1994 — ∞</p>
            {profileEntry && (
              <div style={{ position:"absolute", top:-58, right:-70, background:"rgba(255,255,255,0.15)", borderRadius:8, padding:"3px 8px", backdropFilter:"blur(4px)" }}>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:10, fontWeight:600, color:"rgba(255,255,255,0.8)" }}>Photo du 01/01/{thisYear}</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding:"22px 20px" }}>
          <p style={{ fontFamily:"'Lora',serif", fontSize:16, fontWeight:500, color:T.sub, lineHeight:1.85, margin:"0 0 18px", fontStyle:"italic", textAlign:"center" }}>
            "Il choisit de vivre avec intention, de penser avec profondeur, et de ne jamais passer dans ce monde sans y laisser une trace."
          </p>

          <Hr my={16}/>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
            {[{v:"127",l:"Entrées"},{v:"5",l:"Années"},{v:votes.toLocaleString(),l:"Votes"},{v:"2 847",l:"Lecteurs"}].map(s=>(
              <div key={s.l} style={{ background:T.surface2, borderRadius:12, padding:"12px 14px", textAlign:"center" }}>
                <p style={{ fontFamily:"'Lora',serif", fontSize:22, fontWeight:700, color:T.title, margin:"0 0 2px" }}>{s.v}</p>
                <p style={{ fontFamily:"'Inter',sans-serif", fontSize:11, fontWeight:600, color:T.muted, margin:0 }}>{s.l}</p>
              </div>
            ))}
          </div>

          {/* Vote */}
          <div style={{ background:T.blueSoft, borderRadius:14, padding:"16px 15px" }}>
            <Lbl>Vote populaire</Lbl>
            <div style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:600, color:T.sub }}>{votes.toLocaleString()}</span>
                <span style={{ fontFamily:"'Inter',sans-serif", fontSize:12, fontWeight:700, color:T.blue }}>Légende = 10 000</span>
              </div>
              <div style={{ height:7, background:T.blueMid, borderRadius:4, overflow:"hidden" }}>
                <div style={{ width:`${pct}%`, height:"100%", background:T.blue, borderRadius:4, transition:"width 0.5s" }}/>
              </div>
            </div>
            <Btn variant={voted?"ghost":"primary"} onClick={()=>{if(!voted){setVoted(true);setVotes(v=>v+1);}}} icon={voted?"check":"vote"} full>
              {voted?"Vote enregistré":"Voter pour cette vie"}
            </Btn>
          </div>
        </div>
      </Card>
    </div>
  );
};

/* ── BOTTOM NAV ──────────────────────────────────────────────────────────────── */
const BottomNav = ({ view, setView, hasAlert }) => {
  const tabs = [
    { id:"journal",   icon:"home",     label:"Journal"   },
    { id:"portrait",  icon:"portrait", label:"Portrait"  },
    { id:"biography", icon:"book",     label:"Histoire"  },
    { id:"dna",       icon:"dna",      label:"Mon ADN"   },
    { id:"sepulture", icon:"tomb",     label:"Sépulture" },
  ];
  return (
    <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:T.surface, borderTop:`1px solid ${T.line}`, display:"flex", zIndex:700, paddingBottom:"env(safe-area-inset-bottom,8px)" }}>
      {tabs.map(tab=>(
        <button key={tab.id} onClick={()=>setView(tab.id)}
          style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, padding:"10px 4px 8px", background:"none", border:"none", cursor:"pointer", position:"relative" }}>
          {tab.id==="journal" && hasAlert && (
            <div style={{ position:"absolute", top:8, right:"calc(50% - 16px)", width:7, height:7, borderRadius:"50%", background:T.warn, zIndex:1 }}/>
          )}
          <Ic n={tab.icon} s={23} c={view===tab.id ? T.blue : T.body} sw={view===tab.id ? 2.2 : 1.8}/>
          <span style={{ fontFamily:"'Inter',sans-serif", fontSize:10, fontWeight:view===tab.id?700:500, color:view===tab.id?T.blue:T.muted }}>
            {tab.label}
          </span>
          {view===tab.id && <div style={{ position:"absolute", bottom:0, width:20, height:2, borderRadius:2, background:T.blue }}/>}
        </button>
      ))}
    </div>
  );
};

/* ── APP ─────────────────────────────────────────────────────────────────────── */
export default function DailyNote() {
  const [view, setView]     = useState("journal");
  const [entries, setEnt]   = useState(INIT_ENTRIES);
  const [cats, setCats]     = useState(INIT_CATS);
  const [showNew, setNew]   = useState(false);
  const [showPen, setPen]   = useState(false);

  const missedDays = ["2025-03-16","2025-03-17"].filter(d=>!entries.some(e=>e.date===d)&&isPast(d));

  return (
    <>
      <style>{GF}{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${T.bg};-webkit-font-smoothing:antialiased;}
        ::-webkit-scrollbar{display:none;}
        textarea::placeholder,input::placeholder{color:${T.muted};font-weight:500;}
        select option{color:${T.body};background:white;}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes up{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div style={{ minHeight:"100vh", background:T.bg, display:"flex", justifyContent:"center" }}>
        <div style={{ width:"100%", maxWidth:430, position:"relative", minHeight:"100vh" }}>

          {/* Top bar */}
          <div style={{ height:56, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px", background:T.surface, borderBottom:`1px solid ${T.line}`, position:"sticky", top:0, zIndex:600 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:36, height:36, borderRadius:11, background:T.blueSoft, border:`1.5px solid ${T.blueMid}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>📖</div>
              <span style={{ fontFamily:"'Lora',serif", fontSize:18, fontWeight:700, color:T.title }}>DailyNote</span>
            </div>
            {/* Year profile photo indicator */}
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              {missedDays.length>0 && <div style={{ width:8, height:8, borderRadius:"50%", background:T.warn }}/>}
              <div style={{ width:34, height:34, borderRadius:"50%", background:`linear-gradient(135deg,${T.blue},#1A3D8F)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🧔🏿</div>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding:"24px 20px 104px", animation:"up 0.2s ease" }}>
            {view==="journal"   && <Journal entries={entries} cats={cats} onNew={()=>setNew(true)} missedDays={missedDays} onPenalty={()=>setPen(true)}/>}
            {view==="portrait"  && <PortraitScreen entries={entries}/>}
            {view==="biography" && <BiographyScreen entries={entries}/>}
            {view==="dna"       && <DNAScreen/>}
            {view==="sepulture" && <SepultureScreen entries={entries}/>}
          </div>

          {/* FAB */}
          {view==="journal" && (
            <button onClick={()=>setNew(true)} style={{ position:"fixed", bottom:80, right:"calc(50% - 215px + 18px)", width:54, height:54, borderRadius:"50%", background:T.blue, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 4px 20px ${T.blue}50`, zIndex:650 }}>
              <Ic n="pen" s={22} c="white" sw={2}/>
            </button>
          )}

          <BottomNav view={view} setView={setView} hasAlert={missedDays.length>0}/>
        </div>
      </div>

      {showNew && <NewEntrySheet cats={cats} onClose={()=>setNew(false)} onSave={e=>{setEnt(p=>[e,...p]);}} missedDays={missedDays}/>}
      {showPen && missedDays.length>0 && <PenaltySheet days={missedDays.length} onPay={()=>setPen(false)} onClose={()=>setPen(false)}/>}
    </>
  );
}
