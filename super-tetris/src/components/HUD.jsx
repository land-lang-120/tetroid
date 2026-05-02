/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — HUD (Heads-Up Display)
   ═══════════════════════════════════════════════════════════════════
   Barre supérieure pendant le jeu :
     - TIME : compteur mm:ss depuis le start de la partie
     - TARGET : objectif (ex: "CLEAR 17 LINES" pour le mode Marathon)
     - NEXT : prochaine pièce dans un mini-canvas
     - HOLD : pièce en réserve (modal V2)
     - SCORE + LEVEL + COMBO en sous-barre

   Style cohérent avec les screenshots Tetris officiel :
     - Cards bleu marine bordure violette
     - Police Lilita One pour les valeurs
     - Labels en cyan/sky
     - Coins arrondis, ombres profondes
   ═══════════════════════════════════════════════════════════════════ */

const { useEffect: useEffectHUD, useRef: useRefHUD } = React;

function HUD({ time, targetLines, currentLines, score, level, combo, nextPiece, holdPiece }) {
  const nextCanvasRef = useRefHUD(null);
  const holdCanvasRef = useRefHUD(null);

  // Dessine la prochaine pièce dans le mini-canvas
  useEffectHUD(() => {
    const cv = nextCanvasRef.current;
    if (!cv || !window.STRender) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    window.STRender.drawMiniPiece(ctx, nextPiece || null, 12);
  }, [nextPiece]);

  useEffectHUD(() => {
    const cv = holdCanvasRef.current;
    if (!cv || !window.STRender) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    window.STRender.drawMiniPiece(ctx, holdPiece || null, 12);
  }, [holdPiece]);

  const remaining = Math.max(0, (targetLines || 0) - (currentLines || 0));

  return (
    <div style={SHUD.root}>
      {/* ─── Top row : TIME / TARGET / NEXT ─── */}
      <div style={SHUD.topRow}>
        <Card label="TIME">
          <div style={SHUD.bigValue}>{formatTime(time)}</div>
        </Card>

        <Card label="TARGET" wide>
          <div style={SHUD.targetText}>
            CLEAR <span style={SHUD.targetNum}>{remaining}</span> LINES
          </div>
        </Card>

        <Card label="NEXT" tab>
          <canvas ref={nextCanvasRef} width={56} height={40} style={{ display:"block" }} />
        </Card>
      </div>

      {/* ─── Bottom row : SCORE / LEVEL / COMBO / HOLD ─── */}
      <div style={SHUD.bottomRow}>
        <MiniStat label="SCORE" value={formatNum(score)} highlight />
        <MiniStat label="LVL"   value={level || 1} />
        <MiniStat label="COMBO" value={combo > 0 ? "×" + combo : "—"} accent={combo > 0} />
        <Card label="HOLD" tab style={{ marginLeft: "auto" }}>
          <canvas ref={holdCanvasRef} width={48} height={36} style={{ display:"block" }} />
        </Card>
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────── */
function Card({ label, children, wide, tab, style }) {
  return (
    <div style={{
      ...SHUD.card,
      flex: wide ? 1 : "0 0 auto",
      ...(tab ? SHUD.cardTab : {}),
      ...style,
    }}>
      <div style={SHUD.cardLabel}>{label}</div>
      <div style={SHUD.cardBody}>{children}</div>
    </div>
  );
}

function MiniStat({ label, value, highlight, accent }) {
  return (
    <div style={{
      ...SHUD.miniStat,
      ...(highlight ? SHUD.miniStatHighlight : {}),
    }}>
      <div style={SHUD.miniLabel}>{label}</div>
      <div style={{
        ...SHUD.miniValue,
        ...(accent ? { color: "var(--gold)" } : {}),
        ...(highlight ? { color: "var(--gold)", fontSize: 18 } : {}),
      }}>{value}</div>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────────── */
function formatTime(ms) {
  const total = Math.max(0, Math.floor((ms || 0) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function formatNum(n) {
  const safe = typeof n === "number" && isFinite(n) ? n : 0;
  return safe.toLocaleString("fr-FR");
}

/* ─── Styles ─────────────────────────────────────────────────── */
const SHUD = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "calc(env(safe-area-inset-top, 0px) + 8px) 8px 8px",
  },

  topRow: {
    display: "flex",
    gap: 8,
    alignItems: "stretch",
  },

  bottomRow: {
    display: "flex",
    gap: 6,
    alignItems: "center",
  },

  card: {
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    borderRadius: 12,
    padding: "6px 10px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 0 rgba(0,0,0,0.25)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: 70,
  },
  cardTab: {
    position: "relative",
    minWidth: 60,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: 800,
    color: "var(--sky)",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  cardBody: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 24,
  },

  bigValue: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 20,
    color: "#fff",
    letterSpacing: 1,
    textShadow: "0 1px 0 rgba(0,0,0,0.4)",
  },

  targetText: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 14,
    color: "#fff",
    letterSpacing: 1,
    textAlign: "center",
    lineHeight: 1.1,
  },
  targetNum: {
    color: "var(--gold)",
    fontSize: 22,
    margin: "0 4px",
  },

  miniStat: {
    flex: "0 0 auto",
    padding: "4px 10px",
    background: "rgba(0,0,0,0.35)",
    borderRadius: 10,
    border: "1px solid rgba(124,58,237,0.4)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: 50,
  },
  miniStatHighlight: {
    background: "linear-gradient(180deg, var(--purple), var(--purple-d))",
    border: "1.5px solid var(--gold)",
  },
  miniLabel: {
    fontSize: 9,
    fontWeight: 800,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1,
  },
  miniValue: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 14,
    color: "#fff",
    lineHeight: 1.2,
  },
};

window.HUD = HUD;
