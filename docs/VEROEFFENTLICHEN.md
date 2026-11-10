# Zack veröffentlichen – Schritt für Schritt

Ziel: Das Spiel liegt auf GitHub, jede Änderung auf `main` geht automatisch online,
Versionen bekommen ein Release, und am Ende ist es unter deiner eigenen Domain erreichbar.

Du brauchst dafür etwa **1 Stunde** (ohne Domain) plus **1 Stunde** für die Domain
(davon ist viel Warten).

---

## 0. Das große Bild

```
 Dein PC                 GitHub                                    Internet
┌──────────┐  git push  ┌───────────────┐  startet   ┌──────────────┐   ┌────────────────────┐
│ Ordner   │ ─────────► │ Repository    │ ─────────► │ GitHub       │ ─►│ GitHub Pages       │
│ Desktop\ │            │ (Kopie deines │            │ Actions      │   │ dein-name.github.io│
│ Zack     │            │  Git-Verlaufs)│            │ (CI/CD)      │   │ /zack  oder        │
└──────────┘            └───────────────┘            └──────────────┘   │ deine Domain       │
                                                                       └────────────────────┘
```

| Begriff | Was es ist | Wofür du es brauchst |
|---|---|---|
| **Git** | Programm auf deinem PC, das Versionen speichert | Hast du schon. Alles, was du committest, ist sicher und zurückholbar. |
| **Repository (Repo)** | Ein Projekt samt ganzem Verlauf | Dein Ordner `Zack` ist eins. Auf GitHub kommt eine Kopie davon. |
| **Remote / `origin`** | Adresse des Repos im Internet | Damit dein PC weiß, wohin `git push` hochlädt. |
| **push / pull** | Hochladen / herunterladen von Commits | `push` nach jeder fertigen Änderung. |
| **GitHub** | Webseite, die Repos aufbewahrt | Treffpunkt für Code, Hosting, Automatisierung. |
| **CI** (Continuous Integration) | Automatische Prüfung bei jeder Änderung | Fängt kaputten Code ab, bevor er online geht. |
| **CD** (Continuous Deployment) | Automatisches Veröffentlichen | Du musst nie wieder Dateien per Hand hochladen. |
| **GitHub Actions** | GitHubs CI/CD: Skripte, die auf GitHubs Servern laufen | Führt unsere zwei Workflows aus. |
| **Workflow** | Eine `.yml`-Datei in `.github/workflows/` | Beschreibt: *wann* läuft was, *welche* Schritte. |
| **GitHub Pages** | Kostenloses Hosting für statische Webseiten | Zack ist nur eine HTML-Datei – perfekt dafür. |
| **Tag** | Etikett auf einem Commit, z. B. `v1.0.0` | Markiert eine offizielle Version. |
| **Release** | GitHub-Seite zu einem Tag mit Notizen und Download | „Version 1.0 ist raus“ – für dich und andere nachvollziehbar. |
| **Pull Request (PR)** | Antrag, einen Branch in `main` zu übernehmen | Änderungen anschauen, bevor sie live gehen. |
| **DNS** | Telefonbuch des Internets: Name → Server-Adresse | Damit `deinedomain.at` auf GitHub zeigt. |

---

## 1. GitHub oder GitLab?

**Empfehlung: GitHub.**

| | GitHub | GitLab |
|---|---|---|
| Hosting für statische Seiten | GitHub Pages, gratis | GitLab Pages, gratis |
| Eigene Domain + HTTPS | ja, gratis | ja, gratis |
| Repo darf privat sein (gratis)? | **nein**, für Pages muss es öffentlich sein* | ja |
| CI/CD | GitHub Actions, riesige Auswahl fertiger Bausteine | GitLab CI, ebenso gut, etwas technischer |
| Anleitungen, Hilfe im Netz | sehr viel | weniger |
| Online-Bestenliste später | gut kombinierbar (z. B. mit Supabase/Cloudflare) | genauso |

\* „Öffentlich“ heißt: jeder kann den Code sehen. Bei einem Browserspiel ist das egal –
den Code kann ohnehin jeder im Browser ansehen. Wenn dir privat wichtig ist,
geht GitLab oder ein bezahltes GitHub-Konto.

Diese Anleitung geht von **GitHub** aus.

---

## 2. Was du installieren musst

