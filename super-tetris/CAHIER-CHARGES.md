# 🎮 Super Tetris — Cahier de charges

> Jeu de puzzle Tetris avancé, réplique du Tetris officiel mobile, avec boosters, roue de la fortune, classement mondial, missions et pubs récompensées.
> Version : **0.1** — 2026-05-02 (initialisation, structure React posée)
> Studio : CloneX Studio (Joseph Pino Lando Njoua)
> Stack : **React 18** (CDN) + **Babel pré-transpilé** (pattern Byer) + **Canvas 2D** + **localStorage** + **Cloudflare Pages** (hébergement) + **Google Play Billing** (achats intégrés futurs)
> URL prod (à venir) : `https://super-tetris.pages.dev` ou `https://clonex.pages.dev/super-tetris`
> Voir aussi : `ARCHITECTURE.md` (détails techniques) · `PROGRESS.md` (suivi du dev)

---

## 0. 📊 État d'avancement (snapshot 2026-05-02 — Batch 2 terminé)

> Source de vérité unique pour répondre à "où en est-on ?".
> Mise à jour à CHAQUE batch livré (push GitHub).

### ✅ FAIT (livré + commité + push)

**Batch 1 — Structure & design tokens**
- `manifest.json` : nom "Super Tetris", theme `#0b1238`, start_url racine, categories games+puzzle
- `CAHIER-CHARGES.md` : 8 sections complètes (vision, personas, périmètre, architecture, charte visuelle, roadmap, conformité Google Play, métriques)
- `0bis. CHECKLIST SENIOR` : 13 règles audit (ghost-refs, walk-through, 3 chemins, cleanup RAF, pause/resume, frame skip, optional chaining, etc.)
- `src/styles/variables.css` : palette Tetris officielle (bleu marine + violet + arc-en-ciel + gold)
- `src/styles/global.css` : reset, body, animations (fade-in, pop-in, shake, pulse, float), classes utilitaires (.btn-3d, .card, .logo-rainbow, .starfield)

**Batch 2 — Logique de jeu pure (5 modules)**
- `src/game/pieces.js` : 7 pièces (I, O, T, S, Z, J, L) + 4 rotations chacune + tables wall-kicks SRS (JLSTZ + I)
- `src/game/bag.js` : système 7-bag (chaque pièce 1× tous les 7 tirages) + queue de 5+ pièces
- `src/game/core.js` : `createGrid`, `cloneGrid`, `collide`, `lock`, `clearLines`, `rotatePiece` (avec wall-kicks), `dropToBottom`, `isTSpin`, `isGameOver`, `spawnPiece`
- `src/game/scoring.js` : score Tetris Guideline (single/double/triple/tetris/T-spin/combo/B2B), niveau (1-20), gravité ms, XP & coins par partie
- `src/game/render.js` : canvas 2D (board, pièces 3D avec highlight + shadow, ghost piece pointillé, mini-pieces pour HUD next/hold)

### 🚧 EN COURS (Batch 3 — Premiers écrans React)

- `src/components/LoadingScreen.jsx` : splash 2-3s avec logo arc-en-ciel + barre de progression + spinner
- `src/components/HomeScreen.jsx` : trophée 3D + boutons Settings/PLAY/Stats + bandeau "NIVEAUX TRÉPIDANTS" + monnaie/rang/coins en header

### 📋 À FAIRE (batches restants)

