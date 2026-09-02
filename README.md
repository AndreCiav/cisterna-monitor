# Monitor Cisterna ESP32 - SENZA Cloudflare Worker

## Cosa contiene
- `ESP32/cisterna.ino` firmware completo
- `github/config.json` configurazione
- `github/data.json` ultimo dato
- `github/storico.csv` storico
- `website/` sito web

## Architettura
ESP32 <-> GitHub API
Sito web <-> GitHub API / GitHub Raw

Non viene utilizzato Cloudflare Worker.

## 1. GitHub
Crea un repository pubblico, ad esempio `cisterna-monitor`, e carica le cartelle `github` e `website`.

Il Personal Access Token deve avere accesso al repository e permesso `Contents: Read and write`.

## 2. ESP32
Apri `ESP32/cisterna.ino` e compila questi valori:
- WIFI_SSID
- WIFI_PASSWORD
- GITHUB_USER
- GITHUB_REPO
- GITHUB_TOKEN

Il token viene inserito nel firmware come richiesto.

## 3. Sito
Apri `website/config.js` e inserisci gli stessi:
- GITHUB_USER
- GITHUB_REPO
- GITHUB_TOKEN

ATTENZIONE: il token nel sito è visibile a chiunque visiti la pagina. Per questo progetto usa preferibilmente un token dedicato e un repository dedicato.

## 4. GitHub Pages
Pubblica la cartella `website` come sito GitHub Pages. Se GitHub Pages richiede una cartella standard, copia i quattro file della cartella `website` nella root del repository oppure nella cartella `docs`.

## 5. Librerie Arduino
- ArduinoJson
- Adafruit SSD1306
- Adafruit GFX Library

## Pin
- GPIO34: misura batteria tramite partitore
- GPIO5: TRIG JSN-SR04T
- GPIO18: ECHO JSN-SR04T tramite partitore di tensione
- GPIO21: SDA OLED
- GPIO22: SCL OLED
- GPIO23: selettore modalità, LOW = modalità attiva

## Modalità
- Attiva: una misurazione ogni 2 minuti.
- Risparmio: finestra 58,59,00,01; una misurazione per minuto, poi deep sleep fino al minuto 58 dell'ora successiva.

## Sicurezza
Questa versione volutamente non usa Cloudflare. Il token GitHub è nel firmware ESP32 e, per permettere al sito di modificare `config.json`, anche nel JavaScript del sito. Il token del sito è quindi pubblico. Per maggiore sicurezza, in futuro si può tornare a un backend come Cloudflare Worker.