| Programm | Status bei dir | Wofür |
|---|---|---|
| Git for Windows | ✅ installiert (inkl. „Git Credential Manager“ für die Anmeldung) | Versionen, push |
| Node.js | ✅ installiert | lokaler Testserver (`npx serve`) |
| VS Code | ✅ installiert | Dateien ansehen und bearbeiten |
| **GitHub CLI** (`gh`) | ❌ optional | GitHub-Sachen im Terminal erledigen (Repo anlegen, PRs, Releases) |

Mehr brauchst du nicht. Die GitHub CLI ist praktisch, aber nicht nötig – alles geht
auch auf github.com im Browser. Wenn du sie willst (PowerShell):

```powershell
winget install --id GitHub.cli
```

Danach Terminal neu öffnen und einmal anmelden: `gh auth login`.

Deine Git-Identität (Name, E-Mail) ist schon eingerichtet – die steht in jedem Commit.

---

## 3. GitHub-Konto anlegen

1. Auf **github.com** → *Sign up*. Der Benutzername taucht später in der Adresse auf
   (`benutzername.github.io`), also wähl ihn mit Bedacht.
2. **Zwei-Faktor-Anmeldung** einschalten (Settings → Password and authentication).
   GitHub verlangt das inzwischen ohnehin für die meisten Konten.

> **Wofür?** Ohne Konto kein Repo im Netz, kein Hosting, keine Actions.

---

## 4. Repository auf GitHub anlegen

1. Oben rechts **+** → **New repository**.
2. Name: `zack`.
3. **Public** auswählen (nötig für kostenloses Pages, siehe oben).
4. **Nichts** ankreuzen (kein README, kein .gitignore, keine Lizenz) – das Repo muss leer
   sein, weil dein PC schon einen Verlauf hat.
5. **Create repository**.

GitHub zeigt dir jetzt eine Adresse wie `https://github.com/BENUTZERNAME/zack.git`.

---

## 5. Deinen PC mit GitHub verbinden und hochladen

Im Terminal (im Ordner `Desktop\Zack`):

```bash
git remote add origin https://github.com/BENUTZERNAME/zack.git
```

> **Was passiert:** Dein Repo merkt sich: „Mein Gegenstück im Netz heißt `origin`
> und liegt dort.“ Es wird noch nichts hochgeladen.

```bash
git push -u origin main
```

> **Was passiert:** Alle Commits von `main` werden hochgeladen. `-u` merkt sich die
> Verbindung, ab jetzt reicht `git push`. Beim ersten Mal öffnet sich ein
> Browserfenster zum Anmelden bei GitHub (das macht der Git Credential Manager,
> dein Passwort tippst du nur bei GitHub selbst ein).

Danach github.com/BENUTZERNAME/zack neu laden – dein Code und die drei Commits sind da.

Optional den alten Feature-Branch auch hochladen (oder lokal löschen, er ist in `main` enthalten):

```bash
git branch -d feat/dopamin-mechaniken
```

---

## 6. CI/CD einschalten: automatisch veröffentlichen

Die Workflows liegen schon im Ordner, du musst sie nur verstehen, committen und
GitHub einmal umstellen.

### 6a. Die zwei Workflow-Dateien

**`.github/workflows/deploy.yml` – „Deploy“**

- **Wann:** bei jedem Push auf `main` (und per Knopf im Reiter *Actions*).
- **Job `build`:**
  1. *Code holen* – GitHub leiht sich einen frischen Linux-Rechner und lädt dein Repo darauf.
  2. *Prüfen (CI)* – liest das JavaScript aus `index.html` und lässt Node die Syntax prüfen.
     Ein Tippfehler wie eine fehlende Klammer → Workflow wird **rot**, nichts geht online.
     Die alte Version bleibt erreichbar.
  3. *Website zusammenstellen (Build)* – kopiert nur `index.html` in den Ordner `_site`.
     Dadurch landen `CLAUDE.md`, diese Anleitung usw. **nicht** auf der Webseite.
  4. *Hochladen* – packt `_site` als Paket.
- **Job `deploy`:** veröffentlicht das Paket auf GitHub Pages.

**`.github/workflows/release.yml` – „Release“**

- **Wann:** wenn ein Tag hochgeladen wird, der mit `v` beginnt (z. B. `v1.0.0`).
- **Was:** verpackt `index.html` als `zack-v1.0.0.zip` und legt ein GitHub-Release an,
  die Änderungsliste wird automatisch aus den Commits erstellt.

