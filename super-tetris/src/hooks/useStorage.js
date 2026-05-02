/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — useStorage hook
   ═══════════════════════════════════════════════════════════════════
   Wrapper localStorage versionné pour :
     - Lire/écrire de manière typée (avec defaults)
     - Gérer les erreurs (private mode, storage plein, etc.)
     - Versionner le schéma (st_v) pour migrations futures

   Cf. checklist senior #9 : "Versionnage du schéma" + "Optional chaining
   systématique sur les accès aux objets persistés".

   Usage :
     const [coins, setCoins] = useStorage("st_coins", 0);
     const [profile, setProfile] = useStorage("st_profile",
       { xp:0, bestScore:0, boosters:{} });
   ═══════════════════════════════════════════════════════════════════ */

const { useState: useStateST, useEffect: useEffectST, useCallback: useCallbackST } = React;

const SCHEMA_VERSION = 1;

// Cache mémoire pour éviter les reads répétés
const memCache = {};

function safeRead(key, defaultValue) {
  try {
    if (key in memCache) return memCache[key];
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    const parsed = JSON.parse(raw);
    memCache[key] = parsed;
    return parsed;
  } catch (e) {
    console.warn("[ST] safeRead failed for", key, e);
    return defaultValue;
  }
}

function safeWrite(key, value) {
  try {
    memCache[key] = value;
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    // QuotaExceededError, SecurityError, private mode...
    console.warn("[ST] safeWrite failed for", key, e);
    return false;
  }
}

/**
 * Hook React qui retourne [value, setValue] backed by localStorage.
 * @param key string
 * @param defaultValue any
 */
function useStorage(key, defaultValue) {
  const [value, setValue] = useStateST(() => safeRead(key, defaultValue));

  const setAndPersist = useCallbackST((next) => {
    setValue((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      safeWrite(key, resolved);
      return resolved;
    });
  }, [key]);

  return [value, setAndPersist];
}

/**
 * Initialise le schéma : pose la version courante si jamais set.
 */
function ensureSchema() {
  try {
    const v = localStorage.getItem("st_v");
    if (!v) {
      localStorage.setItem("st_v", String(SCHEMA_VERSION));
    } else {
      const num = parseInt(v, 10);
      if (num < SCHEMA_VERSION) {
        // Migrations futures à coder ici
        localStorage.setItem("st_v", String(SCHEMA_VERSION));
      }
    }
  } catch (_) {}
}
ensureSchema();

window.useStorage = useStorage;
window.STStorage = {
  read: safeRead,
  write: safeWrite,
  SCHEMA_VERSION: SCHEMA_VERSION,
};
