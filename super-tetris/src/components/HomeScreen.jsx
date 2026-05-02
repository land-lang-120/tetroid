/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — HomeScreen
   ═══════════════════════════════════════════════════════════════════
   Écran d'accueil principal :
     - Header : pièces or + jaune (couronnes/coins) + rang
     - Trophée 3D doré flottant au centre (animation float)
     - Bouton PLAY géant (vert, style 3D)
     - Boutons secondaires : Settings (⚙️), Stats/Leaderboard (📊),
       Boutique (🛒), Roue de la fortune (🎰)
     - Bandeau bas "NIVEAUX TRÉPIDANTS!" avec pièces décoratives

   Lit l'état global (props) :
     - profile : { coins, xp, rank, bestScore, boosters }
     - onNavigate(screen) : callback pour changer d'écran

   Pas d'écriture localStorage ici — c'est le rôle de App.jsx.
   ═══════════════════════════════════════════════════════════════════ */

const { useState: useStateHome } = React;

function HomeScreen({ profile, onNavigate }) {
  const safe = profile || {};
  const coins = safe.coins ?? 0;
  const xp = safe.xp ?? 0;
  const bestScore = safe.bestScore ?? 0;

  // Calcul du rang à partir de l'XP
  const rank = computeRankFromXP(xp);

  return (
    <div style={SH.root}>
      <Starfield count={20} />

      {/* ─── Header : coins + rang + paramètres ───────────────────── */}
      <div style={SH.header}>
        <div style={SH.coinsPill}>
          <span style={SH.coinIcon}>👑</span>
          <span style={SH.coinValue}>{formatNum(coins)}</span>
          <button
            onClick={() => onNavigate && onNavigate("shop")}
            style={SH.coinPlus}
            aria-label="Acheter des pièces"
          >+</button>
        </div>

        <div style={SH.rankBadge}>
          <span style={SH.rankIcon}>{rank.icon}</span>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-start", lineHeight:1.1 }}>
            <span style={SH.rankTitle}>{rank.title}</span>
            <span style={SH.rankXP}>{formatNum(xp)} XP</span>
          </div>
        </div>

        <button
          onClick={() => onNavigate && onNavigate("settings")}
          style={SH.iconBtn}
          aria-label="Paramètres"
        >⚙️</button>
      </div>

      {/* ─── Trophée 3D + meilleur score ──────────────────────────── */}
      <div style={SH.trophyWrap} className="float">
        <Trophy />
        {bestScore > 0 && (
          <div style={SH.bestScore}>
            Record : <strong>{formatNum(bestScore)}</strong>
          </div>
        )}
      </div>

      {/* ─── Bouton PLAY géant + boutons secondaires ─────────────── */}
      <div style={SH.actionBar}>
        <button
          onClick={() => onNavigate && onNavigate("stats")}
          className="btn-3d purple icon-only"
          style={SH.actionSide}
          aria-label="Classement"
        >📊</button>

        <button
          onClick={() => onNavigate && onNavigate("game")}
          className="btn-3d"
          style={SH.playBtn}
        >NEW GAME</button>

        <button
          onClick={() => onNavigate && onNavigate("wheel")}
          className="btn-3d gold icon-only"
          style={SH.actionSide}
          aria-label="Roue de la fortune"
        >🎰</button>
      </div>

      {/* ─── Bandeau bas "NIVEAUX TRÉPIDANTS" ─────────────────────── */}
      <div style={SH.bottomBanner}>
        <div style={SH.bannerText}>
          <span style={SH.bannerLine1}>NIVEAUX</span>
          <span style={SH.bannerLine2}>TRÉPIDANTS !</span>
        </div>
        <DecoPieces />
      </div>
    </div>
  );
}

