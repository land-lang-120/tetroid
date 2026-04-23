# 📖 Tetroid — Cahier de charges (rétrospectif)

> Tetris arcade PWA avec boosters, monétisation et leaderboard global
> Version : 1.0 — 2026-04-23
> Voir aussi : [ARCHITECTURE.md](ARCHITECTURE.md) (vue technique) + [PROGRESS.md](PROGRESS.md) (suivi)

---

## 1. Vision

Réinventer Tetris en jeu **arcade mobile-first** avec :
- Une boucle gameplay nerveuse (chute rapide, scoring agressif)
- 4 **boosters consommables** (Freeze, Laser, Météorite, Aimant) qui changent la stratégie
- Une **progression de rang** qui débloque des bonus permanents
- Un **leaderboard mondial** (Firestore) hebdo + all-time
- Une **monétisation soft** (boutique de boosters, roue gratuite, coffres)
- Aucun téléchargement requis : PWA installable

Cible : joueurs casual mobile, sessions courtes (3-10 min), goût de la compétition leaderboard.

## 2. Personas

### 2.1 Joueur casual
- Lance le jeu pendant un trajet ou une pause
- Joue 1-3 parties, vise un nouveau best
- Utilise gratuitement la roue + coffre tous les 5 parties
- Peut acheter un pack de boosters s'il accroche

### 2.2 Whale (gros payeur)
- Joue tous les jours
- Vise le top 10 leaderboard hebdo
- Achète régulièrement les packs Premium et Ultimate
- Représente une majorité du revenu

### 2.3 Compétiteur
- Joue stratégique, optimise score
- Suit le leaderboard hebdo
- Pseudo identifiable, fierté du classement
- Achats de boosters = optimisation des runs longues

## 3. Périmètre fonctionnel (état actuel)

### 3.1 Gameplay core
- Grille 10×20 (COLS=10, ROWS=20)
- 7 pièces classiques (I, O, T, L, J, S, Z) — couleurs candy
- Système de sac : chaque pièce apparaît exactement 1× par cycle de 7
- Rotation, soft drop, hard drop, hold
- Détection de collision + lock + clear lines
- Combo & multiplier de scoring
- Vitesse base 650ms, accélération par niveau

### 3.2 Boosters (consommables)
| Booster | Effet | Tariff |
|---------|-------|--------|
| ❄️ Freeze | Ralentit la chute pendant 20 sec | Variable selon pack |
| ⚡ Laser | Rase les 4 dernières lignes | Variable |
| ☄️ Météorite | Détruit 3 briques par colonne | Variable |
| 🧲 Aimant | Fait tomber les briques suspendues | Variable |

### 3.3 Monétisation
- 4 packs de boosters :
  - **Basic** ($1.99) : 60 boosters
  - **Value** ($4.99) : 120 boosters
  - **Premium** ($9.99) : 204 boosters
  - **Ultimate** ($19.99) : 336 boosters
- **Roue de la chance** gratuite (1 spin / X heures)
- **Coffre** offert tous les 5 parties (CHEST_EVERY = 5)
- **FOMO** : compteur 5 sec après game over pour relancer avec une réduction

### 3.4 Système de rang
- 8 rangs progressifs (XP cumulé en localStorage)
- Bonus permanents au rank-up (+ boosters offerts)
- Animation rank-up : flash, bannière, feux d'artifice

### 3.5 Leaderboard global (Firestore actif)
- Collection `scores` : `{ pseudo, score, weekly, ts }`
- Vues : Weekly (7 derniers jours) + All-time
- Top 100 affiché
- Soumission après chaque game over (si pseudo défini)

### 3.6 Internationalisation (12 langues)
EN, FR, DE, ES, PT, RU, ZH, KO, AR, HI, NL, SV
- Sélection via drapeaux dans les paramètres
- Mémorisé en `tb_lang`

### 3.7 Thèmes
- Dark (défaut)
- Light
- Variables CSS isolées dans `css/variables.css`
- Mémorisé en `tb_theme`

