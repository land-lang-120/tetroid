/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — useGameLoop hook
   ═══════════════════════════════════════════════════════════════════
   RAF loop avec :
     - Cleanup automatique au unmount (pas de leak)
     - Pause auto quand l'app passe en arrière-plan (visibilitychange)
     - Frame skip cap : si delta time > 100ms, on ignore (évite les
       jumps de plusieurs niveaux quand l'utilisateur revient après
       avoir mis l'app en arrière-plan 3h plus tard)

   Usage :
     useGameLoop({
       active: !paused && !gameOver,
       onTick: (deltaMs) => { ... },  // appelé à chaque frame
     });

   On expose le hook sur window pour qu'il soit accessible depuis
   GameScreen.jsx (qui est aussi dans le bundle).
   ═══════════════════════════════════════════════════════════════════ */

const { useEffect: useEffectGL, useRef: useRefGL } = React;

function useGameLoop({ active, onTick }) {
  const rafRef        = useRefGL(null);
  const lastTimeRef   = useRefGL(0);
  const onTickRef     = useRefGL(onTick);
  const visiblePausedRef = useRefGL(false);

  // On garde une ref vers le callback pour éviter de redémarrer la loop
  // à chaque re-render parent.
  useEffectGL(() => { onTickRef.current = onTick; }, [onTick]);

  // Visibility pause : pas de RAF si l'app est en arrière-plan.
  useEffectGL(() => {
    const onVis = () => {
      if (document.hidden) {
        visiblePausedRef.current = true;
      } else {
        visiblePausedRef.current = false;
        // Reset lastTime pour éviter un gros delta au retour
        lastTimeRef.current = 0;
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffectGL(() => {
    if (!active) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTimeRef.current = 0;
      return;
    }

    const tick = (now) => {
      if (visiblePausedRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const last = lastTimeRef.current || now;
      let delta = now - last;
      // Frame skip cap : delta > 100ms → on cap pour éviter jumps
      if (delta > 100) delta = 100;
      lastTimeRef.current = now;

      try {
        if (typeof onTickRef.current === "function") {
          onTickRef.current(delta);
        }
      } catch (e) {
        // L'erreur ne doit pas tuer le RAF
        console.warn("[ST] useGameLoop tick error:", e);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [active]);
}

window.useGameLoop = useGameLoop;
