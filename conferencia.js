// --- VARIÁVEIS DE CONTROLE ---
let bancoDeDados = {
    pendentes: [],
    conferidos: [],
    foraRota: [],
    duplicados: []
};

// --- 1. FUNÇÃO: EXTRAIR IDs (ESPECÍFICO MERCADO LIVRE / ADMINML) ---
document.getElementById('extract-btn').onclick = function() {
    const htmlInput = document.getElementById('html-input').value;
    if (!htmlInput) return alert("Por favor, cole o código fonte!");

    // Criamos um elemento invisível para processar o HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlInput, 'text/html');

    let encontrados = [];

    // BUSCA 1: Procura por links de rastreio ou IDs dentro de tabelas
    // O Mercado Livre costuma usar links que contém o ID ou células específicas
    const linksEcelulas = doc.querySelectorAll('a, td, span, div, p');
    
    linksEcelulas.forEach(el => {
        const texto = el.innerText.trim();
        // Regex para IDs de 11 dígitos (Ex: 46653709361)
        if (/^\d{11}$/.test(texto)) {
            encontrados.push(texto);
        }
        
        // BUSCA 2: Se o ID estiver "sujo" dentro de um link (ex: ...detail/46653709361)
        const href = el.getAttribute('href') || '';
        const matchHref = href.match(/\d{11}/);
        if (matchHref) {
            encontrados.push(matchHref[0]);
        }
    });

    // BUSCA 3: Caso o usuário tenha copiado apenas o texto (Regex de Segurança)
    if (encontrados.length === 0) {
        // Busca sequências de 11 dígitos que NÃO sejam anos (ex: 2024, 2025) 
        // e que comecem com números típicos de pacotes (geralmente 4...)
        const regexGeral = /\b4\d{10}\b/g; 
        const matchGeral = htmlInput.match(regexGeral);
        if (matchGeral) encontrados = matchGeral;
    }

    if (encontrados.length > 0) {
        // Limpeza: remove duplicados e IDs de sistema (como IDs de rota que você não quer conferir)
        // IDs de pacotes ML geralmente começam com 4.
        bancoDeDados.pendentes = [...new Set(encontrados)].filter(id => id.length === 11);
        
        // Muda para a tela de bipagem
        document.getElementById('initial-interface').classList.add('d-none');
        document.getElementById('conference-interface').classList.remove('d-none');
        
        atualizarPainel();
        alert(`Sucesso! ${bancoDeDados.pendentes.length} pacotes encontrados nesta rota.`);
    } else {
        alert("Não encontramos os IDs de 11 dígitos. Certifique-se de copiar a página de DETALHE DA ROTA.");
    }
};

// --- 2. LÓGICA DE BIPAGEM ---
document.getElementById('barcode-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const id = this.value.trim();
        if (!id) return;

        if (bancoDeDados.pendentes.includes(id)) {
            bancoDeDados.pendentes = bancoDeDados.pendentes.filter(p => p !== id);
            bancoDeDados.conferidos.push(id);
            tocarSom(880); // Sucesso
        } else if (bancoDeDados.conferidos.includes(id)) {
            alert("Este pacote já foi bipado!");
        } else {
            bancoDeDados.foraRota.push(id);
            tocarSom(300); // Erro
        }

        this.value = ""; 
        atualizarPainel();
    }
});

// --- 3. ATUALIZAÇÃO VISUAL ---
function atualizarPainel() {
    document.getElementById('extracted-total').innerText = bancoDeDados.pendentes.length + bancoDeDados.conferidos.length;
    document.getElementById('verified-total').innerText = bancoDeDados.conferidos.length;

    const total = bancoDeDados.pendentes.length + bancoDeDados.conferidos.length;
    const porc = (bancoDeDados.conferidos.length / total) * 100 || 0;
    document.getElementById('progress-bar').style.width = porc + "%";

    document.getElementById('conferidos-list').innerHTML = bancoDeDados.conferidos.map(p => `<li class="list-group-item list-group-item-success" style="padding:2px 10px; font-size:12px;">${p}</li>`).join('');
    document.getElementById('faltantes-list').innerHTML = bancoDeDados.pendentes.map(p => `<li class="list-group-item list-group-item-danger" style="padding:2px 10px; font-size:12px;">${p}</li>`).join('');
    document.getElementById('fora-rota-list').innerHTML = bancoDeDados.foraRota.map(p => `<li class="list-group-item list-group-item-warning" style="padding:2px 10px; font-size:12px;">${p}</li>`).join('');
}

function tocarSom(freq) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
}

document.getElementById('back-btn').onclick = () => location.reload();