### 3.8 Audio & Haptics
- Web Audio API : musique de fond + effets (lock, line, level-up, game over)
- Vibrations haptiques (Android) sur lock + line clear
- Kill switch musique sur `visibilitychange` + `pagehide` (correctif récent : musique qui continuait après fermeture d'onglet)
- Activable/désactivable dans les paramètres

### 3.9 Tutorial
- Tutoriel intro à la 1ère partie (`TUT_KEY = 'tb_tut_done'`)
- Bulles contextuelles in-game (1ère utilisation booster, 1er hold, etc.)

### 3.10 Social
- Partage de score : WhatsApp, Twitter, Facebook, copie de lien
- URL canonique : `https://tetroid.app`

### 3.11 PWA
- Manifest avec icônes 192/512
- Service worker avec cache versionné (`v3.x`)
- Installation prompt après quelques sessions
- Mode offline complet (sauf leaderboard)

## 4. Architecture technique (résumé)

> Voir [ARCHITECTURE.md](ARCHITECTURE.md) pour le détail complet.

- **Stack** : Vanilla JS modulaire (ES6 modules natifs, pas de bundler)
- **Style** : 13 fichiers CSS séparés par responsabilité dans `css/`
- **JS** : 23 modules ES6 dans `js/`, état central dans `state.js` (objet `S`)
- **Firebase** : import dynamique CDN dans `firebase.js`, projet `tetroid-game`
- **Storage** : 13 clés `tb_*` en localStorage
- **PWA** : `manifest.json` + `sw.js`

## 5. Charte UI

- **Background** : dégradés animés (base.css)
- **HUD** : style "bois doré" pour score/niveau/combo
- **Boosters** : style "candy" coloré
- **Modals** : overlays glassmorphism
- **Pièces** : couleurs vives sur fond sombre, ghost piece transparent

## 6. Roadmap

### ✅ Fait (V1.0 stable)
- Moteur Tetris complet
- 4 boosters
- Monétisation (packs + roue + coffre)
- Système de rangs
- Leaderboard Firestore (weekly + all-time)
- 12 langues
- Thèmes light/dark
- Audio + haptics + kill switch
- PWA installable
- Tutorial intro + bulles
- Partage social
- ARCHITECTURE.md détaillé

### 🔄 En cours
- Aucun dev actif (app stable en prod)

### 📋 À faire (priorité décroissante)
1. Sync joueur cross-device (auth + Firestore profil) — actuellement tout est en localStorage
2. Migration TypeScript (calquer recette chrome-messenger : src/, tsconfig, vite, types Zod)
3. Tests Vitest sur la logique pièces / line clear / rotation (couverture critique)
4. Audit accessibilité WCAG AA (contraste, navigation clavier, ARIA)
5. Build APK natif via Capacitor
6. Soumission Play Store
7. Page promo dans clonex-studio
8. Achievements (succès débloquables + partage)
9. Mode multijoueur asynchrone (défier un ami via lien)
10. Variantes de jeu (sprint 40 lignes, marathon, ultra 2 min)

## 7. Risques & dépendances

### Risques techniques
- **Pas de bundler** = pas de tree-shaking, mais ESM natif marche bien
- **Firebase config exposée** dans `firebase.js` — c'est OK pour Firestore avec rules strictes côté serveur
- **Import dynamique CDN Firebase** = dépendance au CDN gstatic, fallback offline si fail

### Risques métier
- **Modèle freemium** sensible aux app stores (Play Store prend 30% sur les achats in-app)
- **Leaderboard** = vecteur de cheat potentiel — prévoir validation côté Functions (V2)
- **Concurrence** : marché Tetris saturé, différenciation = boosters + leaderboard global

### Dépendances externes
- Firebase (Firestore uniquement pour le moment)
- gstatic.com (CDN Firebase SDK)
- Aucune autre dépendance runtime

## 8. Conventions code

- ES6 modules natifs (pas de bundler)
- Un fichier = une responsabilité
- État mutable centralisé dans `state.js` (objet `S`)
- Constantes en MAJUSCULES dans `config.js` (`COLS`, `ROWS`, `BASE`, `PACKS`, `WHEEL_PRIZES`)
- Functions exposées sur `window` pour les `onclick` HTML (pattern legacy mais simple)
- Préfixe localStorage : `tb_*` (pour "tetris/tetroid")
- JSDoc sur les modules + fonctions publiques
