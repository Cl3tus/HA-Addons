## 2.4.2
- **YAML importeren** negeert nu alles wat de studio niet kent: plak gerust een complete ESPHome-config (met `esphome:`, `wifi:`, `api:`, `!secret`-tags, de display-lambda, enz.). Alleen `font:`, `color:` en `homeassistant`-`sensor:`/`text_sensor:` worden ingelezen — de rest wordt stil overgeslagen. Eerder liep de import vast op o.a. `!secret`-tags.

## 2.4.1
- **Rechthoek**: "verhouding vergrendelen"-optie toegevoegd; bij her-aanvinken reset naar 1:1 (vierkant)
- **Driehoek**: reset nu ook naar 1:1 bij her-aanvinken van de lock (net als de cirkel)
- **Gauge**: rotatie-handvat zit nu echt bovenaan (gauge omgebouwd naar een eigen vorm; node-rotatie = de starthoek)
- **Scherm-dropdown**: Wachtscherm staat nu bovenaan, Hoofdscherm eronder
- **Fonts**: zelfde TTF-bestand telt nu als één upload — upload je `digital.ttf` op 60px, dan is de 30px-variant ook meteen "geüpload" (status + bytes worden gedeeld)

## 2.4.0
- **Rotatie-ankers zijn nu rondjes** (rechthoek, driehoek, veelhoek, gauge); lijn-rotatie-anker zit nu bovenaan
- **Vaste-verhouding fixes**: cirkel/ring/veelhoek/gauge tonen alleen hoek-handvatten; cirkel wordt weer rond bij opnieuw aanvinken van "rond houden"; driehoek heeft een lock-optie
- **QR-code**: 4 hoek-handvatten (proportioneel schalen) + **ECC-niveau** (LOW/MEDIUM/QUARTILE/HIGH)
- **Wi-Fi**: standaard-iconen tonen nu correct (icoonnamen) + MDI-kiezer per niveau
- **Refresh-klok**: standaard-icoon = mdi:recycle; AM/PM-preview werkt nu (12-uurs)
- **Condities (if/else)** beschikbaar op álle elementen (zichtbaarheid + kleur-override per tak)
- **Tweede scherm**: ontwerp nu ook het **wachtscherm** ("waiting for data") — schakel bovenaan de canvas tussen Hoofdscherm/Wachtscherm. De YAML zet jouw wachtscherm in de `if (initial_data_received == false)`-tak
- **Gegenereerde YAML**: glyphs nu als compacte één-regel-array; base64-herstelcode toggle-baar via checkbox; resterende NL-comment vertaald
- **Fonts**: Kleuren-sectie volledig verwijderd; **"TTF uploaden"**-knop toegevoegd; zelfde TTF-bestand wordt hergebruikt (niet 2× uploaden)
- **Bestandsbeheer**: dubbelklik op een TTF/OTF/woff opent een **font-preview**

## 2.3.1
- **Scenario's verwijderd** — de losse Scenario's-knop is weg. Test-/voorbeeldwaarden vul je gewoon in via het "voorbeeld"-veld per bron in **Waardebronnen** (zoals het al kon). Conditie-preview volgt nu ook live data wanneer Live aan staat

## 2.3.0
- Sleep-selectie (marquee) wordt nu ook afgerond als je de muisknop **buiten** het canvas loslaat
- **Refresh-klok** verplaatst nu correct (anker-positie i.p.v. een sprong buiten het canvas)
- **Multi-select verplaatsen**: de hele selectie én de selectiekaders bewegen nu live mee als je sleept
- Topbalk-ondertitel → "Lambda Generator" (hoofdletters)
- **Fonts**-knop/-venster: de Kleuren-sectie is nu alleen-lezen (kleuren komen automatisch uit het displaytype/model)
- **Gegenereerde YAML**: koptekst volgt de taal (NL/EN), toont de echte add-on-versie en verwijst niet meer naar oude fontnamen
- Light-thema: de raster/snap/uitlijn-balk is nu wit, gelijk aan de bovenbalk

