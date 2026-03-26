// --- VARIÁVEIS DE CONTROLE ---
let bancoDeDados = {
    pendentes: [],
    conferidos: [],
    foraRota: [],
    duplicados: []
};

// --- 1. FUNÇÃO: EXTRAIR IDs DO HTML (FILTRO REFORÇADO) ---
document.getElementById('extract-btn').onclick = function() {
    const htmlInput = document.getElementById('html-input').value;
    if (!htmlInput) return alert("Por favor, cole o código fonte primeiro!");

    // ESTA LINHA É O FILTRO: 
    // \b\d{13,18}\b pega apenas números entre 13 e 18 dígitos isolados.
    // Isso ignora CEPs (8), Telefones (11) e datas.
    const regex = /\b\d{13,18}\b/g; 
    let encontrados = htmlInput.match(regex) || [];

    if (encontrados.length > 0) {
        // Remove números repetidos e limpa espaços
        bancoDeDados.pendentes = [...new Set(encontrados.map(id => id.trim()))];
        
        // Troca para a tela de bipagem
        document.getElementById('initial-interface').classList.add('d-none');
        document.getElementById('conference-interface').classList.remove('d-none');
        
        atualizarPainel();
        alert(`${bancoDeDados.pendentes.length} IDs de pacotes importados! (Lixos e CEPs ignorados)`);
    } else {
        alert("Nenhum ID válido (com mais de 13 dígitos) foi encontrado.");
    }
};

// --- 2. FUNÇÃO: BIPAGEM (CÓDIGO DE BARRAS) ---
document.getElementById('barcode-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const id = this.value.trim();
        if (!id) return;

        if (bancoDeDados.pendentes.includes(id)) {
            bancoDeDados.pendentes = bancoDeDados.pendentes.filter(p => p !== id);
            bancoDeDados.conferidos.push(id);
            tocarSom(true);
        } else if (bancoDeDados.conferidos.includes(id)) {
            bancoDeDados.duplicados.push(id);
            alert("Pacote já bipado anteriormente!");
        } else {
            bancoDeDados.foraRota.push(id);
            tocarSom(false);
        }

        this.value = ""; 
        atualizarPainel();
    }
});

// --- 3. ATUALIZAÇÃO VISUAL ---
function atualizarPainel() {
    const total = bancoDeDados.pendentes.length + bancoDeDados.conferidos.length;
    document.getElementById('extracted-total').innerText = total;
    document.getElementById('verified-total').innerText = bancoDeDados.conferidos.length;

    const porc = (bancoDeDados.conferidos.length / total) * 100 || 0;
    document.getElementById('progress-bar').style.width = porc + "%";

    document.getElementById('conferidos-list').innerHTML = bancoDeDados.conferidos.map(p => `<li class="list-group-item list-group-item-success">${p}</li>`).join('');
    document.getElementById('faltantes-list').innerHTML = bancoDeDados.pendentes.map(p => `<li class="list-group-item list-group-item-danger">${p}</li>`).join('');
    document.getElementById('fora-rota-list').innerHTML = bancoDeDados.foraRota.map(p => `<li class="list-group-item list-group-item-warning">${p}</li>`).join('');
    document.getElementById('duplicados-list').innerHTML = bancoDeDados.duplicados.map(p => `<li class="list-group-item list-group-item-secondary">${p}</li>`).join('');
}

// --- 4. GERAR MENSAGEM ---
document.getElementById('generate-message').onclick = function() {
    const msg = `*RESUMO CONFERÊNCIA*\n\n✅ Recebidos: ${bancoDeDados.conferidos.length}\n❌ Pendentes: ${bancoDeDados.pendentes.length}\n⚠️ Fora de Rota: ${bancoDeDados.foraRota.length}\n\n*IDs Pendentes:*\n${bancoDeDados.pendentes.join('\n')}`;
    const area = document.getElementById('mensagem-final');
    area.value = msg;
    area.classList.remove('d-none');
};

function tocarSom(sucesso) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(sucesso ? 880 : 300, ctx.currentTime);
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
}

document.getElementById('back-btn').onclick = () => location.reload();
