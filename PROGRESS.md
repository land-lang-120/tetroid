# 📊 tetroid — Suivi

> Voir aussi : [CAHIER-CHARGES.md](CAHIER-CHARGES.md) (vision/spec) + [ARCHITECTURE.md](ARCHITECTURE.md) (technique)
> Mis à jour : **2026-04-23**

| | |
|---|---|
| **Stack** | Vanilla JS modulaire (ES6), Web Audio, Firebase Firestore, PWA |
| **Statut** | 🟢 Prod (v1.0 stable) |
| **Plateformes** | Web (PWA installable) — APK Play Store en attente |
| **Repo** | github.com/land-lang-120/tetroid |
| **URL** | https://tetroid.app |

---

## ✅ Fait

### Gameplay
- Moteur Tetris complet : pièces (sac), rotation, lock, line clear, scoring, combo
- Hold piece + Ghost piece
- 4 boosters consommables : Freeze (-vitesse 20s), Laser (4 lignes), Météorite (3 par col), Aimant
- Système de rangs (8 niveaux, XP cumulé, bonus permanents)
- Animation level-up (flash, bannière, feux d'artifice)

### Monétisation
- 4 packs boosters (Basic $1.99 / Value $4.99 / Premium $9.99 / Ultimate $19.99)
- Roue de la chance gratuite
- Coffre offert tous les 5 parties
- FOMO compteur 5s post-game-over

### Multimédia
- 12 langues i18n (EN, FR, DE, ES, PT, RU, ZH, KO, AR, HI, NL, SV)
- Thèmes light/dark (variables CSS)
- Web Audio API : musique + effets
- Vibrations haptiques Android
- **Kill switch musique sur visibilitychange + pagehide** (correctif récent : musique qui continuait après fermeture)

### Cloud (Firebase)
- Firebase Firestore intégré et **actif** dans `js/firebase.js`
- Projet `tetroid-game` configuré
- Collection `scores` : `{ pseudo, score, weekly, ts }`
- Leaderboard global all-time + weekly (top 100)
- Soumission auto post-game-over si pseudo défini
- Fallback offline si Firebase indisponible

### Plateforme
- PWA installable (manifest + service worker avec versioning cache `v3.x`)
- Mode offline complet (sauf leaderboard)
- Multipliers booster packs (×2, ×3) — ajustement gameplay récent

### Documentation
- ARCHITECTURE.md détaillé (structure dossiers, flux données, modules)
- CAHIER-CHARGES.md rétrospectif (vision, personas, périmètre, roadmap)

## 🔄 En cours

- Aucun dev actif (app stable en prod)

## 📋 À faire

### Court terme
1. ~~Créer `CAHIER-CHARGES.md` rétrospectif~~ ← fait dans cette session
2. **Sync joueur cross-device** (Firebase Auth anonyme + Firestore `users/{uid}` pour synchroniser XP, boosters, settings entre appareils)

### Moyen terme
3. Migration TypeScript (calquer la recette chrome-messenger : src/, tsconfig, vite, types Zod)
4. Tests Vitest sur la logique critique : pieces.js (sac), core.js (rotate/collide/lock/clearLines)
5. Audit accessibilité WCAG AA (contraste, navigation clavier, ARIA)
6. Validation server-side du score via Cloud Function (anti-cheat leaderboard)
7. Build APK natif via Capacitor (recette chrome-messenger applicable)

### Long terme
8. Soumission Play Store (Android)
9. Page promo dans clonex-studio
10. Achievements (succès débloquables + partage)
11. Mode multijoueur asynchrone (défier un ami via lien)
12. Variantes de jeu (sprint 40 lignes, marathon, ultra 2 min)
13. iOS via Capacitor (App Store)
