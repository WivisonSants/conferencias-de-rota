// --- VARIÁVEIS DE CONTROLE ---
let bancoDeDados = {
    pendentes: [],
    conferidos: [],
    foraRota: [],
    duplicados: []
};

// --- 1. FUNÇÃO: EXTRAIR IDs (CALIBRADA PARA 11 DÍGITOS) ---
document.getElementById('extract-btn').onclick = function() {
    const htmlInput = document.getElementById('html-input').value;
    if (!htmlInput) return alert("Por favor, cole o código fonte primeiro!");

    // Esta regex busca exatamente sequências de 11 dígitos que:
    // 1. Não comecem com 0 (comum em códigos de erro)
    // 2. Não tenham formato de celular (ex: 99xxx)
    const regex = /\b[1-8]\d{10}\b/g; 
    
    let encontrados = htmlInput.match(regex) || [];

    if (encontrados.length > 0) {
        // Filtro para garantir que não pegamos números repetidos
        bancoDeDados.pendentes = [...new Set(encontrados)];
        
        document.getElementById('initial-interface').classList.add('d-none');
        document.getElementById('conference-interface').classList.remove('d-none');
        
        atualizarPainel();
        alert(`${bancoDeDados.pendentes.length} IDs de 11 dígitos capturados!`);
    } else {
        alert("Não encontramos IDs com 11 dígitos. Verifique o código colado.");
    }
};

// --- 2. BIPAGEM ---
document.getElementById('barcode-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const id = this.value.trim();
        if (!id) return;

        if (bancoDeDados.pendentes.includes(id)) {
            bancoDeDados.pendentes = bancoDeDados.pendentes.filter(p => p !== id);
            bancoDeDados.conferidos.push(id);
            tocarSom(880); // Som agudo (Sucesso)
        } else if (bancoDeDados.conferidos.includes(id)) {
            alert("Pacote já foi conferido!");
        } else {
            bancoDeDados.foraRota.push(id);
            tocarSom(300); // Som grave (Fora de Rota)
        }

        this.value = ""; 
        atualizarPainel();
    }
});

// --- 3. ATUALIZAÇÃO DA TELA ---
function atualizarPainel() {
    const total = bancoDeDados.pendentes.length + bancoDeDados.conferidos.length;
    document.getElementById('extracted-total').innerText = total;
    document.getElementById('verified-total').innerText = bancoDeDados.conferidos.length;

    const porc = (bancoDeDados.conferidos.length / total) * 100 || 0;
    document.getElementById('progress-bar').style.width = porc + "%";

    document.getElementById('conferidos-list').innerHTML = bancoDeDados.conferidos.map(p => `<li class="list-group-item list-group-item-success">${p}</li>`).join('');
    document.getElementById('faltantes-list').innerHTML = bancoDeDados.pendentes.map(p => `<li class="list-group-item list-group-item-danger">${p}</li>`).join('');
    document.getElementById('fora-rota-list').innerHTML = bancoDeDados.foraRota.map(p => `<li class="list-group-item list-group-item-warning">${p}</li>`).join('');
}

function tocarSom(freq) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
}

document.getElementById('back-btn').onclick = () => location.reload();
