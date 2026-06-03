## 1.6.0
- **Driehoek-element** toegevoegd aan het palet: schaalbaar (breedte/hoogte), roteerbaar (0–360° schuifregelaar), omklapbaar (ondersteboven) en vulbaar. Exporteert als `it.triangle` / `it.filled_triangle`
- **Rechthoek kan nu roteren** (schuifregelaar). Geroteerde rechthoeken exporteren als 4× `it.line` (omtrek) of 2× `it.filled_triangle` (gevuld)
- **Vullen (fill)** voor cirkel, rechthoek én driehoek via de "Gevuld"-optie
- **Home Assistant koppeling verbeterd**: in "Waardebronnen" zit nu een knop **"Uit Home Assistant…"** met een doorzoekbare entiteiten-lijst (naam + entity_id + live waarde). Klik een entiteit om hem als bron toe te voegen — type en id worden automatisch geraden. Plus uitleg-blok en een "live" kolom die de actuele waarde toont
- **Profielen** worden nu bij het opstarten geladen uit de `profiles/`-map op de server (bron van waarheid); bij eerste run wordt de map gevuld vanuit je lokale profielen
- Verticale/horizontale **scrollbars** verschijnen wanneer het venster kleiner is dan de minimale werkbare grootte
- Topbalk-ondertitel "v1 · lambda generator" → "lambda generator"

## 1.5.1
- De add-on opties **language** en **theme** werken nu écht door in de app: bij het opstarten leest de editor `/api/info` en past taal/thema toe vóórdat er iets gerenderd wordt
- Alle meldingen (toasts) in de editor zijn nu vertaald — inclusief "Live data bijgewerkt / Live data updated" bij het opstarten
- Standaard-profiel heet nu "My display" (Engels); nieuw-profiel knop volgt de taal
- **Tekst-editor in bestandsbeheer**: dubbelklik op een tekstbestand (yaml, json, txt, md, js, css, py, conf, …) of kies "Bewerken" in het rechtsklikmenu. Bewerk en sla op met de knop of Ctrl+S, Tab = 2 spaties, Esc sluit. Nieuwe endpoints `GET /api/fs/read` en `POST /api/fs/write` (max 2 MB, alleen tekst)

## 1.5.0
- Nieuwe add-on opties (Configuration tab): **language** (auto/nl/en) en **theme** (auto/light/dark). Deze worden gerespecteerd door de editor en bestandsbeheerder; de in-app knoppen blijven werken als snelle override wanneer de optie op auto staat
- `samba_host` optie verwijderd — niet meer nodig (pad is altijd `\\<HA-IP>\addon_configs\<slug>`)
- Add-on beschrijving + DOCS.md naar het Engels
- Volledig herschreven README.md (Engels) met een "Add repository to Home Assistant" knop, uitleg van functies, configuratie en SAMBA-opslag

## 1.4.5
- Thema: exact ESPHome-mechanisme. Detectie via een onzichtbaar `Canvas`-system-color probe-element met `color-scheme: light dark`. De browser geeft HA's `color-scheme` door aan de iframe, dus `Canvas` lost op naar HA's échte thema — onafhankelijk van het OS (daar ging `prefers-color-scheme` de mist in). `--primary-background-color` en `prefers-color-scheme` blijven als fallbacks
- FOUC-fix bestandsbeheer gebruikt nu ook de Canvas-probe

## 1.4.4
- Thema definitief: leest `--primary-background-color` uit HA (de enige bron die klopt als HA-thema en OS-thema verschillen — debug bewees `#fafafa`=licht / `#111111`=donker). Probeert nu zowel `window.parent` als `window.top` (HA kan de ingress-iframe nesten). Polling 500ms voor live wissels, `prefers-color-scheme` alleen als allerlaatste fallback
- Cache-busting: `?v=1.4.4` op alle JS-bestanden zodat de browser na een update gegarandeerd de nieuwe versie laadt (oude JS bleef soms in cache hangen)
- FOUC-fix in bestandsbeheer gebruikt dezelfde frame-walking detectie

## 1.4.3
- Thema: theme.js exact teruggezet naar versie 1.3.7 (`prefers-color-scheme` + `html { color-scheme: light dark }`). Polling en `--primary-background-color`-detectie verwijderd
- Taaldetectie via HA's `lang`-attribuut behouden (werkt correct)
- FOUC-fix bestandsbeheer terug naar de eenvoudige variant van 1.3.7

