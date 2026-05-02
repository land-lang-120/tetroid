/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — BoosterButtons
   ═══════════════════════════════════════════════════════════════════
   Barre fixe en bas de l'écran de jeu avec les 4 boosters consommables :
     - ❄️ Freeze : stop la chute pendant 3s
     - ⚡ Laser  : détruit la ligne courante
     - ☄️ Meteor : détruit 5 cellules aléatoires
     - 🧲 Magnet : attire les pièces dans les trous

   Chaque bouton affiche le compteur restant. Si compteur = 0,
   le bouton est grisé avec un "+" pour acheter (V2 → ouvre shop).

   Props:
     - inventory: { freeze, laser, meteor, magnet } (compteurs)
     - cooldowns: { freeze, laser, meteor, magnet } (ms restants si en cooldown)
     - onUse(boosterId): callback quand l'utilisateur active
     - onBuy(boosterId): callback quand le compteur est à 0 (V2)
     - disabled: bool (game pause / over)
   ═══════════════════════════════════════════════════════════════════ */

const BOOSTERS = [
  { id: "freeze", icon: "❄️", color: "#06b6d4", label: "Freeze" },
  { id: "laser",  icon: "⚡", color: "#facc15", label: "Laser"  },
  { id: "meteor", icon: "☄️", color: "#f97316", label: "Meteor" },
  { id: "magnet", icon: "🧲", color: "#ec4899", label: "Magnet" },
];

function BoosterButtons({ inventory, cooldowns, onUse, onBuy, disabled }) {
  const inv = inventory || {};
  const cd = cooldowns || {};

  return (
    <div style={SBB.root}>
      {BOOSTERS.map((b) => {
        const count    = inv[b.id] ?? 0;
        const cooldown = cd[b.id] ?? 0;
        const empty    = count <= 0;
        const onCD     = cooldown > 0;
        const isDisabled = !!disabled || (empty && !onBuy) || onCD;

        return (
          <button
            key={b.id}
            onClick={() => {
              if (disabled) return;
              if (onCD) return;
              if (empty) {
                if (typeof onBuy === "function") onBuy(b.id);
              } else {
                if (typeof onUse === "function") onUse(b.id);
              }
            }}
            disabled={isDisabled && !empty}  // empty mais shop possible : pas disabled
            style={{
              ...SBB.btn,
              opacity: (disabled || onCD) ? 0.4 : 1,
              cursor: isDisabled && !empty ? "not-allowed" : "pointer",
              borderColor: empty ? "rgba(255,255,255,0.2)" : b.color,
              boxShadow: empty
                ? "0 4px 0 rgba(0,0,0,0.25)"
                : `0 4px 0 ${shade(b.color, -30)}, 0 0 12px ${alpha(b.color, 0.4)}`,
              background: empty
                ? "linear-gradient(180deg, var(--bg2), var(--bg1))"
                : `linear-gradient(180deg, ${alpha(b.color, 0.85)}, ${shade(b.color, -20)})`,
            }}
            aria-label={b.label + " booster"}
          >
            {/* Icon */}
            <span style={{
              ...SBB.icon,
              filter: empty ? "grayscale(0.7)" : "none",
            }}>{b.icon}</span>

            {/* Compteur OU bouton + */}
            {empty ? (
              <span style={SBB.plus}>+</span>
            ) : (
              <span style={SBB.count}>{count}</span>
            )}

            {/* Cooldown overlay */}
            {onCD && (
              <span style={SBB.cdOverlay}>
                {Math.ceil(cooldown / 1000)}s
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Helpers couleur ─────────────────────────────────────────── */
function alpha(hex, a) {
  // hex (#rrggbb ou #rgb) → rgba(...)
  if (!hex || hex[0] !== "#") return `rgba(124,58,237,${a})`;
  let h = hex.slice(1);
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const r = parseInt(h.slice(0,2), 16);
  const g = parseInt(h.slice(2,4), 16);
  const b = parseInt(h.slice(4,6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function shade(hex, amount) {
  // Décale le hex de `amount` (-100..+100). Négatif = plus sombre.
  if (!hex || hex[0] !== "#") return hex;
  let h = hex.slice(1);
  if (h.length === 3) h = h.split("").map(c => c + c).join("");
  const r = clamp(parseInt(h.slice(0,2), 16) + amount, 0, 255);
  const g = clamp(parseInt(h.slice(2,4), 16) + amount, 0, 255);
  const b = clamp(parseInt(h.slice(4,6), 16) + amount, 0, 255);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
function toHex(n) { return n.toString(16).padStart(2, "0"); }

const SBB = {
  root: {
    display: "flex",
    gap: 8,
    padding: "10px 12px calc(env(safe-area-inset-bottom, 0px) + 10px)",
    justifyContent: "space-between",
    background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.4))",
  },
  btn: {
    flex: 1,
    height: 60,
    minWidth: 60,
    borderRadius: 16,
    border: "2px solid",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Lilita One', cursive",
    color: "#fff",
    position: "relative",
    transition: "transform 0.08s ease, box-shadow 0.08s ease",
  },
  icon: {
    fontSize: 26,
    lineHeight: 1,
    filter: "drop-shadow(0 2px 0 rgba(0,0,0,0.3))",
  },
  count: {
    fontSize: 13,
    color: "#fff",
    textShadow: "0 1px 0 rgba(0,0,0,0.4)",
    marginTop: 2,
    fontWeight: 800,
  },
  plus: {
    fontSize: 18,
    color: "var(--gold)",
    marginTop: 2,
    fontWeight: 800,
  },
  cdOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    color: "#fff",
    fontWeight: 800,
  },
};

window.BoosterButtons = BoosterButtons;
