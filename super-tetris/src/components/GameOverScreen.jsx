/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — GameOverScreen
   ═══════════════════════════════════════════════════════════════════
   Affiché quand la pièce ne peut plus spawner (top out).

   Design fidèle aux screenshots Tetris officiel :
     - Header : badge coins + bouton X (close)
     - Médaillon central : bouclier violet avec icône (épées croisées
       ou trophée selon le score)
     - Titre "BLOCK OUT" en gros (Lilita One)
     - Sous-titre : "Essayez encore, vous allez y arriver !" / "Nouveau
       record !" / etc.
     - Stats : Classement local + Record perso historique
     - Section "Your Rewards" : XP gagnée + coins gagnés + boosters
       gagnés au passage de niveau
     - Bouton "VOIR PUB POUR CONTINUER" (en haut, optionnel) — RewardedAd
     - Bouton géant vert "RÉESSAYER"
     - Bouton secondaire "Accueil"
   ═══════════════════════════════════════════════════════════════════ */

const { useState: useStateGO, useEffect: useEffectGO } = React;

function GameOverScreen({ result, profile, onRetry, onContinueWithAd, onHome }) {
  const r = result || {};
  const score = r.score ?? 0;
  const linesTotal = r.linesTotal ?? 0;
  const level = r.level ?? 1;
  const xpGain = r.xpGain ?? 0;
  const coinsGain = r.coinsGain ?? 0;

  const oldBest = (profile && profile.bestScore) || 0;
  const newRecord = score > oldBest;
  const bestForDisplay = Math.max(oldBest, score);

  // V1 : on autorise 1 seul "Continue via pub" par partie
  const [continueUsed, setContinueUsed] = useStateGO(false);

  return (
    <div style={SGO.root}>
      <Starfield count={20} />

      {/* Header : coins + bouton fermer */}
      <div style={SGO.header}>
        <div style={SGO.coinsPill}>
          <span style={SGO.coinIcon}>👑</span>
          <span style={SGO.coinValue}>{formatNum((profile && profile.coins) || 0)}</span>
        </div>
        <button onClick={onHome} style={SGO.closeBtn} aria-label="Accueil">✕</button>
      </div>

      {/* Médaillon central */}
      <div style={SGO.medallion} className="pop-in">
        <Shield newRecord={newRecord} />
      </div>

      {/* Titre + message */}
      <div style={SGO.title}>{newRecord ? "NEW RECORD" : "BLOCK OUT"}</div>
      <div style={SGO.subtitle}>
        {newRecord ? "Bravo, tu viens de battre ton record !" : "Essayez encore, vous allez y arriver !"}
      </div>

      {/* Stats principales */}
      <div style={SGO.statsBlock}>
        <StatRow label="Score" value={formatNum(score)} accent />
        <StatRow label="Lignes effacées" value={linesTotal} />
        <StatRow label="Niveau atteint" value={level} />
        <StatRow label="Record personnel" value={formatNum(bestForDisplay)} highlight={newRecord} />
      </div>

      {/* Récompenses */}
      <div style={SGO.rewardsTitle}>Récompenses</div>
      <div style={SGO.rewardsRow}>
        <RewardChip icon="⭐" label="XP" value={"+" + formatNum(xpGain)} />
        <RewardChip icon="👑" label="Pièces" value={"+" + formatNum(coinsGain)} />
      </div>

      {/* Bouton "Continuer avec une pub" (1×/partie) */}
      {!continueUsed && typeof onContinueWithAd === "function" && (
        <button
          style={SGO.continueBtn}
          onClick={() => {
            setContinueUsed(true);
            onContinueWithAd();
          }}
        >
          <span style={{ fontSize: 18, marginRight: 8 }}>📺</span>
          <span>Voir une pub pour continuer</span>
        </button>
      )}

      {/* CTA principal */}
      <button
        className="btn-3d"
        style={SGO.retryBtn}
        onClick={onRetry}
      >RÉESSAYER</button>

      <button
        className="btn-3d purple"
        style={SGO.homeBtn}
        onClick={onHome}
      >Accueil</button>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────── */
function Shield({ newRecord }) {
  // SVG bouclier violet avec épées croisées (matches le screenshot)
  return (
    <svg width="180" height="180" viewBox="0 0 180 180"
      style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.5))" }}>
      <defs>
        <linearGradient id="shieldGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor="#a855f7" />
          <stop offset="100%" stopColor="#5b21b6" />
        </linearGradient>
        <linearGradient id="centerGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor="#f97316" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
      </defs>

      {/* Cercle externe violet */}
      <circle cx="90" cy="90" r="84" fill="url(#shieldGrad)" stroke="#3b0764" strokeWidth="4" />
      {/* Anneau gris au-dessus */}
      <circle cx="90" cy="90" r="74" fill="none" stroke="#cbd5e1" strokeWidth="6" opacity="0.5" />
      {/* Centre orange (bouclier) */}
      <circle cx="90" cy="90" r="55" fill="url(#centerGrad)" stroke="#7c2d12" strokeWidth="3" />

      {newRecord ? (
        // Trophée pour record
        <g>
          <path d="M 70 65 L 110 65 L 110 75 L 100 75 L 100 100 L 110 100 L 110 110 L 70 110 L 70 100 L 80 100 L 80 75 L 70 75 Z"
            fill="#ffd23f" stroke="#92400e" strokeWidth="2" />
          <path d="M 80 110 L 100 110 L 100 130 L 80 130 Z" fill="#ffd23f" stroke="#92400e" strokeWidth="2" />
        </g>
      ) : (
        // Épées croisées (game over standard)
        <g>
          {/* Épée 1 (rouge) — diagonale ↘ */}
          <g transform="rotate(45, 90, 90)">
            <rect x="86" y="40" width="8" height="60" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
            <rect x="80" y="100" width="20" height="6" fill="#fbbf24" stroke="#92400e" strokeWidth="1" />
            <rect x="84" y="106" width="12" height="14" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1" />
          </g>
          {/* Épée 2 (rouge) — diagonale ↙ */}
          <g transform="rotate(-45, 90, 90)">
            <rect x="86" y="40" width="8" height="60" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
            <rect x="80" y="100" width="20" height="6" fill="#fbbf24" stroke="#92400e" strokeWidth="1" />
            <rect x="84" y="106" width="12" height="14" fill="#dc2626" stroke="#7f1d1d" strokeWidth="1" />
          </g>
        </g>
      )}
    </svg>
  );
}