## 1.4.2
- Thema: definitieve aanpak — `--primary-background-color` luminantie als primaire detectie (debug bewees: `#fafafa`=licht, `#111111`=donker, altijd correct ongeacht OS vs HA instelling), met polling elke 500ms. `prefers-color-scheme` blijft fallback voor Auto-modus. `color-scheme: light dark` in CSS blijft staan voor Auto-modus ondersteuning
- Taaldetectie: HA's `lang` HTML-attribuut heeft nu altijd prioriteit boven localStorage en navigator.language. `en-GB` en `en-US` → Engels, `nl-NL` → Nederlands
- FOUC-fix in bestandsbeheer: ook via `--primary-background-color` (consistent met thema-detectie)

## 1.4.1
- Thema: terug naar de werkende aanpak van 1.3.6 — `prefers-color-scheme` + `html { color-scheme: light dark }` in CSS. De polling en `--primary-background-color`-check zijn verwijderd
- Taaldetectie: `en-GB`, `en-US` en alle andere `en-*` varianten worden correct als Engels herkend
- FOUC-fix file explorer: terug naar eenvoudige `prefers-color-scheme`-check (consistent met thema-aanpak)

## 1.4.0
- Taaldetectie: gebruikt nu het `lang`-attribuut op HA's `<html>` element (bijv. `en-GB`, `nl-NL`) — detecteert zo de taal die je in HA hebt ingesteld, niet de OS-taal
- Thema: terug naar `--primary-background-color` luminantie-check met polling (500ms). Dit is de enige methode die werkt bij expliciet ingesteld Light of Dark in HA. `prefers-color-scheme` blijft als fallback voor HA Auto-modus
- FOUC-fix in bestandsbeheer bijgewerkt: gebruikt ook `--primary-background-color` voor de initiële render (consistent met thema-detectie)

## 1.3.9
- Dark/light thema werkt weer: `boot()` teruggezet naar fire-and-forget voor api/info (het awaiten veroorzaakte een timing-conflict met theme.js)
- Profielen: vereenvoudigd — profielen worden opgeslagen via debounced `persist()` (2s na wijziging), geen server-state-override meer bij opstarten
- Meertaligheid (NL/EN): auto-detectie op basis van browsertaal; handmatige toggle via `EN`/`NL` knop in beide apps. Taalvoorkeur wordt onthouden in localStorage. Alle zichtbare UI-tekst in de editor en bestandsbeheerder is vertaald

