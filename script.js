async function caricaDati() {
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('Errore nel caricamento di data.json');

    const data = await res.json();

    document.getElementById('livello_cm').textContent = data.livello_cm ?? '--';
    document.getElementById('livello_percento').textContent = data.livello_percento ?? '--';
    document.getElementById('batteria_volt').textContent = data.batteria_volt ?? '--';
    document.getElementById('batteria_percento').textContent = data.batteria_percento ?? '--';
    document.getElementById('data_ora').textContent = data.data_ora ?? '--';
    document.getElementById('modalita').textContent = data.modalita ?? '--';
  } catch (e) {
    console.error(e);
  }
}

caricaDati();
setInterval(caricaDati, 60000); // aggiorna ogni 60 secondi