**Batch 4 — Game UI (~45 min)**
- `src/hooks/useGameLoop.js` : RAF loop avec cleanup + visibility pause + frame skip cap (cf. checklist senior #11-13)
- `src/hooks/useStorage.js` : wrapper localStorage versionné (rétrocompat schema)
- `src/components/GameScreen.jsx` : conteneur HUD + canvas + boosters + pause modal
- `src/components/HUD.jsx` : score, niveau, combo, next, hold, target lines
- `src/components/BoosterButtons.jsx` : 4 boutons fixes (freeze, laser, meteor, magnet) avec compteur

**Batch 5 — Features metagame (~60 min)**
- `src/components/GameOverScreen.jsx` : score + classement + RÉESSAYER + bouton "Voir pub pour continuer"
- `src/components/FortuneWheel.jsx` : roue de la fortune (animation rotation, segments, récompenses)
- `src/components/RewardedAd.jsx` : wrapper pubs récompensées (stub V1, AdMob V2)
- `src/components/SettingsScreen.jsx` : son, vibration, langue, thème
- `src/components/LeaderboardScreen.jsx` : Top 100 mondial (Firebase later, mocks pour V1)
- `src/components/ShopScreen.jsx` : packs IAP (stub V1, Google Play Billing V2)

**Batch 6 — Wire-up & déploiement (~30 min)**
- `src/App.jsx` : composant racine, routing entre écrans, état global (settings, profile, currentScreen)
- `src/main.jsx` : entry point React, mount root, dispatch `super-tetris-ready`
- `build.js` : script Babel CLI pour transpiler `src/**/*.jsx + .js` → `bundle.js`
- `sw.js` : service worker (cache offline, network-first JS/CSS, cache-first assets)
- `package.json` : dépendances Babel
- Création repo GitHub `land-lang-120/super-tetris` + push initial
- Connexion Cloudflare Pages → URL `https://super-tetris.pages.dev`

**Phase suivante — Polish & QA (~3-4h)**
- Audit senior post-V1 (3 chemins testés mentalement, no ghost-refs, cleanup RAF, pause/resume)
- Ajout particules au clear de ligne (canvas overlay)
- Audio (Web Audio API : musique de fond + 8 effets sonores)
- Haptics (vibrations courtes au lock, longues au tetris)
- i18n : 12 langues (au minimum FR + EN à la sortie)
- Tests perf (Lighthouse mobile 3G, low-end Android)

**Phase suivante — Soumission Google Play**
- Génération AAB via PWABuilder
- 8 screenshots Play Store (1080x1920)
- Icône 512x512 + bannière 1024x500
- Description FR/EN + ASO keywords
- Politique de confidentialité (URL `https://clonex.pages.dev/privacy` partagée)
- Soumission Play Console (24-72h revue)

---

## 0bis. 🎯 CHECKLIST SENIOR (À RELIRE SYSTÉMATIQUEMENT)

> ⚠️ **Reprise de la checklist Byer** — la même rigueur s'applique à toutes les apps du portefeuille CloneX. Audit méticuleux, non négociable.

**Avant chaque modification structurelle :**
1. **Grep ghost-refs** : avant de supprimer une variable/state/ref/import, lancer `grep -rn "<varname>" src/` pour identifier TOUTES les références.
2. **Walk-through render path** : pour chaque écran touché, tracer mentalement chaque accès `props.*` / `state.*` ligne par ligne sur le code post-modification. Identifier les paths qui pourraient recevoir `undefined` / array vide / null.
3. **Test des 3 chemins** :
   - **(a)** 1ère ouverture (localStorage vide, pas de session, pas de score précédent)
   - **(b)** Joueur récurrent (localStorage rempli, score historique, items consommés)
   - **(c)** Edge case (offline, RAF interrompu par mise en arrière-plan, vibrate API absente)

**Avant chaque commit / push :**
4. **Lecture du diff** : `git diff --stat` puis lire chaque fichier modifié en entier. Pas de push à l'aveugle.
5. **Vérif handlers** : tout bouton/action ajouté DOIT avoir un `onClick` (ou `onTouchStart`) fonctionnel. Pas de "j'ai vu le SVG je suppose que ça marche".
6. **Audit cumulatif** : début de chaque nouvelle phase = grep + vérif que les phases précédentes tiennent toujours (boosters consommables, score persisté, etc.).

**Après chaque deploy :**
7. **Smoke test live** : `curl /bundle.js?v=N | grep -c <feature_marker>` >0 ET `grep -c <removed_var>` =0 sur le live.
8. **Tests utilisateur** : ne JAMAIS dire "prêt à tester" sans avoir mentalement simulé une partie complète sur le code post-deploy.

**Pour les data structures persistées (`localStorage`) :**
9. **Versionnage du schéma** : chaque `localStorage.getItem` accepte un format old/new (rétrocompat) ou migre automatiquement. Pas de crash si l'utilisateur a une ancienne version installée.
10. **Optional chaining systématique** sur les accès aux objets persistés (`saved?.boosters?.freeze ?? 0`, `lb?.[0]?.score || 0`).

**Pour les boucles de jeu (Canvas + RAF) :**
11. **Cleanup** : tout `requestAnimationFrame` posé doit avoir un `cancelAnimationFrame` correspondant dans le `useEffect` cleanup. Pas de double-RAF qui mange CPU.
12. **Pause / Resume** : `document.visibilitychange` doit pauser le jeu quand l'app passe en arrière-plan. Sinon batterie + score irréaliste si l'utilisateur revient 3h plus tard.
13. **Frame skip** : si le delta time dépasse 100ms, on cap (sinon une grosse glitch fait sauter 10 niveaux de difficulté).

> 💡 Cette checklist est la dette technique à payer après chaque audit foiré.
> Elle est **commune à Byer, Super Tetris, et toutes les futures apps CloneX**.

---

## 1. Vision

**Super Tetris** est la version **premium et complète** de Tetroid (existant). Reproduit fidèlement l'expérience visuelle et UX du **Tetris® officiel** distribué sur Google Play (par Playstudios), tout en intégrant des innovations propres :
- 4 boosters consommables (freeze, laser, météore, magnet)
- Roue de la fortune quotidienne
- Système de rangs (8 niveaux)
- Classement mondial Firebase
- Pubs récompensées pour relancer la partie après un game over
- Missions journalières / hebdomadaires
- 12 langues localisées

L'objectif est un produit **"polished mobile casual game"** indistinguable de l'app officielle en termes de finition graphique, déployable sur Google Play Store via PWABuilder.

---

## 2. Personas

### 2.1 Joueur casual (cible principale, 80%)
- Joue 5-15 min en transport, pause déj, soir avant dodo
- Cherche défi rapide + récompenses visuelles
- Peu enclin à l'achat, mais regarde une pub pour relancer si bon score
- Veut voir sa progression (rang, score, classement local)

### 2.2 Joueur compétitif (15%)
- Joue 30 min — 2h
- Cherche record perso + classement mondial
- Maîtrise les techniques (T-spin, hard drop, hold)
- Achète parfois des packs de boosters pour défier ses limites

### 2.3 Whale / supporter (5%)
- Achète régulièrement des packs cosmétiques + boosters
- Premium pass éventuel (V2)
- Source principale du revenu de l'app

---

## 3. Périmètre fonctionnel

### 3.1 Modes de jeu
- **Marathon** (par défaut) : niveaux 1 → 20+, vitesse croissante, score cumulé
- **Sprint** (V2) : viser X lignes en temps minimum
- **Ultra** (V2) : score max en 2 min
- **VS** (V2) : multijoueur asynchrone via Firebase

### 3.2 Mécaniques de base (parité Tetris officiel)
- 7 pièces (I, O, T, S, Z, J, L) avec couleurs canoniques
- Système de **bag** (chaque pièce apparaît 1× tous les 7 tirages)
- **Hold** (échanger la pièce courante avec une réserve, 1× par pièce)
- **Ghost piece** (silhouette d'atterrissage)
- **Hard drop** (slam) + **soft drop** (descente accélérée)
- **Rotation SRS** (Super Rotation System) avec wall-kicks
- **T-spin detection** (bonus score)

### 3.3 Boosters (consommables, conservent entre parties)
| Booster | Effet | Acquisition |
|---|---|---|
| ❄️ **Freeze** | Stop la chute pendant 3s | Roue / shop / récompense quotidienne |
| ⚡ **Laser** | Détruit la ligne courante | Roue / shop / niveau-up |
| ☄️ **Meteor** | Détruit 5 cellules aléatoires | Roue / shop |
| 🧲 **Magnet** | Attire les pièces dans les trous | Roue / shop / quête |

### 3.4 Roue de la fortune
- 1 spin gratuit toutes les 24h
- Récompenses : pièces or, boosters, multiplicateurs XP, packs cosmétiques
- Spin payant possible (50 pièces or)

### 3.5 Système de récompenses
- **Pubs récompensées** (rewarded ads) :
  - **Continue** après game over (1× par partie, +1 vie)
  - **Free booster** (1× par mode booster, toutes les 4h)
  - **Boost XP** (×2 sur la prochaine partie)
- **Missions journalières** : "Faire 5 lignes", "Atteindre 10 000 pts", etc.
- **Coffre quotidien** : ouvre tous les jours pour bonus surprise
- **Quêtes hebdo** (V2)

### 3.6 Achats intégrés (Google Play Billing)
- **Pack petit** : 100 pièces or (~0,99€)
- **Pack moyen** : 500 pièces or + 5 boosters mix (~4,99€)
- **Pack large** : 1500 pièces or + 20 boosters mix + skin (~9,99€)
- **Premium** (V2) : pas de pubs, +50% XP, skin exclusif (~19,99€)

### 3.7 Système de rangs (XP cumulé)
1. 🥉 RECRUE (0 — 1 000 XP)
2. 🥉 BRONZE (1 000 — 5 000)
3. 🥈 ARGENT (5 000 — 15 000)
4. 🥇 OR (15 000 — 50 000)
5. 💎 DIAMANT (50 000 — 150 000)
6. 💎 MAÎTRE (150 000 — 500 000)
7. 👑 LÉGENDE (500 000 — 1 000 000)
8. 👑 GRAND MAÎTRE (1 000 000+)

### 3.8 Classement mondial
- Top 100 affiché localement
- Pseudo + score + drapeau
- Stocké sur Firebase Firestore (collection `super_tetris_scores`)

---

## 4. Architecture technique

### 4.1 Stack
- **Frontend** : React 18 (CDN UMD), Babel pré-transpilé via `build.js` (pattern hérité de Byer)
- **Build** : `node build.js` → `bundle.js` (single file ES5+ pur, pas de Babel runtime)
- **Game logic** : Canvas 2D pour le rendu de la grille
- **State** : `useState` + `useReducer` React + `localStorage` pour persistence
- **Audio** : Web Audio API (Tone.js optionnel pour la musique de fond)
- **Haptics** : `navigator.vibrate()` (Android only, fallback silencieux)
- **Backend (optionnel)** : Firebase Firestore pour leaderboard mondial
- **Hébergement** : Cloudflare Pages (déploiement automatique sur push GitHub)

### 4.2 Structure des fichiers

```
super-tetris/
├── index.html             # Entry HTML (charge bundle.js)
├── manifest.json          # Manifest PWA
├── sw.js                  # Service Worker (cache offline)
├── build.js               # Script de build (Babel CLI → bundle.js)
├── package.json           # Dépendances build
├── CAHIER-CHARGES.md      # Ce fichier
├── ARCHITECTURE.md        # Détails techniques
├── PROGRESS.md            # Suivi du dev
│
├── icons/
│   ├── icon-192.svg
│   └── icon-512.svg
│
└── src/
    ├── main.jsx           # Entry point React (mount root)
    ├── App.jsx            # Composant racine (routing entre écrans)
    │
    ├── styles/
    │   ├── variables.css  # Variables CSS (couleurs, radius, ombres)
    │   └── global.css     # Reset + styles globaux + animations
    │
    ├── game/
    │   ├── pieces.js      # Définition des 7 pièces + rotation SRS
    │   ├── bag.js         # Système de sac (random shuffled)
    │   ├── core.js        # Logique : collide, lock, clearLines, tspin
    │   ├── scoring.js     # Calcul du score (single, double, T-spin, combo)
    │   └── render.js      # Dessin du canvas (grille + pièces + ghost)
    │
    ├── components/
    │   ├── LoadingScreen.jsx       # Splash 2-3s avec barre de progression
    │   ├── HomeScreen.jsx          # Trophée + PLAY + Settings + Stats
    │   ├── GameScreen.jsx          # HUD + Canvas + Boosters + Pause
    │   ├── GameOverScreen.jsx      # Score + classement + RÉESSAYER + pub continue
    │   ├── FortuneWheel.jsx        # Roue de la fortune (animation rotation)
    │   ├── ShopScreen.jsx          # Achats intégrés (packs)
    │   ├── LeaderboardScreen.jsx   # Top 100 mondial
    │   ├── SettingsScreen.jsx      # Son, vibration, langue, thème
    │   ├── BoosterButtons.jsx      # 4 boutons fixes en bas pendant le jeu
    │   ├── HUD.jsx                 # Score, niveau, combo, next, hold
    │   └── RewardedAd.jsx          # Wrapper pour pubs récompensées
    │
    ├── hooks/
    │   ├── useGameLoop.js     # RAF loop avec cleanup + visibility pause
    │   ├── useStorage.js      # Wrapper localStorage versionné
    │   ├── useAudio.js        # Lazy-load audio + mute
    │   └── useHaptic.js       # Vibrate avec fallback
    │
    └── lib/
        ├── i18n.js            # 12 langues (FR, EN, DE, ES, PT, RU, ZH, KO, AR, HI, NL, SV)
        └── analytics.js       # Plausible / Firebase Analytics (opt-in)
```

### 4.3 Stockage (localStorage)

| Clé | Contenu |
|---|---|
| `st_v` | Version du schéma (pour migrations) |
| `st_best` | Meilleur score |
| `st_xp` | XP total cumulé |
| `st_rank` | Rang actuel (calculé à partir de XP, mais cached) |
| `st_boosters` | `{freeze:N, laser:N, meteor:N, magnet:N}` |
| `st_coins` | Pièces or (monnaie virtuelle) |
| `st_wheel_last` | Timestamp du dernier spin gratuit |
| `st_chest_last` | Timestamp du dernier coffre quotidien |
| `st_missions` | `[{id, progress, claimed}]` |
| `st_settings` | `{sound:bool, vibro:bool, lang:'fr', theme:'dark'}` |
| `st_pseudo` | Pseudo pour le classement |
| `st_consents` | RGPD : consentement pubs personnalisées |

### 4.4 Flux de données React

```
App.jsx
 └── état global (currentScreen, settings, profile)
     │
     ├── LoadingScreen (mount-once)
     ├── HomeScreen (état : XP, rang, coins, boosters)
     │    └── boutons onClick → setCurrentScreen
     ├── GameScreen (état : grid, piece, score, level, paused)
     │    ├── useGameLoop()
     │    ├── BoosterButtons
     │    ├── HUD
     │    └── PauseModal
     ├── GameOverScreen (props : score, rank, gainXP, gainCoins)
     │    └── boutons : RÉESSAYER / Voir pub / Accueil
     ├── FortuneWheel (modal overlay)
     └── ShopScreen / LeaderboardScreen / SettingsScreen
```

---

## 5. Charte visuelle

### 5.1 Couleurs (cf. `variables.css`)

| Token | Usage |
|---|---|
| `--bg1` `#0b1238` | Fond principal très sombre |
| `--bg2` `#1a2a6e` | Fond cards / surfaces |
| `--purple` `#7c3aed` | Accent principal UI |
| `--gold` `#ffd23f` | Score, couronnes, monnaie |
| `--green` `#22c55e` | CTA principal (PLAY, RÉESSAYER) |
| `--piece-i/o/t/s/z/j/l` | Couleurs canoniques des 7 pièces Tetris |

### 5.2 Typographie
- **Lilita One** (titres, logo, gros boutons) — style cartoon arrondi
- **Bungee** (alternative pour effets graphiques)
- **Nunito** 700-900 (corps, UI)

### 5.3 Effets signature
- **Logo arc-en-ciel** : R rouge, T orange, R jaune, I vert, S violet — gradient text + ombre violette
- **Boutons** : gradient avec ombre `0 4px 0 rgba(0,0,0,0.25)` (style "stamped 3D")
- **Particules** : étoiles blanches scintillantes en fond pendant le jeu
- **Pièces 3D** : gradient highlight top-left → ombre bottom-right
- **Combo banner** : glissement bleu avec texte "COMBO X" depuis la gauche

### 5.4 Animations
- Splash → fade + zoom du logo
- Pièce qui se pose → flash blanc + particules
- Ligne complétée → flash + slide + reset
- Game over → shake écran + zoom out + fade out
- Boost activé → glow autour du bouton + screen flash

---

## 6. Roadmap MVP → Prod

### MVP V1 (cible : 5 jours de dev intense)
- ✅ Structure React + Babel build (squelette)
- ⏳ LoadingScreen + HomeScreen
- ⏳ GameScreen (canvas + game loop + 7 pièces + clearLines + score)
- ⏳ GameOverScreen
- ⏳ HUD complet
- ⏳ Boosters (4 pouvoirs)
- ⏳ FortuneWheel (modal + animation)
- ⏳ Settings (son/vibro/langue/thème)
- ⏳ Stats persistées (localStorage)
- ⏳ Pubs récompensées (intégration Google AdMob via webview ou test mode pour V1)
- ⏳ i18n FR + EN
- ⏳ Soumission Google Play Store

### V2 (post-launch, +30 jours)
- Mode Sprint, Ultra
- Leaderboard mondial Firebase
- Premium pass (sans pubs)
- 10 langues additionnelles
- Système de quêtes hebdomadaires
- Skins de pièces (cosmétiques)
- Mode VS asynchrone

### V3 (long terme)
- Multiplayer temps réel
- Tournoi avec récompenses cash
- Discord/Twitch integration
- Saisons (rangs réinitialisés tous les 3 mois)

---

## 7. Conformité Google Play

### 7.1 Politique de confidentialité
- Page partagée avec les autres apps : `https://clonex.pages.dev/privacy`
- Mentionner : analytics, AdMob, Firebase Auth (futur), localStorage

### 7.2 Achats intégrés
- Utiliser **Google Play Billing API** (V2 obligatoire)
- Lister chaque pack dans Play Console → In-app products
- Implémenter validation côté serveur (Edge Function future)

### 7.3 Pubs (AdMob)
- ID app AdMob à créer
- Bannières limitées (pas pendant la partie)
- Rewarded ads obligatoire (continue, free booster, boost XP)
- Conformité COPPA (pas d'apps pour enfants <13 ans)

### 7.4 Classification du contenu
- **PEGI 3** / **ESRB E** (Everyone)
- Aucun contenu violent, sexuel, ou drogues

---

## 8. Métriques de succès (post-launch)

| Métrique | Cible J+30 |
|---|---|
| DAU (utilisateurs quotidiens) | 1 000 |
| Sessions / utilisateur / jour | 3+ |
| Durée moyenne de session | 8 min |
| D1 retention | 40%+ |
| D7 retention | 20%+ |
| Note Play Store | 4.4+ ⭐ |
| Conversion ad rewarded | 30%+ |
| Conversion achat IAP | 1.5%+ |

---

_Cette app fait partie de **CloneX Studio**. Voir aussi : [Byer](../byer/CAHIER-CHARGES.md), [Tetroid](../tetroid-pro/), [Switchr](?), [SecretNote](?), [DailyNote](?)._
