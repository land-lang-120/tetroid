/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — SettingsScreen
   ═══════════════════════════════════════════════════════════════════
   Écran paramètres avec :
     - Son (toggle on/off)
     - Vibration (toggle on/off)
     - Langue (FR / EN, dropdown — extensible à 12 langues V2)
     - Thème (sombre / clair)
     - Reset des données (avec double confirmation)
     - Crédits & version

   Props :
     - settings : { sound, vibro, lang, theme }
     - onChange : (next) => void
     - onClose  : () => void
     - onReset  : () => void  (clear localStorage)
   ═══════════════════════════════════════════════════════════════════ */

const { useState: useStateSS } = React;

function SettingsScreen({ settings, onChange, onClose, onReset }) {
  const s = settings || { sound: true, vibro: true, lang: "fr", theme: "dark" };
  const [confirmReset, setConfirmReset] = useStateSS(false);

  function update(patch) {
    if (typeof onChange === "function") {
      onChange({ ...s, ...patch });
    }
  }

  return (
    <div style={SS.root}>
      <Starfield count={16} />

      {/* Header */}
      <div style={SS.header}>
        <button onClick={onClose} style={SS.backBtn} aria-label="Retour">←</button>
        <div style={SS.title}>Paramètres</div>
        <div style={{ width: 40 }} /> {/* spacer */}
      </div>

      <div style={SS.content}>
        {/* Audio & haptics */}
        <Section title="Audio & vibration">
          <Row
            label="Son"
            description="Effets sonores et musique"
            control={
              <Toggle on={s.sound} onChange={(v) => update({ sound: v })} />
            }
          />
          <Row
            label="Vibration"
            description="Retour haptique sur Android"
            control={
              <Toggle on={s.vibro} onChange={(v) => update({ vibro: v })} />
            }
          />
        </Section>

        {/* Apparence */}
        <Section title="Apparence">
          <Row
            label="Thème"
            control={
              <SegmentedControl
                value={s.theme}
                options={[
                  { id: "dark",  label: "🌙 Sombre" },
                  { id: "light", label: "☀️ Clair" },
                ]}
                onChange={(v) => update({ theme: v })}
              />
            }
          />
          <Row
            label="Langue"
            control={
              <select
                style={SS.select}
                value={s.lang}
                onChange={(e) => update({ lang: e.target.value })}
              >
                <option value="fr">🇫🇷 Français</option>
                <option value="en">🇬🇧 English</option>
                {/* V2 : ajouter 10 langues additionnelles */}
              </select>
            }
          />
        </Section>

        {/* Données */}
        <Section title="Données">
          <button
            style={SS.dangerBtn}
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true);
                return;
              }
              if (typeof onReset === "function") onReset();
              setConfirmReset(false);
            }}
          >
            {confirmReset
              ? "⚠️ Vraiment effacer ? Cliquez une 2ᵉ fois"
              : "Réinitialiser tout (score, XP, boosters, coins)"}
          </button>
          {confirmReset && (
            <button style={SS.cancelBtn} onClick={() => setConfirmReset(false)}>
              Annuler
            </button>
          )}
        </Section>

        {/* À propos */}
        <Section title="À propos">
          <Row label="Version" value="0.1.0" />
          <Row label="Studio"  value="CloneX Studio" />
          <Row label="Contact" value={
            <a href="mailto:pinolando120@gmail.com" style={SS.link}>
              pinolando120@gmail.com
            </a>
          } />
          <Row label="Confidentialité" value={
            <a href="https://clonex.pages.dev/privacy" target="_blank" rel="noopener noreferrer" style={SS.link}>
              clonex.pages.dev/privacy
            </a>
          } />
        </Section>
      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────── */
function Section({ title, children }) {
  return (
    <div style={SS.section}>
      <div style={SS.sectionTitle}>{title}</div>
      <div style={SS.sectionBody}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, description, value, control }) {
  return (
    <div style={SS.row}>
      <div style={SS.rowLabelWrap}>
        <span style={SS.rowLabel}>{label}</span>
        {description && <span style={SS.rowDesc}>{description}</span>}
      </div>
      {value && <span style={SS.rowValue}>{value}</span>}
      {control}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        ...SS.toggle,
        background: on ? "var(--green)" : "rgba(255,255,255,0.15)",
      }}
      role="switch"
      aria-checked={!!on}
    >
      <span style={{
        ...SS.toggleKnob,
        transform: on ? "translateX(20px)" : "translateX(0)",
      }} />
    </button>
  );
}

function SegmentedControl({ value, options, onChange }) {
  return (
    <div style={SS.segmented}>
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          style={{
            ...SS.segBtn,
            ...(value === opt.id ? SS.segBtnActive : {}),
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const SS = {
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
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    border: "1.5px solid var(--purple)",
    fontSize: 22,
    color: "#fff",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 3px 0 rgba(0,0,0,0.25)",
  },
  title: {
    fontFamily: "'Lilita One', cursive",
    fontSize: 22,
    color: "#fff",
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 16px calc(env(safe-area-inset-bottom, 0px) + 24px)",
  },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 800,
    color: "var(--sky)",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingLeft: 4,
  },
  sectionBody: {
    background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
    borderRadius: 14,
    border: "1.5px solid rgba(124,58,237,0.4)",
    overflow: "hidden",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  },

  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    gap: 12,
  },
  rowLabelWrap: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontSize: 14,
    color: "#fff",
    fontWeight: 700,
  },
  rowDesc: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  rowValue: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  link: { color: "var(--sky)", textDecoration: "underline" },

  toggle: {
    width: 48,
    height: 26,
    borderRadius: 100,
    border: "none",
    position: "relative",
    cursor: "pointer",
    transition: "background 0.2s",
    padding: 3,
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)",
  },
  toggleKnob: {
    width: 20,
    height: 20,
    background: "#fff",
    borderRadius: "50%",
    transition: "transform 0.2s",
    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
    display: "block",
  },

  segmented: {
    display: "flex",
    background: "rgba(0,0,0,0.3)",
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  segBtn: {
    padding: "6px 14px",
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: 700,
    borderRadius: 8,
    transition: "all 0.15s",
  },
  segBtnActive: {
    background: "var(--purple)",
    color: "#fff",
    boxShadow: "0 2px 0 var(--purple-d)",
  },

  select: {
    background: "var(--bg1)",
    color: "#fff",
    border: "1.5px solid var(--purple)",
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 13,
    fontFamily: "inherit",
    fontWeight: 700,
    cursor: "pointer",
  },

  dangerBtn: {
    width: "100%",
    padding: "14px 16px",
    background: "linear-gradient(180deg, var(--red), #b91c1c)",
    color: "#fff",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 800,
    boxShadow: "0 4px 0 #7f1d1d, inset 0 1px 0 rgba(255,255,255,0.2)",
  },
  cancelBtn: {
    width: "100%",
    padding: "10px 16px",
    background: "transparent",
    border: "1.5px solid rgba(255,255,255,0.2)",
    color: "rgba(255,255,255,0.7)",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 700,
    marginTop: 8,
  },
};

window.SettingsScreen = SettingsScreen;
