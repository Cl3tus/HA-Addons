# E-ink Studio

WYSIWYG-editor voor ESPHome e-ink displays, als Home Assistant add-on. Ontwerp je
display-layout visueel en genereer de ESPHome `lambda` + bijbehorende YAML.

## Functies
- Volledige editor in de HA-zijbalk (Ingress, geen apart tabblad nodig).
- **Live preview**: leest read-only de states van Home Assistant, zodat de preview echte
  sensorwaarden toont. Klik op **○ Live** in de bovenbalk om te verversen.
- Fonts en projecten worden **in de add-on** bewaard (persistent `/data`-volume). Er wordt
  niets naar je ESPHome-config geschreven.
- Alle libraries (Konva, js-yaml, Material Design Icons, IBM Plex, Noto/Roboto) zijn
  **meegebundeld** — werkt zonder internet.

## Gebruik
1. Open **E-ink Studio** in de zijbalk.
2. Ontwerp je layout; kies bij elk waarde-element de juiste HA-sensor.
3. Klik **○ Live** om echte data in de preview te laden (alle entiteiten worden opgehaald;
   je filtert/kiest ze in de UI).
4. **Genereer YAML** → kopieer of download, en plak in je ESPHome-config.

## Opslag
- Projecten: `/data/projects/*.json` — **Opslaan** schrijft hierheen, **Openen** toont de lijst.
- Fonts: `/data/fonts/*` — geüploade TTF's worden hierheen gekopieerd (persistent).

Binnen de add-on gebruiken Opslaan/Openen automatisch deze centrale opslag (i.p.v. de browser).
Buiten de add-on (standalone in een browser) valt het terug op bestand-download/-upload.
Beide blijven bewaard bij herstart/update van de add-on.

## Let op
- De add-on schrijft **niet** naar je ESPHome-config of fonts-map (preview-only, zoals gekozen).
- Voor een exacte preview van eigen fonts (digital.ttf, GothamRnd-Book.ttf): upload ze via
  **Fonts & kleuren**. Material Design Icons (v7.4.47) zit al ingebouwd.