## 1.3.8
- Bestandsbeheer: flash (FOUC) opgelost — inline script direct na `<body>` zet de klasse synchroon vóór de eerste render, net als de editor
- Profielen worden nu opgeslagen in `STORAGE_DIR/profiles/` (SAMBA-toegankelijk via `\\<HA-IP>\addon_configs\3d980088_eink_studio\profiles\`)
- Elk profiel = één `{naam}.json` bestand; nieuw API: `GET/PUT/DELETE /api/profiles/{name}`
- Editor laadt profielen bij opstarten van de server; slaat ze automatisch op (2 sec debounce) na elke wijziging; verwijdert orphan-bestanden bij hernoeming

## 1.3.7
- Editor-thema werkt nu ook: `let state` gewijzigd naar `var state` in app.js zodat `window.state` toegankelijk is vanuit theme.js. Zonder dit las `applyTheme()` altijd de opgeslagen (verkeerde) `state.theme` in plaats van het gedetecteerde thema
- `apply()` in theme.js zet nu altijd direct de body-class, onafhankelijk van app.js

## 1.3.6
- `html { color-scheme: light dark }` toegevoegd aan styles.css — dit is de sleutel: de browser propageert HA's `color-scheme` van het parent-document naar de Ingress-iframe, waardoor `prefers-color-scheme` correct dark/light teruggeeft (exact dezelfde techniek als ESPHome webserver v3)

## 1.3.5
- Thema-detectie volledig herschreven naar de ESPHome-aanpak: `prefers-color-scheme` media query van de browser/OS — exact dezelfde methode als ESPHome dashboard v2023.6.0+. Simpel, betrouwbaar, geen parent-document-hacks

## 1.3.4
- Thema-detectie: MutationObserver vervangen door polling elke 500ms op `--primary-background-color` — vangt ook HA-stylesheet-wissels op die de observer mistte. Hex-parser fix uit 1.3.3 behouden

## 1.3.3
- Thema-detectie eindelijk correct: `--primary-background-color` was al beschikbaar (`#fafafa` licht / `#111111` donker) maar de regex `/\d+/g` pakte hex-kleuren niet goed (levert één getal op i.p.v. drie). Eigen hex-parser toegevoegd die `#rrggbb` correct naar RGB omzet en daarna luminantie berekent
- Debug-logging verwijderd

## 1.3.2
- Thema-detectie: debug-logging toegevoegd in browser console (`[EinkTheme]`) om te achterhalen welk signaal HA daadwerkelijk zet

## 1.3.1
- Zijbalk-icoon teruggezet naar `mdi:image-edit`

## 1.3.0
- Thema-detectie opnieuw: HA zet een `dark` HTML-attribuut op `<html>` via `applyThemesOnElement()` — dit is het canonieke signaal. MutationObserver bewaakt nu specifiek dit attribuut. Vorige pogingen (style, colorScheme) waren onjuist
- Zijbalk-icoon gewijzigd naar `mdi:pencil-box-outline` (zit zeker in HA's icon-bundel; `mdi:image-edit` ontbrak daarin)

## 1.2.9
- Zijbalk-icoon teruggezet naar `mdi:image-edit`
- Thema-detectie opnieuw gebouwd: gebruikt nu `getComputedStyle().colorScheme` (HA zet het thema via een stylesheet op `:root`, niet als inline style) + luminantie van `--primary-background-color` als extra fallback
- MutationObserver bewaakt nu ook `<head>` voor stylesheet-wijzigingen die HA injecteert bij het wisselen van thema

## 1.2.8
- Zijbalk-icoon gewijzigd naar `mdi:note-edit`

## 1.2.7
- Bestandsbeheer: `◐ Thema`-knop toegevoegd voor handmatige light/dark wissel
- Thema-detectie verbeterd: controleert nu ook `style.colorScheme` op het HA parent-document en de `selectedTheme` localStorage-sleutel (HA slaat het thema daar op, niet als HTML-attribuut)
- Bij wisselen in HA wordt de handmatige override opgeheven en volgt de app het HA-thema weer
- SAMBA-badge gecorrigeerd: toonde `\config` (mountpunt), toont nu de juiste slug `3d980088_eink_studio`

## 1.2.6
- Dark/light thema: zowel de editor als de bestandsbeheerder volgen automatisch de HA-themakeuze (Donker/Licht/Auto)
- Wisselen in HA wordt direct doorgevoerd zonder herladen, via MutationObserver op het HA parent-document
- Terugval op OS-voorkeur als de HA-thema-instelling niet uitgelezen kan worden (bijv. buiten Ingress)
- De handmatige `◐ Thema`-knop in de editor werkt nog steeds als tijdelijke override

## 1.2.5
- Correcte HA map-sleutel: `addon_config:rw` (was `addon_configs:rw` — verkeerd gespeld, daardoor maakte HA nooit de SAMBA-map aan)
- HA monteert de add-on config-map nu op `/config` in de container; dit is exact dezelfde map als `\\<HA-IP>\addon_configs\<slug>` via SAMBA
- Geen handmatige `mkdir` meer nodig — HA regelt de map automatisch bij (her)installatie
- run.sh vereenvoudigd: `STORAGE_DIR=/config` met fallback naar `/data`

## 1.2.4
- SAMBA-map (`3d980088_eink_studio`) wordt nu automatisch aangemaakt bij opstarten — geen handmatige stappen meer nodig bij eerste installatie
- Zijbalk-icoon teruggezet naar `mdi:image-edit`

## 1.2.3
- Eigen app-icoon (512×512 PNG) toegevoegd: e-ink display met papier-witte achtergrond en tekst­lijnen
- Slug-detectie voor SAMBA-map is nu dynamisch (zoekt naar `*_eink_studio` in `/addon_configs`)

## 1.2.2
- Projecten en fonts worden nu opgeslagen in `/addon_configs/3d980088_eink_studio` zodat ze direct zichtbaar zijn via SAMBA (`\\<HA-IP>\addon_configs\3d980088_eink_studio`)
- Automatische migratie van bestaande data vanuit `/data` bij eerste start
- Zijbalk-icoon gewijzigd naar `mdi:tablet-draw`

## 1.2.1
- Bestandsbeheer: 404-fout opgelost door relatieve URL's te gebruiken (vereist voor HA Ingress)
- SAMBA-badge in bestandsbeheer toont het Windows-pad

## 1.2.0
- Bestandsbeheer-pagina toegevoegd (`📁 Bestanden`-knop in de editor)
- Bestanden: uploaden (ook drag & drop), downloaden, hernoemen, verplaatsen, verwijderen
- Mappen: aanmaken, verplaatsen, verwijderen
- Rechtsklik-contextmenu en toetsenbord-sneltoetsen (Delete, F2, F5, Backspace)
- Upload-limiet verhoogd naar 64 MB
- `/addon_configs`-map toegevoegd aan `config.yaml` (vereist voor SAMBA-toegang)

## 1.1.0
- Initiële versie van de WYSIWYG-editor voor ESPHome e-ink displays
- Live preview van Home Assistant-states
- Projecten en fonts opslaan in `/data`
- Volledig offline (alle libraries meegebundeld)
- Genereer ESPHome YAML + lambda-code
