/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — LoadingScreen
   ═══════════════════════════════════════════════════════════════════
   Splash screen affiché 1.8-2.5s avant l'écran d'accueil.
     - Logo "SUPER TETRIS" arc-en-ciel (style Tetris officiel)
     - Barre de progression animée (purement cosmétique mais rassurante)
     - Particules d'étoiles scintillantes en background
     - Disparaît en fade-out une fois le timer terminé OU si onDone
       est appelé manuellement

   Pas de logique de jeu ici — c'est purement visuel.
   ═══════════════════════════════════════════════════════════════════ */

const { useState, useEffect, useRef } = React;

function LoadingScreen({ onDone, minDurationMs }) {
  const [progress, setProgress] = useState(0);
  const [hint, setHint] = useState("");
  const startedRef = useRef(Date.now());
  const minMs = typeof minDurationMs === "number" ? minDurationMs : 1800;

  // Liste de hints rotatifs (pédagogie + immersion)
  const hints = [
    "Astuce : utilise le hold pour mettre une pièce en réserve",
    "Réussir un Tetris (4 lignes) donne le maximum de points",
    "Les T-Spin valent 3× plus que les lignes normales",
    "Les boosters se gardent entre les parties",
    "La roue de la fortune offre des récompenses chaque jour",
    "Ne ferme pas l'app si tu vois la pub — c'est une vie en plus !",
    "Les niveaux supérieurs accélèrent la chute",
    "Combo 10× = score multiplié par 5 !",
  ];

  // Mount-once : démarre l'animation de progression
  useEffect(() => {
    startedRef.current = Date.now();

    // Hint aléatoire
    setHint(hints[Math.floor(Math.random() * hints.length)]);

    // Progress 0 → 100% sur minMs
    let raf;
    const tick = () => {
      const elapsed = Date.now() - startedRef.current;
      const pct = Math.min(100, (elapsed / minMs) * 100);
      setProgress(pct);
      if (elapsed < minMs) {
        raf = requestAnimationFrame(tick);
      } else {
        // Petit délai pour que la barre arrive bien à 100% visuel
        setTimeout(() => {
          if (typeof onDone === "function") onDone();
          // Notifie le HTML loader de bord pour qu'il disparaisse aussi
          try { window.dispatchEvent(new Event("super-tetris-ready")); } catch (_) {}
        }, 200);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={S.root}>
      {/* Étoiles scintillantes en background */}
      <Starfield />

      <div style={S.content}>
        {/* Logo SUPER TETRIS */}
        <div style={S.logoWrap} className="float">
          <div style={S.logoSmall}>SUPER</div>
          <div className="logo-rainbow" style={S.logoMain}>TETRIS</div>
        </div>

        {/* Spinner alternatif : un mini-Tetris qui tourne */}
        <div style={S.spinnerWrap}>
          <div style={S.spinner} />
        </div>

        {/* Barre de progression */}
        <div style={S.barWrap}>
          <div style={{
            ...S.barFill,
            width: progress + "%",
          }} />
        </div>

        {/* Hint */}
        <div style={S.hint}>{hint}</div>
      </div>
    </div>
  );
}

/* ─── Starfield (étoiles scintillantes en background) ───────────── */
function Starfield({ count }) {
  const [stars] = useState(() => {
    const n = count || 28;
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push({
        top:   Math.random() * 100,
        left:  Math.random() * 100,
        delay: Math.random() * 3,
        size:  Math.random() * 3 + 2,
      });
    }
    return arr;
  });
  return (
    <div className="starfield" style={{ position: "absolute", inset: 0 }}>
      {stars.map((st, i) => (
        <div
          key={i}
          className="star"
          style={{
            top: st.top + "%",
            left: st.left + "%",
            width: st.size + "px",
            height: st.size + "px",
            animationDelay: st.delay + "s",
          }}
        />
      ))}
    </div>
  );
}

const S = {
  root: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "radial-gradient(ellipse at center, #1a2a6e 0%, #0b1238 70%)",
  },
  content: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 24,
    textAlign: "center",
  },
  logoWrap: {
    marginBottom: 32,
    lineHeight: 1,
  },
  logoSmall: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 24,
    color: "#fff",
    letterSpacing: 8,
    marginBottom: 4,
    textShadow: "0 2px 0 rgba(0,0,0,0.4)",
  },
  logoMain: {
    fontSize: "clamp(48px, 14vw, 84px)",
    letterSpacing: 6,
    lineHeight: 1,
  },
  spinnerWrap: {
    width: 56,
    height: 56,
    marginBottom: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "4px solid rgba(124,58,237,0.18)",
    borderTopColor: "var(--purple-l)",
    animation: "st-spin 0.9s linear infinite",
  },
  barWrap: {
    width: "min(280px, 70vw)",
    height: 8,
    background: "rgba(255,255,255,0.08)",
    borderRadius: 100,
    overflow: "hidden",
    marginBottom: 16,
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)",
  },
  barFill: {
    height: "100%",
    background: "linear-gradient(90deg, #7c3aed, #a855f7, #ec4899, #f97316)",
    borderRadius: 100,
    transition: "width 0.05s linear",
    boxShadow: "0 0 10px rgba(168,85,247,0.6)",
  },
  hint: {
    fontSize: 12,
    fontWeight: 600,
    color: "rgba(255,255,255,0.55)",
    maxWidth: 280,
    lineHeight: 1.5,
    fontStyle: "italic",
    minHeight: 36,
  },
};

// CSS keyframes pour spinner (injecté localement car pas dans global.css)
(function () {
  if (typeof document === "undefined") return;
  if (document.getElementById("st-spinner-keyframes")) return;
  const style = document.createElement("style");
  style.id = "st-spinner-keyframes";
  style.textContent = "@keyframes st-spin { to { transform: rotate(360deg); } }";
  document.head.appendChild(style);
})();

window.LoadingScreen = LoadingScreen;
