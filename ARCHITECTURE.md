# TETROID — Architecture & Guide de Maintenance

## Vue d'ensemble

Tetroid est un jeu Tetris arcade PWA avec une architecture **multi-fichiers modulaire**.

```
tetroid/
├── index.html            # Squelette HTML (structure uniquement)
├── manifest.json         # Manifeste PWA
├── sw.js                 # Service Worker (cache offline)
├── ARCHITECTURE.md       # Ce fichier
│
├── css/                  # Styles separes par responsabilite
│   ├── variables.css     # Variables CSS (:root, themes clair/sombre)
│   ├── base.css          # Reset, body, backgrounds animes
│   ├── loading.css       # Ecran de chargement
│   ├── hud.css           # Barre score/niveau/combo (style bois dore)
│   ├── canvas.css        # Zone de jeu, pause, shop buttons
│   ├── boosters.css      # 4 boutons boosters (candy style)
│   ├── overlays.css      # Modals generiques (start, gameover, FOMO)
│   ├── rank.css          # Barre de rang/XP + modal rank-up
│   ├── leaderboard.css   # Classement mondial
│   ├── settings.css      # Menu pause + panneau parametres
│   ├── tutorial.css      # Tutorial intro + bulles in-game
│   ├── monetization.css  # Shop, roue, pub, coffre
│   └── social.css        # Boutons de partage (WhatsApp, etc.)
│
├── js/                   # Modules ES6 (import/export)
│   ├── main.js           # Point d'entree — imports + init + window bindings
│   ├── config.js         # Constantes : pieces, couleurs, vitesses, packs
│   ├── state.js          # Etat central du jeu (objet S)
│   ├── firebase.js       # Firebase Firestore (CDN, optionnel)
│   ├── pieces.js         # Systeme de sac + generation de pieces
│   ├── core.js           # Mecaniques : rotate, collide, lock, clearLines
│   ├── rendering.js      # Rendu canvas : grille, pieces, ghost, cellules
│   ├── particles.js      # Systeme de particules + explosions
│   ├── game-loop.js      # Boucle principale (requestAnimationFrame)
│   ├── input.js          # Gestion tactile + clavier
│   ├── boosters.js       # 4 pouvoirs : freeze, laser, meteor, magnet
│   ├── level-up.js       # Animation level-up (flash, banniere, feux d'artifice)
│   ├── rank.js           # 8 rangs, XP, rank-up
│   ├── hud.js            # Mise a jour interface (score, combo, toast)
│   ├── game-flow.js      # Flux : init, start, end, pause, FOMO
│   ├── settings.js       # Chargement/sauvegarde parametres
│   ├── audio.js          # Web Audio API : musique + effets sonores
│   ├── haptics.js        # Vibrations haptiques
│   ├── translations.js   # 12 langues (EN, FR, DE, ES, PT, RU, ZH, KO, AR, HI, NL, SV)
│   ├── tutorial.js       # Tutoriel intro + bulles contextuelles
│   ├── monetization.js   # Boutique, roue, pub, coffre
│   ├── social.js         # Partage de score sur reseaux sociaux
│   └── loading.js        # Ecran de chargement + prompt PWA install
│
└── icons/
    ├── icon-192.svg      # Icone PWA 192x192
    └── icon-512.svg      # Icone PWA 512x512
```

## Architecture JS

### Flux de donnees

```
state.js (S)  <──  source unique de verite
    │
    ├── config.js       constantes (lecture seule)
    ├── core.js         modifie S.grid, S.score, S.level
    ├── game-loop.js    lit/ecrit S pour la boucle RAF
    ├── input.js        lit S, appelle core.js
    ├── boosters.js     modifie S.grid, consomme S.boosters
    ├── rendering.js    lit S pour dessiner
    └── main.js         orchestre tout, expose sur window
```

### Etat central (`state.js`)

Toutes les variables mutables du jeu vivent dans l'objet `S` :
- Grille, piece courante, piece suivante, piece hold
- Score, niveau, lignes, combo
- Boosters (quantities), particules, effets
- Flags : running, paused, gameOver, freezeActive

### Communication inter-modules

- Les modules **importent** `S` depuis `state.js`
- Les modules **exportent** des fonctions pures
- `main.js` importe tout et enregistre les fonctions sur `window` pour les `onclick` HTML

## Stockage (localStorage)

| Cle | Contenu |
|-----|---------|
| `tb` | Meilleur score |
| `tb_boosters` | `{freeze:N, laser:N, meteor:N, magnet:N}` |
| `tb_xp` | XP total cumule |
| `tb_rank_bonus_applied` | Flag bonus de rang |
| `tb_wheel_last` | Timestamp dernier spin |
| `tb_parties` | Compteur parties (pour coffre) |
| `tb_lang` | Langue selectionnee |
| `tb_theme` | `"dark"` ou `"light"` |
| `tb_sound` / `tb_vibro` | Parametres audio |
| `tb_pseudo` | Pseudo leaderboard |
| `tb_move_sens` / `tb_drop_sens` | Sensibilite tactile |

## Firebase (Firestore)

Collection `scores` :
```json
{ "pseudo": "string", "score": "number", "weekly": "boolean", "ts": "Timestamp" }
```

## Maintenance

- **Ajouter une langue** : Nouveau bloc dans `js/translations.js`, ajouter le drapeau dans le HTML
- **Modifier les packs** : Objet `PACKS` dans `js/config.js`
- **Ajuster la difficulte** : `BASE` dans `js/config.js`
- **Ajouter un booster** : `js/boosters.js` + HTML bouton + CSS dans `css/boosters.css`
- **Changer le theme** : Variables dans `css/variables.css`
