# Zack

Arcade-Spiel für den Browser. HTML, CSS, JavaScript, Canvas 2D.
Keine Bibliotheken, kein Build-Schritt.

## Dateien
- `index.html` – Markup (Menü, Ergebnis, Bedienleiste), lädt CSS und Skripte
- `css/style.css` – alle Styles
- `js/*.js` – klassische Skripte (kein ES-Modul), in dieser Reihenfolge geladen:
  `core` (Konstanten, Zustand, Soundeffekte, Spurfarben) → `music` (mitwachsende
  Musik, WebAudio-Sequencer) → `rules` → `runaway` (zweiter Modus) (Regeln, Spawn, Sprung,
  Tod, Ergebnis) → `menu` → `update` (Simulation) → `render` (Zeichnen, Größe)
  → `main` (Schleife, Eingabe, Start). Alle teilen sich den globalen Gültigkeitsbereich,
  Reihenfolge beachten. Läuft auch ohne Server per Doppelklick.

Lokal testen: `npx serve -l 5173 .` (oder `python -m http.server 5173`),
dann http://localhost:5173 öffnen.

## Modi
- **Arena** (`gm=='arena'`): das Original, Gegner von allen Seiten, `camX` bleibt 0.
- **Runaway** (`gm=='run'`): Endlos-Runner in `js/runaway.js`. Welt in Weltkoordinaten,
  Kamera `camX` fährt nach rechts, linker Bildrand = Wand „The Static“. Rekord in Metern
  (`zack.best.run`). Musik: Tempo Ramp mit dem Multiplikator, Tonart +1 pro Zone,
  Gold-Rush-Glocken schon ab ×4. Maus zielt in Bildschirm-Koordinaten (`aimS`),
  `aim` ist die Weltposition.

## Spielprinzip (Arena)
- Der Spieler ist ein Funke und bewegt sich nur per Sprung: Maus zielt,
  Klick/Leertaste springt bis zu `RANGE` (330) Einheiten und trifft alles
  auf der Linie. Der Sprung ist sofort (kein Flug), siehe `dash()`.
- Treffer: Sprung sofort wieder bereit. Fehlsprung: 0,38 s Abklingzeit (`cd`).
- Serie (`combo`) mit ablaufendem Timer (`comboT` / `comboMax()`); alle 5 Treffer
  +1 Multiplikator (`mult()`, max. 15). Mehrfachtreffer in einem Sprung
  multiplizieren, Treffer aus nächster Nähe zählen doppelt ("KNAPP").
- Gegner in `foes[]`, Feld `k`: `'d'` Verfolger, `'r'` Raser mit Vorwarnlinie,
  `'i'` Igel (nur ohne Stacheln treffbar, sonst Tod), `'g'` Gold (löst 5 s
  "Rausch" aus: Gegner halb so schnell, Punkte doppelt).
- Ein Treffer von außen = tot, kurze Zeitlupe, dann Ergebnis mit Sofort-Neustart.
- Rekord in localStorage unter `"zack.best"`.

## Technik, die so bleiben muss
- Logische Welt 1280x720, per `scale` auf das Canvas skaliert (`resize()`).
- Bildratenunabhängig: `update(rdt)` rechnet mit echter Zeit, Glättung über
  `ease(k, dt) = 1 - exp(-k*dt)`. Nichts pro Frame zählen – es muss bei 60 Hz
  und 144 Hz gleich schnell und flüssig laufen.
- Zustände in `st`: `'menu'`, `'play'`, `'dying'`, `'over'`, `'pause'`.
- `hitStop` friert die Simulation kurz ein, `shake`/`flash`/`calls` laufen in
  Echtzeit weiter. `prefers-reduced-motion` (`calm`) schaltet Wackeln und
  Blitzen ab.
- Ton über WebAudio (`tone()`, `hiss()`), erst nach einer Nutzereingabe.
- Spieltexte und Wiki sind **Englisch**: kurz und knackig ("Sweet!", "Clutch!", "Gold Rush").
  Begriffe: Combo, Gold Rush (Rausch), Overdrive (Vollgas), Close Call, Cashed In, Clutch,
  Bounty, Clean Sweep, Level; Gegner Chaser, Dasher, Spiky, Gold. CLAUDE.md, Code-Kommentare
  und Commit-Nachrichten bleiben Deutsch.
- Grafikstil (Nachtviolett, gelber Funke, korallrote Gegner, Bungee/Outfit)
  bleibt so.
- Simpel halten.

## Arbeitsweise
- `docs/wiki.html` beschreibt alle Regeln und Spielwerte mit Kürzeln (z. B. `G-R2`).
  Wer einen Spielwert in `js/*.js` ändert, pflegt ihn dort mit (inkl. „Stand“ oben).
- Neue Features über Feature-Branch + Pull Request nach `main` (GitHub Flow);
  Push auf `main` geht automatisch live, Tags `v*` erzeugen Releases.

## Geplante Erweiterungen (Kontext, noch nicht umgesetzt)
- Neuer Gegner "Bomber" mit Kettenreaktion
- Medaillen/Ränge nach Punkten
- Online-Bestenliste und Tages-Challenge mit fester Gegnerfolge
- später evtl. Geister-Duell oder Echtzeit-Multiplayer