## 2.2.0
- **Shift = 45°-rotatievergrendeling** voor rechthoek, driehoek, veelhoek én meter (zoals de lijn al had)
- **Lijn**: vierkante eindpunt-handvatten + een **rotatie-handvat** (draait de lijn om zijn midden; Shift snapt op 45°)
- **Vaste verhouding bij radiale vormen**: cirkel (met "rond houden" aan), ring, meter en veelhoek tonen nu alleen de hoek-handvatten, zodat de zijkant-handvatten de verhouding niet meer kunnen vervormen
- **Driehoek**: nieuwe optie "verhouding vergrendelen" (zoals de cirkel)
- **Meter/gauge**: rotatie-handvat + starthoek-schuif (Shift snapt op 45°)
- **QR-code**: ECC-niveau instelbaar (LOW/MEDIUM/QUARTILE/HIGH) → komt in het `qr_code:`-blok
- **Wi-Fi**: per niveau nu een MDI-icoonkiezer (klik om te wijzigen) i.p.v. een hex-veld
- **Refresh-klok**: standaard-icoon is nu het refresh-icoon (met echte preview i.p.v. een vierkantje); standaard 24-uurs met een checkbox voor 12-uurs (AM/PM)

## 2.1.0
- **Ring** toegevoegd (buiten-/binnenstraal) → `it.filled_ring`
- **Meter/gauge** toegevoegd (buiten-/binnenstraal + vulling 0–100%) → `it.filled_gauge`, met live cirkelvormige voortgang in de preview
- **QR-code** toegevoegd (inhoud + schaal) → genereert een `qr_code:`-component + `it.qr_code(...)`. In de editor een plaatshouder (ESPHome rendert de echte QR op het device)

