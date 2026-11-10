# Zack

Arcade-Spiel für den Browser. Aktuell komplett in `index.html` (HTML, CSS,
JavaScript, Canvas 2D). Keine Bibliotheken, kein Build-Schritt.

Lokal testen: `npx serve -l 5173 .` (oder `python -m http.server 5173`),
dann http://localhost:5173 öffnen.

## Spielprinzip
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
- Texte sind Deutsch mit Wiener Einschlag ("Leiwand!", "Oida!").
- Grafikstil (Nachtviolett, gelber Funke, korallrote Gegner, Bungee/Outfit)
  bleibt so.
- Simpel halten.

## Arbeitsweise
- Datei erst aufteilen, wenn die Struktur abgesprochen ist.
- `docs/wiki.html` beschreibt alle Regeln und Spielwerte mit Kürzeln (z. B. `G-R2`).
  Wer einen Spielwert in `index.html` ändert, pflegt ihn dort mit (inkl. „Stand“ oben).
- Neue Features über Feature-Branch + Pull Request nach `main` (GitHub Flow);
  Push auf `main` geht automatisch live, Tags `v*` erzeugen Releases.

## Geplante Erweiterungen (Kontext, noch nicht umgesetzt)
- Serie beim Ablaufen als Bonus einzahlen
- Neuer Gegner "Bomber" mit Kettenreaktion
- Medaillen/Ränge nach Punkten
- Online-Bestenliste und Tages-Challenge mit fester Gegnerfolge
- später evtl. Geister-Duell oder Echtzeit-Multiplayer
