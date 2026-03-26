// --- BANCO DE DADOS LOCAL ---
let bancoDeDados = {
    pendentes: [],
    conferidos: [],
    foraRota: [],
    idRota: "",
    nomeRota: ""
};

// --- 1. EXTRAIR IDs E DADOS DA ROTA ---
document.getElementById('extract-btn').onclick = function() {
    const htmlInput = document.getElementById('html-input').value;
    if (!htmlInput) return alert("Cole o HTML primeiro!");

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlInput, 'text/html');

    // Captura ID da Rota (Link) e Nome (Título)
    const rotaMatch = htmlInput.match(/detail\/(\d+)/);
    bancoDeDados.idRota = rotaMatch ? rotaMatch[1] : "Não identificado";
    
    const titulo = doc.querySelector('title')?.innerText || "";
    bancoDeDados.nomeRota = titulo.includes('|') ? titulo.split('|')[1].trim() : "Rota";

    // Busca IDs de 11 dígitos (Filtro que resolvemos)
    let encontrados = [];
    const nos = doc.querySelectorAll('a, td, span, div, p');
    nos.forEach(el => {
        const texto = el.innerText.trim();
        if (/^\d{11}$/.test(texto)) encontrados.push(texto);
        
        const href = el.getAttribute('href') || '';
        const matchHref = href.match(/\d{11}/);
        if (matchHref) encontrados.push(matchHref[0]);
    });

    if (encontrados.length > 0) {
        bancoDeDados.pendentes = [...new Set(encontrados)];
        bancoDeDados.conferidos = [];
        bancoDeDados.foraRota = [];
        
        document.getElementById('initial-interface').classList.add('d-none');
        document.getElementById('conference-interface').classList.remove('d-none');
        atualizarPainel();
    } else {
        alert("Nenhum ID de 11 dígitos encontrado no HTML.");
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
            tocarSom(880); // Som Agudo (Sucesso)
        } else if (!bancoDeDados.conferidos.includes(id)) {
            bancoDeDados.foraRota.push(id);
            tocarSom(300); // Som Grave (Erro/Fora de Rota)
        }

        this.value = ""; 
        atualizarPainel();
    }
});

// --- 3. GERADOR DE RELATÓRIO WHATSAPP ---
document.getElementById('generate-report-btn').onclick = function() {
    const agora = new Date();
    const hora = agora.getHours().toString().padStart(2, '0');
    const min = agora.getMinutes().toString().padStart(2, '0');
    
    const total = bancoDeDados.pendentes.length + bancoDeDados.conferidos.length;
    const entregues = bancoDeDados.conferidos.length;
    const ds = total > 0 ? ((entregues / total) * 100).toFixed(1) : "0.0";

    let msg = `↩ RTS - Rota: ${bancoDeDados.idRota}\n`;
    msg += `🏭 SVC/XPT: EMN1 - Imperatriz\n`;
    msg += `🎯 Metas: %DS - 99% | ORHC - 85% (não alterar)\n`;
    msg += `🕗 ORHC: ${hora}:${min} h\n`;
    msg += `🟢 %DS - Entregues: ${ds} %\n`;
    msg += `🟡 Pendentes/Não Visitados: ${bancoDeDados.pendentes.length}\n`;
    msg += `🔴 Insucessos: ${bancoDeDados.foraRota.length}\n\n`;
    msg += `♎ Justificativa:\n`;
    msg += `Rota ${bancoDeDados.nomeRota}\n`;
    msg += `rodacoop | Motorista\n\n`;

    // Adiciona IDs de Insucesso
    bancoDeDados.foraRota.forEach(id => {
        msg += `${id}: Pacote de outra área\n`;
    });

    // Adiciona IDs Pendentes
    bancoDeDados.pendentes.forEach(id => {
        msg += `${id}: pendente\n`;
    });

    navigator.clipboard.writeText(msg).then(() => {
        alert("Relatório copiado! Agora cole no WhatsApp.");
    });
};

// --- FUNÇÕES DE APOIO ---
function atualizarPainel() {
    document.getElementById('extracted-total').innerText = bancoDeDados.pendentes.length + bancoDeDados.conferidos.length;
    document.getElementById('verified-total').innerText = bancoDeDados.conferidos.length;
    
    document.getElementById('conferidos-list').innerHTML = bancoDeDados.conferidos.map(p => `<li class="list-group-item list-group-item-success">${p}</li>`).join('');
    document.getElementById('faltantes-list').innerHTML = bancoDeDados.pendentes.map(p => `<li class="list-group-item list-group-item-danger">${p}</li>`).join('');
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
