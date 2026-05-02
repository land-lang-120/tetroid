/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — RewardedAd
   ═══════════════════════════════════════════════════════════════════
   Stub V1 pour les pubs récompensées.
   En V1 : on simule avec un compteur 5s + bouton "Skip" désactivé.
   En V2 : on intégrera AdMob (via Capacitor ou WebView native).

   API attendue :
     <RewardedAd
       reward={{ type: "continue" }}    // ou { type: "booster", id: "freeze" }
       onComplete={() => ...}
       onSkip={() => ...}                // si V1 dev mode permet de skip
     />

   En production, après l'intégration AdMob, on remplace cette stub par :
     - Appel à AdMob.showRewardedAd()
     - Listen pour onRewardEarned
     - Fallback: si pas de pub disponible, on peut donner la reward "free"
       1 fois/jour pour pas frustrer l'utilisateur.
   ═══════════════════════════════════════════════════════════════════ */

const { useState: useStateRA, useEffect: useEffectRA } = React;

function RewardedAd({ reward, onComplete, onSkip, durationSec }) {
  const total = durationSec || 5;
  const [remaining, setRemaining] = useStateRA(total);

  useEffectRA(() => {
    if (remaining <= 0) {
      if (typeof onComplete === "function") onComplete();
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, onComplete]);

  const rewardLabel = describeReward(reward);

  return (
    <div style={SRA.root}>
      <div style={SRA.card}>
        <div style={SRA.adLabel}>📺 PUBLICITÉ</div>

        <div style={SRA.preview}>
          <div style={SRA.previewIcon}>🎮</div>
          <div style={SRA.previewText}>
            Découvre d'autres jeux CloneX Studio
          </div>
        </div>

        <div style={SRA.timer}>
          {remaining > 0 ? (
            <>Récompense dans <strong>{remaining}s</strong>…</>
          ) : (
            <>✅ Récompense débloquée !</>
          )}
        </div>

        <div style={SRA.rewardBox}>
          <span style={{ fontSize: 24 }}>🎁</span>
          <span style={{ marginLeft: 8 }}>{rewardLabel}</span>
        </div>

        {/* Skip uniquement disponible si la session permet (V1 : oui) */}
        {typeof onSkip === "function" && remaining > 0 && (
          <button
            style={SRA.skipBtn}
            onClick={onSkip}
          >
            Passer la pub
          </button>
        )}
      </div>
    </div>
  );
}

function describeReward(reward) {
  if (!reward) return "Récompense surprise !";
  if (reward.type === "continue") return "Continuer la partie";
  if (reward.type === "booster") return "+1 booster " + (reward.id || "");
  if (reward.type === "coins")   return "+" + (reward.amount || 0) + " pièces";
  if (reward.type === "xp")      return "Boost XP ×2 prochaine partie";
  return "Récompense !";
}

const SRA = {
  root: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.92)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 500,
    padding: 20,
  },
  card: {
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "2px solid var(--purple)",
    borderRadius: 18,
    padding: 24,
    width: "100%",
    maxWidth: 360,
    boxShadow: "0 12px 32px rgba(0,0,0,0.6)",
  },
  adLabel: {
    fontSize: 11,
    fontWeight: 800,
    color: "var(--orange)",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 16,
  },
  preview: {
    background: "linear-gradient(135deg, #5b21b6, #1e40af, #7c3aed)",
    borderRadius: 14,
    padding: "32px 16px",
    textAlign: "center",
    marginBottom: 16,
  },
  previewIcon: { fontSize: 60, marginBottom: 8 },
  previewText: { fontSize: 14, color: "#fff", fontWeight: 700 },
  timer: {
    textAlign: "center",
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    marginBottom: 16,
  },
  rewardBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,210,63,0.15)",
    border: "1.5px solid var(--gold)",
    borderRadius: 12,
    padding: "10px 16px",
    marginBottom: 12,
    color: "var(--gold)",
    fontWeight: 700,
  },
  skipBtn: {
    width: "100%",
    padding: "10px 16px",
    background: "transparent",
    border: "1.5px solid rgba(255,255,255,0.3)",
    borderRadius: 12,
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    fontWeight: 700,
  },
};

window.RewardedAd = RewardedAd;
