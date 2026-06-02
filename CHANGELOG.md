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