function StatRow({ label, value, accent, highlight }) {
  return (
    <div style={{
      ...SGO.statRow,
      ...(highlight ? SGO.statRowNew : {}),
    }}>
      <span style={SGO.statLabel}>{label}</span>
      <span style={{
        ...SGO.statValue,
        color: accent ? "var(--gold)" : (highlight ? "var(--gold)" : "#fff"),
        fontSize: accent ? 22 : 16,
      }}>{value}</span>
    </div>
  );
}

function RewardChip({ icon, label, value }) {
  return (
    <div style={SGO.chip}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>{label}</span>
        <span style={{ fontFamily: "'Lilita One', cursive", fontSize: 18, color: "var(--gold)" }}>{value}</span>
      </div>
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────── */
function formatNum(n) {
  const safe = typeof n === "number" && isFinite(n) ? n : 0;
  return safe.toLocaleString("fr-FR");
}

const SGO = {
  root: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "calc(env(safe-area-inset-top, 0px) + 12px) 16px calc(env(safe-area-inset-bottom, 0px) + 16px)",
    overflowY: "auto",
    background: "radial-gradient(ellipse at center, #1a2a6e 0%, #0b1238 70%)",
  },

  header: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  coinsPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    borderRadius: 100,
    padding: "6px 16px 6px 10px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 0 rgba(0,0,0,0.3)",
  },
  coinIcon: { fontSize: 18 },
  coinValue: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 16,
    color: "var(--gold)",
    minWidth: 40,
    textAlign: "center",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "linear-gradient(180deg, var(--blue), #1e40af)",
    border: "1.5px solid var(--sky)",
    fontSize: 18,
    color: "#fff",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 0 rgba(0,0,0,0.3)",
  },

  medallion: {
    margin: "10px 0 16px",
  },

  title: {
    fontFamily: "'Lilita One', cursive",
    fontSize: "clamp(36px, 9vw, 50px)",
    color: "#fff",
    letterSpacing: 3,
    textShadow: "0 4px 0 rgba(0,0,0,0.4), 0 8px 16px rgba(0,0,0,0.4)",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 24,
    fontWeight: 600,
  },

  statsBlock: {
    width: "100%",
    maxWidth: 360,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 24,
  },
  statRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    background: "rgba(0,0,0,0.35)",
    borderRadius: 12,
    border: "1px solid rgba(124,58,237,0.4)",
  },
  statRowNew: {
    background: "linear-gradient(180deg, rgba(255,210,63,0.2), rgba(255,210,63,0.05))",
    border: "1.5px solid var(--gold)",
  },
  statLabel: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 700 },
  statValue: {
    fontFamily: "'Lilita One', cursive",
    color: "#fff",
  },

  rewardsTitle: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 20,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: 1,
  },
  rewardsRow: {
    display: "flex",
    gap: 12,
    marginBottom: 24,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  chip: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    borderRadius: 14,
    padding: "10px 16px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 0 rgba(0,0,0,0.3)",
    minWidth: 130,
  },

  continueBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 360,
    padding: "14px 18px",
    background: "linear-gradient(180deg, var(--orange), #c2410c)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 800,
    borderRadius: 14,
    border: "1.5px solid #fb923c",
    marginBottom: 12,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 0 rgba(0,0,0,0.3)",
    fontFamily: "'Nunito', sans-serif",
  },

  retryBtn: {
    width: "100%",
    maxWidth: 360,
    fontSize: 24,
    padding: "18px 24px",
    marginBottom: 12,
    letterSpacing: 1,
  },
  homeBtn: {
    width: "100%",
    maxWidth: 360,
    fontSize: 16,
    padding: "12px 24px",
  },
};

window.GameOverScreen = GameOverScreen;
