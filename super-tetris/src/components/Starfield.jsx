/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — Starfield helper
   ═══════════════════════════════════════════════════════════════════
   Composant décoratif réutilisable affiché en background des écrans
   (Loading, Home, GameOver, Settings…). Génère N étoiles scintillantes
   réparties aléatoirement.

   Note : on définit Starfield en GLOBAL une seule fois pour que les
   autres composants (qui le référencent par `<Starfield />`) puissent
   le résoudre sans imports.
   ═══════════════════════════════════════════════════════════════════ */

const { useState: useStateSF } = React;

window.Starfield = function Starfield({ count }) {
  const [stars] = useStateSF(() => {
    const n = count || 24;
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
    <div className="starfield" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
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
};
