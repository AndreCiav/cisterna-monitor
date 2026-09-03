const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}`;
const API_BASE = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents`;

let grafico = null;
const $ = id => document.getElementById(id);

async function githubGet(path) {
  const r = await fetch(`${API_BASE}/${path}?t=${Date.now()}`, {
    headers: { 
      "Accept": "application/vnd.github+json", 
      "Authorization": `Bearer ${GITHUB_TOKEN}` 
    }
  });
  if (!r.ok) throw new Error(`GitHub GET ${path}: ${r.status}`);
  return r.json();
}

async function readJSON(path) {
  const r = await fetch(`${RAW_BASE}/${path}?t=${Date.now()}`);
  if (!r.ok) throw new Error(`Lettura ${path}: ${r.status}`);
  return r.json();
}

function setText(id, value) { if ($(id)) $(id).textContent = value; }
function fmt(n, d=1) { return Number(n || 0).toFixed(d); }

async function aggiornaDati() {
  try {
    const d = await readJSON("data.json");
    setText("acqua", `${fmt(d.percentualeAcqua)} %`);
    setText("altezza", `${fmt(d.altezzaAcqua)} cm`);
    setText("distanza", `${fmt(d.distanzaAcqua)} cm`);
    setText("litri", `${fmt(d.litriAttuali,0)} / ${fmt(d.litriTotali,0)} L`);
    setText("batteria", `${fmt(d.percentualeBatteria,0)} %`);
    setText("volt", `${fmt(d.voltBatteria,2)} V`);
    setText("modo", d.modalitaRisparmio ? "Risparmio energetico" : "Attivo");
    setText("ultimo", d.ultimoAggiornamento || "N/D");
    setText("prossimo", d.prossimoAggiornamento || "N/D");
    
    const err = [];
    if (d.erroreUltrasuoni) err.push("Ultrasuoni");
    if (d.erroreBatteria) err.push("Batteria");
    if (d.erroreNTP) err.push("NTP");
    if (d.erroreAPI) err.push("GitHub");
    setText("errori", err.length ? err.join(" • ") : "Nessun errore");
    setText("stato", d.erroreAPI ? "ERRORE" : "ONLINE");
  } catch (e) {
    setText("stato", "ERRORE");
    setText("errori", e.message);
  }
}

async function caricaStorico() {
  try {
    const r = await fetch(`${RAW_BASE}/storico.csv?t=${Date.now()}`);
    if (!r.ok) throw new Error("Storico non disponibile");
    const text = await r.text();
    
    const lines = text.trim().split(/\r?\n/).filter(line => line.trim() !== "");
    const labels = [], values = [];
    
    for (const line of lines) {
      const p = line.split(",");
      if (p.length >= 4 && !isNaN(parseFloat(p[3]))) { 
        labels.push(p[0].replace("T", " ").substring(0, 16));
        values.push(Number(p[3])); 
      }
    }
    
    if (grafico) grafico.destroy();
    grafico = new Chart($("grafico"), {
      type: "line",
      data: { 
        labels, 
        datasets: [{ 
          label: "Livello acqua %", 
          data: values, 
          borderColor: "#007bcc",
          backgroundColor: "rgba(0,123,204,0.1)",
          fill: true,
          tension: 0.2 
        }] 
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  } catch (e) { console.warn("Storico:", e.message); }
}

async function aggiornaTutto() {
  await aggiornaDati();
  await caricaStorico();
}

// Avvio iniziale
aggiornaTutto();

// Aggiornamento automatico periodico dei dati e dello storico senza ricaricare la pagina
setInterval(aggiornaDati, 30000);   // Aggiorna i dati ogni 30 secondi
setInterval(caricaStorico, 60000);  // Aggiorna il grafico ogni 60 secondi
