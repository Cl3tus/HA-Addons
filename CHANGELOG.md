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