/* ─── Trophée 3D doré (SVG inline pour ne dépendre d'aucune image) ── */
function Trophy() {
  return (
    <svg
      width="220"
      height="240"
      viewBox="0 0 220 240"
      style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.45)) drop-shadow(0 0 32px rgba(124,58,237,0.4))" }}
    >
      {/* Socle violet 3D */}
      <ellipse cx="110" cy="222" rx="78" ry="14" fill="rgba(0,0,0,0.4)" />
      <rect x="46" y="180" width="128" height="36" rx="6" fill="#5b21b6" />
      <rect x="46" y="180" width="128" height="12" rx="6" fill="#7c3aed" />

      {/* Pied du trophée */}
      <rect x="80" y="155" width="60" height="28" fill="#5b21b6" rx="4" />
      <rect x="80" y="155" width="60" height="8" fill="#a855f7" rx="4" />

      {/* Bowl du trophée — dégradé doré + violet */}
      <defs>
        <linearGradient id="bowl" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor="#9333ea" />
          <stop offset="100%" stopColor="#5b21b6" />
        </linearGradient>
        <linearGradient id="t-shape" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor="#ffec80" />
          <stop offset="100%" stopColor="#ffd23f" />
        </linearGradient>
      </defs>

      <path
        d="M 38 50 Q 38 30, 60 30 L 160 30 Q 182 30, 182 50 L 175 145 Q 170 165, 110 165 Q 50 165, 45 145 Z"
        fill="url(#bowl)"
        stroke="#3b0764"
        strokeWidth="3"
      />

      {/* Lettre T or sur le trophée */}
      <path
        d="M 65 60 L 155 60 L 155 80 L 125 80 L 125 145 L 95 145 L 95 80 L 65 80 Z"
        fill="url(#t-shape)"
        stroke="#b8860b"
        strokeWidth="2"
      />

      {/* Highlight blanc sur le bord du bowl */}
      <path
        d="M 50 45 Q 50 38, 60 38 L 160 38"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      {/* Étincelles autour */}
      <Sparkle x="20"  y="60"  size="6" />
      <Sparkle x="195" y="80"  size="5" />
      <Sparkle x="15"  y="140" size="4" />
      <Sparkle x="200" y="160" size="6" />
    </svg>
  );
}

function Sparkle({ x, y, size }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <path
        d={`M 0 -${size} L ${size*0.3} -${size*0.3} L ${size} 0 L ${size*0.3} ${size*0.3} L 0 ${size} L -${size*0.3} ${size*0.3} L -${size} 0 L -${size*0.3} -${size*0.3} Z`}
        fill="#fff"
        opacity="0.9"
      >
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
      </path>
    </g>
  );
}

