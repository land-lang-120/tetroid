/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — App (composant racine)
   ═══════════════════════════════════════════════════════════════════
   Orchestre :
     - Routing entre écrans (loading / home / game / gameover / wheel /
       settings / shop / leaderboard)
     - État global persisté (settings + profile via useStorage)
     - Logique de récompense (XP/coins/boosters gagnés à chaque partie)
     - Application du thème (body class .light)
     - Boucle de vie : LoadingScreen au boot puis HomeScreen une fois prêt

   Source de vérité unique pour :
     - settings : { sound, vibro, lang, theme }
     - profile  : { coins, xp, bestScore, boosters, wheelLastFree }

   Tout descendant lit ces 2 objets en props (read-only) et muteurs via
   onChange / onProfileChange. Pas de localStorage direct dans les
   composants enfants — règle senior #1 (source unique de vérité).
   ═══════════════════════════════════════════════════════════════════ */

const { useState: useStateApp, useEffect: useEffectApp, useCallback: useCallbackApp } = React;

const DEFAULT_PROFILE = {
  coins: 100,            // bonus de bienvenue
  xp: 0,
  bestScore: 0,
  boosters: { freeze: 1, laser: 1, meteor: 0, magnet: 0 }, // pack starter
  wheelLastFree: 0,      // timestamp dernier spin gratuit
  totalGames: 0,
};

const DEFAULT_SETTINGS = {
  sound: true,
  vibro: true,
  lang: "fr",
  theme: "dark",
};

function App() {
  // Routing : loading -> home -> game -> gameover -> ...
  const [screen, setScreen]       = useStateApp("loading");
  const [profile, setProfile]     = window.useStorage("st_profile", DEFAULT_PROFILE);
  const [settings, setSettings]   = window.useStorage("st_settings", DEFAULT_SETTINGS);
  const [lastResult, setLastResult] = useStateApp(null); // résultat de la dernière partie

  // Applique le thème en ajoutant/retirant body.light
  useEffectApp(() => {
    if (settings && settings.theme === "light") {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
  }, [settings && settings.theme]);

  // Notifie le HTML loader qu'on est prêt (fade out splash)
  useEffectApp(() => {
    try { window.dispatchEvent(new Event("super-tetris-ready")); } catch (_) {}
  }, []);

  // ─── Handlers ────────────────────────────────────────────────
  const navigate = useCallbackApp((target) => {
    setScreen(target);
  }, []);

  const handleGameOver = useCallbackApp((result) => {
    // Met à jour profile : best score, XP, coins, totalGames
    setProfile((prev) => {
      const p = prev || DEFAULT_PROFILE;
      const score = (result && result.score) || 0;
      const xpGain = (result && result.xpGain) || 0;
      const coinsGain = (result && result.coinsGain) || 0;
      return {
        ...p,
        bestScore: Math.max(p.bestScore || 0, score),
        xp: (p.xp || 0) + xpGain,
        coins: (p.coins || 0) + coinsGain,
        totalGames: (p.totalGames || 0) + 1,
      };
    });
    setLastResult(result);
    setScreen("gameover");
  }, [setProfile]);

  const handleRetry = useCallbackApp(() => {
    setLastResult(null);
    setScreen("game");
  }, []);

  const handleHome = useCallbackApp(() => {
    setLastResult(null);
    setScreen("home");
  }, []);

  const handleWheelReward = useCallbackApp(({ isFree, segment, reward }) => {
    if (!reward) return;
    setProfile((prev) => {
      const p = prev || DEFAULT_PROFILE;
      const next = { ...p };
      if (isFree) {
        next.wheelLastFree = Date.now();
      } else {
        next.coins = Math.max(0, (p.coins || 0) - 50); // coût spin payant
      }
      if (reward.coins) {
        next.coins = (next.coins || 0) + reward.coins;
      }
      if (reward.boosters) {
        next.boosters = { ...((p.boosters) || {}) };
        Object.keys(reward.boosters).forEach((k) => {
          next.boosters[k] = (next.boosters[k] || 0) + reward.boosters[k];
        });
      }
      return next;
    });
  }, [setProfile]);

  const handleResetData = useCallbackApp(() => {
    if (window.confirm("Confirmer la suppression de toutes vos données ? (score, XP, coins, boosters seront remis à zéro)")) {
      setProfile(DEFAULT_PROFILE);
      setSettings(DEFAULT_SETTINGS);
      setScreen("home");
    }
  }, [setProfile, setSettings]);

  // ─── Rendu de l'écran courant ────────────────────────────────
  let content;
  if (screen === "loading") {
    content = (
      <window.LoadingScreen
        onDone={() => setScreen("home")}
        minDurationMs={1800}
      />
    );
  } else if (screen === "home") {
    content = (
      <window.HomeScreen
        profile={profile}
        onNavigate={navigate}
      />
    );
  } else if (screen === "game") {
    content = (
      <window.GameScreen
        profile={profile}
        onProfileChange={setProfile}
        onGameOver={handleGameOver}
        onExitToHome={handleHome}
      />
    );
  } else if (screen === "gameover") {
    content = (
      <window.GameOverScreen
        result={lastResult}
        profile={profile}
        onRetry={handleRetry}
        onHome={handleHome}
        onContinueWithAd={() => {
          // V1 stub : on simule une pub puis donne +1 vie (= retry sans reset)
          window.alert("📺 Pub regardée ! Bonus continue débloqué.");
          setScreen("game");
        }}
      />
    );
  } else if (screen === "wheel") {
    content = (
      <window.FortuneWheel
        profile={profile}
        onClose={handleHome}
        onReward={handleWheelReward}
      />
    );
  } else if (screen === "settings") {
    content = (
      <window.SettingsScreen
        settings={settings}
        onChange={setSettings}
        onClose={handleHome}
        onReset={handleResetData}
      />
    );
  } else if (screen === "stats" || screen === "shop") {
    // V2 : LeaderboardScreen + ShopScreen
    content = (
      <ComingSoon
        title={screen === "stats" ? "Classement" : "Boutique"}
        onBack={handleHome}
      />
    );
  } else {
    // Fallback de sécurité
    content = (
      <ComingSoon
        title="Écran inconnu"
        onBack={handleHome}
      />
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {content}
    </div>
  );
}

/* ─── Placeholder pour les écrans V2 ─────────────────────────── */
function ComingSoon({ title, onBack }) {
  return (
    <div style={{
      position: "absolute",
      inset: 0,
      background: "radial-gradient(ellipse at top, #1a2a6e, #0b1238 70%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      textAlign: "center",
    }}>
      <div style={{ fontSize: 80, marginBottom: 16 }}>🚧</div>
      <h1 style={{
        fontFamily: "'Lilita One', cursive",
        fontSize: 36,
        color: "#fff",
        marginBottom: 8,
        letterSpacing: 1,
        textShadow: "0 3px 0 rgba(0,0,0,0.4)",
      }}>{title}</h1>
      <p style={{
        color: "rgba(255,255,255,0.6)",
        fontSize: 14,
        marginBottom: 32,
        maxWidth: 320,
        lineHeight: 1.5,
      }}>
        Cette section arrive bientôt dans la prochaine mise à jour.
      </p>
      <button className="btn-3d purple" onClick={onBack}>Retour</button>
    </div>
  );
}

window.App = App;
