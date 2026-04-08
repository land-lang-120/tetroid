# TETROID - Architecture & Guide de Maintenance

## Structure du projet

```
tetroid/
├── tetroid.html        # Application principale (fichier unique)
├── index.html          # Redirection vers tetroid.html (GitHub Pages)
├── manifest.json       # Manifeste PWA (nom, icones, orientation)
├── sw.js               # Service Worker (cache offline)
├── ARCHITECTURE.md     # Ce fichier
├── icons/
│   ├── icon-192.svg    # Icone PWA 192x192
│   └── icon-512.svg    # Icone PWA 512x512
```

## Architecture de tetroid.html

Le jeu est un **fichier HTML unique** (~6500 lignes) organise en sections :

### 1. Firebase (lignes 1-80)
- Chargement **dynamique et optionnel** de Firebase
- Si `FB_CONFIG.apiKey` est vide, le jeu fonctionne en mode offline
- Fonctions exposees : `window.submitScore()`, `window.fetchLeaderboard()`

### 2. CSS (lignes 82-1500)
- **Variables CSS** : `:root` pour le theme sombre, `body.light` pour le clair
- **Loading screen** : Animation de blocs + barre de progression
- **HUD** : Barre superieure avec score, niveau, combo, best, next
- **Canvas** : Zone de jeu responsive
- **Boosters** : 4 boutons avec badges de quantite
- **Overlays** : Start, Game Over, Pause, Shop, Wheel, Ad, Chest, FOMO, Tutorial, Settings, Leaderboard

### 3. HTML (lignes 1500-1900)
- `#loading-screen` : Ecran de chargement anime
- `#app` : Container principal flex
  - `#hud` : Barre de stats
  - `#rank-bar` : Barre XP/rang
  - `#title-strip` : Titre + bouton leaderboard
  - `#canvas-wrap` : Canvas du jeu + boutons pause/shop
  - `#boosters` : 4 boutons de boosters
- Overlays modaux (`ov-*`)

### 4. JavaScript (lignes 1900-6500)

#### a. Constantes & Etat (~1900-2180)
- Grille 10x20, 7 pieces Tetris standard
- Couleurs, dimensions, timers
- Variables d'etat : `grid`, `score`, `level`, `combo`, `boosters`

#### b. Init & Spawn (~2180-2220)
- `init()` : Reset complet, chargement boosters depuis localStorage
- `spawnPiece()` : Generation de piece avec systeme de sac (bag)

#### c. Mecaniques (~2220-2560)
- Rotation avec wall-kick
- Detection de collision
- Verrouillage et effacement de lignes
- Systeme de combo (x1 a x8)
- Score : `[0,100,300,600,1000][lines] * level * combo`

#### d. Boosters (~2560-2700)
- **Freeze** : Ralentit 20s, effets cristallins
- **Laser** : Rase les 4 lignes les plus remplies
- **Meteor** : Detruit 3 briques/colonne avec animation
- **Magnet** : Gravite sur briques flottantes (multi-passe)
- Systeme **consommable** : decompte a chaque utilisation, sauvegarde localStorage

#### e. Rendu & Effets (~2700-3500)
- Canvas 2D avec cellules style bonbon
- Ghost piece (ombre de la position finale)
- Particules (line clear, level-up, boosters)
- Fireworks, flash, bannieres animees

#### f. Rang & XP (~3500-3600)
- 8 niveaux : Novice -> Apprenti -> Confirmé -> Expert -> Maitre -> Légende -> Mythe -> Divin
- XP = score cumule (localStorage)
- Bonus boosters au rank-up

#### g. i18n (~4400-5450)
- 12 langues : EN, FR, DE, ES, PT, RU, ZH, KO, AR, HI, NL, SV
- Systeme `data-i18n` sur les elements HTML
- `applyLang()` applique la traduction selectionnee
- Detection automatique via `navigator.language`

#### h. Monetisation (~5600-6100)
- **Shop** : 4 packs de boosters (prix croissants, quantites croissantes)
- **Roue quotidienne** : 10 cases (6 boosters + 4 "pas de chance"), cooldown 24h
- **Pub simulee** : 5 secondes, +1 booster aleatoire
- **Coffre** : Toutes les 5 parties, 2-4 boosters
- **FOMO** : Propose de continuer apres game over (via pub)

#### i. Audio (~6100-6400)
- Web Audio API : musique synthetisee 158 BPM
- Effets sonores : rotation, lock, hard drop, line clear, level up, game over
- Sons specifiques par booster

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
| `tb_sound` | `"true"` ou `"false"` |
| `tb_vibro` | Vibrations on/off |
| `tb_pseudo` | Pseudo leaderboard |
| `tb_move_sens` | Sensibilite mouvement (1-10) |
| `tb_drop_sens` | Sensibilite drop (1-10) |
| `tb_seen_*` | Flags description booster deja vue |

## Firebase (Firestore)

Collection `scores` :
```json
{
  "pseudo": "string (max 20 chars)",
  "score": "number",
  "weekly": "boolean",
  "ts": "Timestamp"
}
```

Regles de securite :
- Read : public
- Create : valide pseudo (string <=20) et score (number)
- Update/Delete : interdit

## Deploiement

1. **GitHub Pages** : Push sur `main`, activer Pages dans les settings
2. **PWA** : manifest.json + sw.js (cache offline)
3. **Play Store** : TWA (Trusted Web Activity) via Bubblewrap ou PWABuilder

## Maintenance courante

- **Ajouter une langue** : Copier un bloc dans `TRANSLATIONS`, ajouter le bouton drapeau
- **Modifier les packs** : Objet `PACKS` dans le JS
- **Ajuster la difficulte** : `BASE` (vitesse initiale), formule level dans `dropInterval`
- **Ajouter un booster** : Nouveau type dans `activateBooster()`, HTML bouton, icone, son