### 6b. GitHub Pages auf „GitHub Actions“ stellen (vor dem Push!)

1. Im Repo auf GitHub: **Settings** → links **Pages**.
2. Bei **Build and deployment → Source**: **GitHub Actions** auswählen.

> **Wofür?** Damit GitHub weiß: „Die Seite kommt aus einem Workflow“, nicht aus einem Ordner.

### 6c. Workflows committen und hochladen

```bash
git add .github docs
```
```bash
git commit -m "CI/CD: automatisch auf GitHub Pages veröffentlichen, Releases bei Tags"
```
```bash
git push
```

### 6d. Zuschauen

1. Im Repo auf den Reiter **Actions** klicken. Dort läuft „Deploy“ (gelber Punkt → grüner Haken, ca. 30–60 Sekunden).
2. Klick auf den Lauf → du siehst jeden Schritt mit Ausgabe, z. B. „Syntax ok“.
3. Beim Job *deploy* steht die Adresse:
   **`https://BENUTZERNAME.github.io/zack/`** 🎉

Ab jetzt gilt: **Push auf `main` = ist online.**

---

## 7. So arbeitest du ab jetzt (Branch → Pull Request → live)

Damit nicht jeder halbfertige Versuch sofort online ist:

```bash
git switch -c feat/bomber
```
… Änderungen machen, lokal mit `npx serve -l 5173 .` testen, committen …
```bash
git push -u origin feat/bomber
```

1. Auf GitHub erscheint ein Hinweis **„Compare & pull request“** → anklicken → **Create pull request**.
2. Im PR siehst du alle Änderungen Zeile für Zeile.
3. **Merge pull request** → `main` ändert sich → *Deploy* läuft → online.
4. Lokal wieder auf den Stand bringen:

```bash
git switch main
```
```bash
git pull
```

> **Tipp für später:** Unter Settings → Branches kannst du `main` schützen, sodass der
> CI-Check grün sein muss, bevor ein PR gemergt werden darf.

---

## 8. Releases bauen

### Versionsnummern (SemVer): `vHAUPT.NEBEN.FIX`

| Änderung | Beispiel | Neue Version |
|---|---|---|
| Kleiner Fehler behoben | Tippfehler im Text | `v1.0.0` → `v1.0.1` |
| Neues Feature, alles Alte geht noch | Bomber-Gegner | `v1.0.1` → `v1.1.0` |
| Großer Umbau, Altes ändert sich | Neues Punktesystem, Rekorde zurückgesetzt | `v1.1.0` → `v2.0.0` |

### Ein Release machen

Auf `main`, alles committet und gepusht:

```bash
git tag v1.0.0
```
```bash
git push origin v1.0.0
```

> **Was passiert:** Der Tag klebt am aktuellen Commit. Beim Hochladen startet der
> Workflow *Release*. Nach ca. 30 Sekunden steht im Repo rechts unter **Releases**
> „Zack v1.0.0“ mit ZIP-Download und automatischer Änderungsliste.

Den Text des Releases kannst du danach auf GitHub noch per Hand verschönern (✏️-Symbol).

---

## 9. Eigene Domain (z. B. zack.io)

### 9a. Geht das? Ja.

GitHub Pages kann jede Domain verwenden, die dir gehört, inkl. kostenlosem HTTPS-Zertifikat.
GitHub verkauft aber **keine** Domains – die kaufst du bei einem **Registrar**.

### 9b. Domain aussuchen

- **Ist sie frei?** Kurze Namen wie `zack.io` oder `zack.at` sind sehr wahrscheinlich
  schon vergeben. Beim Registrar einfach suchen. Alternativen:
  `zackspiel.at`, `zack-game.com`, `spielzack.at`, `zack.wien` …
- **Kosten (grob, pro Jahr):** `.at` / `.com` ca. 10–20 €, `.io` ca. 35–60 €, `.wien` ca. 30–40 €.
  Achte auf den Preis **ab dem zweiten Jahr** (Verlängerung), nicht nur aufs Lockangebot.
- **Hinweis zu `.io`:** 2024 gab es Diskussionen über die Zukunft der Endung `.io`
  (sie gehört zum Britischen Territorium im Indischen Ozean). Für ein Hobbyprojekt ist
  `.at` oder `.com` die ruhigere Wahl.
