let bancoDeDados = {
    pendentes: [],
    conferidos: [],
    foraRota: [],
    idRota: "",
    nomeRota: ""
};

// --- EXTRAÇÃO ---
document.getElementById('extract-btn').onclick = function() {
    const htmlInput = document.getElementById('html-input').value;
    if (!htmlInput) return alert("Por favor, cole o HTML!");

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlInput, 'text/html');

    // Captura dados da rota
    const rotaMatch = htmlInput.match(/detail\/(\d+)/);
    bancoDeDados.idRota = rotaMatch ? rotaMatch[1] : "Não identificado";
    
    const titulo = doc.querySelector('title')?.innerText || "";
    bancoDeDados.nomeRota = titulo.includes('|') ? titulo.split('|')[1].trim() : "Filtro";

    // Filtro de IDs de 11 dígitos
    let encontrados = [];
    const elementos = doc.querySelectorAll('a, td, span, div, p');
    elementos.forEach(el => {
        const txt = el.innerText.trim();
        if (/^\d{11}$/.test(txt)) encontrados.push(txt);
        
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
        alert("Nenhum pacote encontrado. Verifique se o HTML está correto.");
    }
};

// --- BIPAGEM ---
document.getElementById('barcode-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const id = this.value.trim();
        if (!id) return;

        if (bancoDeDados.pendentes.includes(id)) {
            bancoDeDados.pendentes = bancoDeDados.pendentes.filter(p => p !== id);
            bancoDeDados.conferidos.push(id);
            tocarSom(880);
        } else if (!bancoDeDados.conferidos.includes(id)) {
            if (!bancoDeDados.foraRota.includes(id)) {
                bancoDeDados.foraRota.push(id);
                tocarSom(300);
            }
        }

        this.value = ""; 
        atualizarPainel();
    }
});

// --- RELATÓRIO ---
document.getElementById('generate-report-btn').onclick = function() {
    const agora = new Date();
    const hora = agora.getHours().toString().padStart(2, '0');
    const min = agora.getMinutes().toString().padStart(2, '0');
    
    const total = bancoDeDados.pendentes.length + bancoDeDados.conferidos.length;
    const ds = total > 0 ? ((bancoDeDados.conferidos.length / total) * 100).toFixed(1) : "0.0";

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

    bancoDeDados.foraRota.forEach(id => msg += `${id}: Pacote de outra área\n`);
    bancoDeDados.pendentes.forEach(id => msg += `${id}: pendente\n`);

    navigator.clipboard.writeText(msg).then(() => alert("Relatório copiado para o WhatsApp!"));
};

// --- AUXILIARES ---
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
