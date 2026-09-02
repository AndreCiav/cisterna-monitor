const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/${GITHUB_BRANCH}`;
const API_BASE = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents`;

let grafico = null;
const $ = id => document.getElementById(id);

async function githubGet(path) {
  const r = await fetch(`${API_BASE}/${path}?t=${Date.now()}`, {
    headers: { "Accept": "application/vnd.github+json", "Authorization": `Bearer ${GITHUB_TOKEN}` }
  });
  if (!r.ok) throw new Error(`GitHub GET ${r.status}`);
  return r.json();
}

async function readJSON(path) {
  const r = await fetch(`${RAW_BASE}/${path}?t=${Date.now()}`);
  if (!r.ok) throw new Error(`Lettura ${path}: ${r.status}`);
  return r.json();
}

function decodeBase64(base64) {
  const binary = atob(base64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

async function writeGitHubFile(path, text, message) {
  const old = await githubGet(path);
  const body = {
    message,
    content: encodeBase64(text),
    branch: GITHUB_BRANCH,
    sha: old.sha
  };
  const r = await fetch(`${API_BASE}/${path}`, {
    method: "PUT",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`Scrittura ${path}: ${r.status}`);
}

function setText(id, value) { if ($(id)) $(id).textContent = value; }
function fmt(n, d=1) { return Number(n || 0).toFixed(d); }

async function aggiornaDati() {
  try {
    const d = await readJSON("github/data.json");
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

async function caricaConfigurazione() {
  try {
    const c = await readJSON("github/config.json");
    $("s1").value = c.altezzaSensore;
    $("s2").value = c.altezzaCisterna;
    $("s3").value = c.lato1;
    $("s4").value = c.lato2;
    $("s5").checked = !!c.modalitaRisparmio;
    $("s6").checked = !!c.salvaStorico;
  } catch (e) { setText("errori", e.message); }
}

async function salvaConfig() {
  const c = {
    altezzaSensore: Number($("s1").value),
    altezzaCisterna: Number($("s2").value),
    lato1: Number($("s3").value),
    lato2: Number($("s4").value),
    modalitaRisparmio: $("s5").checked,
    salvaStorico: $("s6").checked
  };
  if (c.altezzaSensore < c.altezzaCisterna) return alert("L'altezza del sensore deve essere >= altezza della cisterna.");
  try {
    await writeGitHubFile("github/config.json", JSON.stringify(c, null, 2), "Aggiornamento configurazione cisterna");
    alert("Configurazione salvata. L'ESP32 la leggerà al prossimo controllo.");
    aggiornaDati();
  } catch (e) { alert("Errore: " + e.message); }
}

async function caricaStorico() {
  try {
    const r = await fetch(`${RAW_BASE}/github/storico.csv?t=${Date.now()}`);
    if (!r.ok) throw new Error("Storico non disponibile");
    const text = await r.text();
    const lines = text.trim().split(/\r?\n/).slice(1);
    const labels = [], values = [];
    for (const line of lines) {
      const p = line.split(",");
      if (p.length >= 4) { labels.push(p[0]); values.push(Number(p[3])); }
    }
    if (grafico) grafico.destroy();
    grafico = new Chart($("grafico"), {
      type: "line",
      data: { labels, datasets: [{ label: "Livello acqua %", data: values, tension: 0.2 }] },
      options: { responsive: true, maintainAspectRatio: false }
    });
  } catch (e) { setText("errori", e.message); }
}

async function aggiornaTutto() {
  await aggiornaDati();
  await caricaConfigurazione();
  await caricaStorico();
}

aggiornaTutto();
setInterval(aggiornaDati, 30000);
setInterval(caricaStorico, 60000);