/* ─── Pièces décoratives en bas ───────────────────────────────── */
function DecoPieces() {
  return (
    <div style={SH.decoWrap}>
      {/* Pièce L (orange) */}
      <div style={{ ...SH.decoPiece, transform: "rotate(-12deg)" }}>
        <div style={{ display:"grid", gridTemplate: "repeat(2, 18px) / repeat(3, 18px)", gap: 1 }}>
          {[0,0,1,1,1,1].map((v,i) => (
            <div key={i} style={{
              background: v ? "var(--orange)" : "transparent",
              borderRadius: 2,
              boxShadow: v ? "inset 2px 2px 0 rgba(255,255,255,0.3), inset -2px -2px 0 rgba(0,0,0,0.3)" : "none",
            }} />
          ))}
        </div>
      </div>
      {/* Pièce T (violette) */}
      <div style={{ ...SH.decoPiece, transform: "rotate(8deg)" }}>
        <div style={{ display:"grid", gridTemplate: "repeat(2, 18px) / repeat(3, 18px)", gap: 1 }}>
          {[0,1,0,1,1,1].map((v,i) => (
            <div key={i} style={{
              background: v ? "var(--purple-l)" : "transparent",
              borderRadius: 2,
              boxShadow: v ? "inset 2px 2px 0 rgba(255,255,255,0.3), inset -2px -2px 0 rgba(0,0,0,0.3)" : "none",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────── */
function formatNum(n) {
  const safeN = typeof n === "number" && isFinite(n) ? n : 0;
  return safeN.toLocaleString("fr-FR");
}

function computeRankFromXP(xp) {
  const x = Math.max(0, xp || 0);
  if (x >= 1000000) return { title: "GRAND MAÎTRE", icon: "👑", level: 8 };
  if (x >=  500000) return { title: "LÉGENDE",      icon: "👑", level: 7 };
  if (x >=  150000) return { title: "MAÎTRE",       icon: "💎", level: 6 };
  if (x >=   50000) return { title: "DIAMANT",      icon: "💎", level: 5 };
  if (x >=   15000) return { title: "OR",           icon: "🥇", level: 4 };
  if (x >=    5000) return { title: "ARGENT",       icon: "🥈", level: 3 };
  if (x >=    1000) return { title: "BRONZE",       icon: "🥉", level: 2 };
  return                  { title: "RECRUE",       icon: "🥉", level: 1 };
}

const SH = {
  root: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    background: "radial-gradient(ellipse at top, #1a2a6e, #0b1238 70%)",
    overflow: "hidden",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px",
    gap: 8,
    position: "relative",
    zIndex: 2,
  },

  coinsPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    borderRadius: 100,
    padding: "6px 4px 6px 10px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 0 rgba(0,0,0,0.3)",
  },
  coinIcon: { fontSize: 18 },
  coinValue: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 16,
    color: "var(--gold)",
    minWidth: 40,
    textAlign: "center",
    textShadow: "0 1px 0 rgba(0,0,0,0.4)",
  },
  coinPlus: {
    background: "var(--green)",
    color: "#fff",
    width: 28,
    height: 28,
    borderRadius: "50%",
    fontSize: 18,
    fontWeight: 800,
    boxShadow: "0 2px 0 var(--green-d), inset 0 1px 0 rgba(255,255,255,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
  },

  rankBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "linear-gradient(180deg, var(--purple), var(--purple-d))",
    borderRadius: 14,
    padding: "6px 12px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 0 rgba(0,0,0,0.3)",
  },
  rankIcon: { fontSize: 22 },
  rankTitle: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 13,
    letterSpacing: 0.5,
    color: "#fff",
    textShadow: "0 1px 0 rgba(0,0,0,0.4)",
  },
  rankXP: { fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.7)" },

  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    fontSize: 22,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 0 rgba(0,0,0,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  trophyWrap: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 280,
    position: "relative",
    zIndex: 2,
  },
  bestScore: {
    marginTop: 8,
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(124,58,237,0.5)",
    borderRadius: 12,
    padding: "6px 16px",
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "'Nunito', sans-serif",
    fontWeight: 700,
  },

  actionBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: "0 24px 24px",
    position: "relative",
    zIndex: 2,
  },
  actionSide: { fontSize: 24, padding: 14, minWidth: 64 },
  playBtn: {
    flex: 1,
    fontSize: "clamp(22px, 6vw, 30px)",
    padding: "20px 32px",
    letterSpacing: 1.5,
    minHeight: 64,
  },

  bottomBanner: {
    position: "relative",
    background: "linear-gradient(180deg, #1e3a8a, #0b1238)",
    padding: "20px 24px calc(env(safe-area-inset-bottom, 0px) + 20px)",
    borderTop: "2px solid var(--purple)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    minHeight: 110,
  },
  bannerText: {
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Lilita One', cursive",
    color: "#fff",
    textShadow: "0 3px 0 rgba(0,0,0,0.4), 0 6px 8px rgba(0,0,0,0.4)",
    lineHeight: 0.95,
  },
  bannerLine1: { fontSize: "clamp(28px, 7vw, 40px)", letterSpacing: 1.5 },
  bannerLine2: {
    fontSize: "clamp(22px, 5vw, 30px)",
    letterSpacing: 1,
    color: "var(--gold)",
    WebkitTextStroke: "1.5px #5b21b6",
  },

  decoWrap: { display: "flex", gap: 10 },
  decoPiece: { padding: 4 },
};

window.HomeScreen = HomeScreen;