## 2.0.0
- **Topbalk- en toolbar-knoppen** hebben nu de HA-knopkleur (#242424 dark / #F0F2F6 light)
- **Model-dropdown** in profiel-instellingen met de volledige ESPHome `waveshare_epaper`-modellijst + beschrijving per model. Het **kleurenpalet past zich aan** het displaytype aan: mono = wit/zwart, BWR = wit/zwart/rood, 7-kleuren = volledige set. Element-kleuren tonen dus alleen wat het display kan
- Profiel-instellingen: de oude vaste regel vervangen door live model-info (beschrijving + kleurtype)
- **Veelhoek (polygon)** toegevoegd aan de elementen (schaal/rotatie/zijden/fill) → exporteert als `it.regular_polygon` / `it.filled_regular_polygon`. **Widget** (icoon+waarde) verwijderd
- Veel meer NL/EN-vertaling: profiel-instellingen, fonts & kleuren, scenario's, YAML-import, icoonkiezer, projectlijst en het "WAITING FOR DATA"-scherm
- Profielnamen/elementnamen volgen de taal (widget-namen-issue opgelost)

## 1.9.5
- **Live-knop** is nu een aan/uit-schakelaar met statusstip: groen = verbonden met Home Assistant, oranje = aan maar geen/onvolledige data (bijv. geen Supervisor-token), rood = verbinding mislukt, grijs ○ = uit
- **Rechter inspector volledig vertaald** (NL/EN): alle groeptitels, labels, dropdowns, hints en knoppen — inclusief grafiek, wifi, klok, waardebron, format/transform en condities

## 1.9.4
- Titelbalk effen gemaakt (geen gradient): #1C1C1C in dark, #FFFFFF in light — consistent met HA. Geldt ook voor de bestandsbeheer-header

## 1.9.3
- Linkerpaneel opgesplitst: het palet ("Add elements") en de Lagen-kop blijven nu vast staan; alleen de **lagenlijst scrollt** als er meer lagen zijn dan passen. De element-knoppen scrollen niet meer mee

## 1.9.2
- Topbalk verhoogd naar 56px zodat hij gelijk loopt met de HA-header
- Scheidingslijn onder "Add elements" 1px gecorrigeerd (39px + rand = exact gelijk aan de toolbar)
- Element-knoppen (palet) iets lager geplaatst met wat ademruimte boven
- Bestandsbeheer-header ook 56px voor consistentie

## 1.9.1
- De scheidingslijn onder "Elementen toevoegen / Add elements" (links) lijnt nu exact uit met de canvas-toolbar (raster/snap-balk): de eerste sectie-header van de zijpanelen is 40px hoog, gelijk aan de toolbar. Werkt in dark én light

## 1.9.0
- **Nieuw HA-stijl dark theme** (standaard): achtergrond #111111, kaarten #1C1C1C, lijnen #343434, HA-achtige tekstkleuren, rondere hoeken (10px), amber/oranje accent. De blauwige tinten zijn eruit. De **vorige (klassieke) dark theme is bewaard** als comment-blok bovenin styles.css voor makkelijke rollback
- **Thema-knop** toont nu het juiste label in beide talen (Dark/Donker, Light/Licht)
- **Schoon startprofiel**: nieuwe/initiële profielen beginnen met **lege waardebronnen** (voeg toe via "Uit Home Assistant") en een minimale generieke fontset. Bronnen en fonts worden per profiel bewaard
- Cache-busting toegevoegd aan `styles.css` zodat thema-updates direct geladen worden

## 1.8.2
- **About-kaart op de Info-pagina** toegevoegd via `eink_studio/README.md` (zoals hassio-add-ons doen met hun `.README.j2`-template): titel, badges en een About-sectie. Dit verschijnt op het Info-tabblad van de add-on
- DOCS.md (Documentation-tab) teruggezet naar de eerdere versie

## 1.8.1
- (teruggedraaid) DOCS.md was tijdelijk herschreven; teruggezet in 1.8.2

## 1.8.0
- **Add-on opties als nette dropdowns** met hoofdletters: Language → Auto/Nederlands/English, Theme → Auto/Light/Dark
- **Optie-labels volgen je HA-taal**: `translations/en.yaml` + `nl.yaml` vertalen de namen/beschrijvingen (Language/Taal, Theme/Thema)
- **Taal- en thema-knoppen terug** in de editor en bestandsbeheerder — maar **sessie-only**: ze worden niet opgeslagen. Bij de volgende keer openen volgt de app weer de config-instelling (autodetectie als die op Auto staat)
- Server normaliseert de gekapitaliseerde optiewaarden (Nederlands→nl, English→en, Light/Dark)

## 1.7.3
- **Taal-autodetectie gefixt**: de in-app EN/NL-knop (en de localStorage-override) is verwijderd — die bleef je keuze onthouden en blokkeerde `auto`. De add-on-optie **language** is nu de enige taalinstelling; `auto` leest betrouwbaar de taal van Home Assistant (via parent/top-frame), daarna de browser
- **Mooiere add-on documentatie** (Documentation-tab): logo, functie-overzicht met iconen, quick-start, voorbeeld-YAML, opslag/SAMBA en configuratie

## 1.7.2
- Rotatie-handle weggehaald bij de grafiek (rotatie was toch preview-only en niet exporteerbaar). De grafiek houdt zijn resize-handvatten

## 1.7.1
- **Rechthoek** heeft nu de rotatie-handle + sleep-handvatten via dezelfde transformer als de driehoek (roteert rond het midden, exporteert correct)
- **Grafiek** heeft nu ook sleep-handvatten + rotatie-handle. Let op: grafiek-rotatie is **alleen voor de preview** — ESPHome tekent grafieken altijd recht (staat als comment in de YAML)
- Multi-select-omlijning veel beter zichtbaar (dikker, helderder, lichte vulling + schaduw)
- Grafiek-uitleg toegevoegd: de golf in de preview is een voorbeeld (echte data verschijnt op het device); Y-as-getallen tonen alleen met een vaste Y-min én Y-max

## 1.7.0
- **Multi-select**: Ctrl/Cmd+klik op canvas én in de lagenlijst selecteert meerdere; Shift+klik in lagen selecteert een reeks; sleep op een leeg canvas trekt een selectiekader (rubber-band). Ctrl+A = alles. Sleep een geselecteerd element om de hele selectie te verplaatsen; Delete/Dupliceren werken op de hele selectie
- **Lagen-rechtermuismenu**: hernoemen, dupliceren, tonen/verbergen, naar voren/achteren, verwijderen
- **Ovaal**: cirkel heeft nu losse Straal X/Y; sleep-handvatten respecteren een nieuwe checkbox "Rond houden (vaste verhouding)". Ovaal exporteert als veelhoek-benadering (ESPHome heeft geen ellipse-primitief)
- **Driehoek**: heeft nu sleep-handvatten (vergroten/verkleinen + roteren via de hoek-handle); "ondersteboven" verwijderd (rotatie volstaat)
- **Vullen** werkt voor cirkel/ovaal, rechthoek en driehoek
- **Tekst-editor** in bestandsbeheer: undo/redo-knoppen (en Ctrl+Z / Ctrl+Y)
- Laag- en elementnamen + tooltips + menu's volgen nu de ingestelde taal (NL/EN)
- SAMBA-pad-badge verwijderd uit de bestandsbeheerder
- Topbalk "v1 · lambda generator" → "lambda generator"; scrollbars bij kleine vensters

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
