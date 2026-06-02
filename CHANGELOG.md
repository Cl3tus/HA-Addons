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