- **Registrar:** z. B. Cloudflare Registrar (verkauft zum Selbstkostenpreis, nicht jede Endung),
  Porkbun, Namecheap, oder österreichisch easyname / World4You (gut für `.at`).

### 9c. Domain zuerst bei GitHub verifizieren (Schutz)

Bevor du DNS einstellst: Auf GitHub **Profilbild → Settings → Pages → Add a domain**,
Domain eingeben. GitHub zeigt einen **TXT-Eintrag**, den du beim Registrar anlegst
(Schritt 9d), dann auf **Verify** klicken.

> **Wofür?** Damit niemand anderer deine Domain in seinem GitHub-Repo verwenden kann.

### 9d. DNS-Einträge beim Registrar setzen

Im DNS-Bereich deiner Domain beim Registrar diese Einträge anlegen
(bestehende Platzhalter-Einträge für `@` und `www` vorher löschen):

| Typ | Name / Host | Wert |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `BENUTZERNAME.github.io` |
| TXT | (wie GitHub in 9c anzeigt) | (Wert von GitHub) |

> **Was heißt das?** `@` ist die Domain selbst (`deinedomain.at`). A-Einträge zeigen auf
> GitHubs Server (IPv4), AAAA dasselbe für IPv6. Der CNAME sagt: „`www.deinedomain.at`
> ist dasselbe wie `BENUTZERNAME.github.io`.“

Prüfe die Adressen vorher kurz gegen die offizielle GitHub-Doku („Managing a custom domain
for your GitHub Pages site“) – sie ändern sich selten, aber sicher ist sicher.

### 9e. Domain im Repo eintragen

1. Repo → **Settings → Pages → Custom domain**: `deinedomain.at` eintragen → **Save**.
2. GitHub prüft die DNS-Einträge. Das kann **von Minuten bis zu 24 Stunden** dauern.
3. Sobald es grün ist: **Enforce HTTPS** anhaken (kann nach dem DNS-Check noch etwas
   dauern, bis das Kästchen klickbar ist).

> Bei unserem Actions-Workflow brauchst du **keine** `CNAME`-Datei im Repo –
> die Einstellung in Settings → Pages genügt.

Fertig: **https://deinedomain.at** zeigt Zack. Die alte `github.io`-Adresse leitet automatisch weiter.

---

## 10. Wenn etwas nicht klappt

| Problem | Ursache / Lösung |
|---|---|
| `git push` fragt nach Passwort und lehnt es ab | GitHub nimmt keine Passwörter im Terminal. Das Browser-Anmeldefenster abwarten, oder `gh auth login` verwenden. |
| `! [rejected] … (fetch first)` | Auf GitHub gibt es Commits, die du lokal nicht hast (z. B. README beim Anlegen angekreuzt). `git pull --rebase`, dann nochmal `git push`. |
| Workflow „Deploy“ ist rot bei *Prüfen (CI)* | JavaScript-Fehler in `index.html`. Auf den roten Schritt klicken, die Meldung zeigt die Stelle. Lokal reparieren, committen, pushen. |
| Workflow rot bei *deploy*, „Pages not enabled“ | Schritt 6b vergessen: Settings → Pages → Source: GitHub Actions. Dann im Reiter Actions „Re-run jobs“. |
| Seite zeigt 404 | Ein paar Minuten warten; Adresse muss mit `/zack/` enden (ohne eigene Domain). |
| Domain zeigt nichts / Zertifikatsfehler | DNS braucht Zeit. Mit `nslookup deinedomain.at` prüfen, ob die GitHub-IPs zurückkommen. |
| Rekord ist nach dem Umzug weg | Der Rekord liegt im Browser pro Adresse (localStorage). `localhost`, `github.io` und deine Domain haben jeweils einen eigenen. Das ist normal. |

---

## 11. Checkliste

- [ ] GitHub-Konto mit Zwei-Faktor-Anmeldung
- [ ] Leeres öffentliches Repo `zack` angelegt
- [ ] `git remote add origin …` und `git push -u origin main`
- [ ] Settings → Pages → Source: **GitHub Actions**
- [ ] Workflows committet und gepusht
- [ ] Reiter Actions: „Deploy“ ist grün, Spiel unter `BENUTZERNAME.github.io/zack/` erreichbar
- [ ] Erstes Release: `git tag v1.0.0` und `git push origin v1.0.0`
- [ ] (Optional) Domain gekauft, verifiziert, DNS gesetzt, Custom domain eingetragen, HTTPS erzwungen
