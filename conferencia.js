// Variáveis para guardar os dados
let idsPendentes = [];
let idsConferidos = [];

// 1. Função para Extrair IDs do HTML colado
document.getElementById('extract-btn').onclick = function() {
    const htmlBruto = document.getElementById('html-input').value;
    if (!htmlBruto) return alert("Cole o HTML primeiro!");

    // Busca por padrões de IDs (exemplo: sequências numéricas de 10+ dígitos)
    const regex = /\d{10,}/g; 
    const encontrados = htmlBruto.match(regex) || [];
    
    if (encontrados.length > 0) {
        idsPendentes = [...new Set(encontrados)]; // Remove duplicados
        atualizarListas();
        document.getElementById('initial-interface').classList.add('d-none');
        document.getElementById('conference-interface').classList.remove('d-none');
        alert(idsPendentes.length + " IDs importados com sucesso!");
    } else {
        alert("Nenhum ID encontrado no texto colado.");
    }
};

// 2. Função para Processar a Bipagem (Código de Barras)
document.getElementById('barcode-input').onkeypress = function(e) {
    if (e.key === 'Enter') {
        const id = this.value.trim();
        if (!id) return;

        if (idsPendentes.includes(id)) {
            idsPendentes = idsPendentes.filter(item => item !== id);
            idsConferidos.push(id);
            tocarSom(true);
        } else {
            alert("ID não encontrado ou já conferido!");
            tocarSom(false);
        }

        this.value = ""; // Limpa o campo para o próximo bibe
        atualizarListas();
    }
};

// 3. Atualizar a tela com os números
function atualizarListas() {
    document.getElementById('extracted-total').innerText = idsPendentes.length + idsConferidos.length;
    document.getElementById('verified-total').innerText = idsConferidos.length;
    
    // Atualiza as listas visuais
    document.getElementById('conferidos-list').innerHTML = idsConferidos.map(id => `<li class="list-group-item text-success">${id}</li>`).join('');
    document.getElementById('faltantes-list').innerHTML = idsPendentes.map(id => `<li class="list-group-item text-danger">${id}</li>`).join('');
    
    // Barra de progresso
    const total = idsPendentes.length + idsConferidos.length;
    const porcentagem = (idsConferidos.length / total) * 100;
    document.getElementById('progress-bar').style.width = porcentagem + "%";
}

// 4. Gerar Mensagem de Fechamento
document.getElementById('generate-message').onclick = function() {
    const mensagem = `*FECHAMENTO DE ROTA*\n\n✅ Conferidos: ${idsConferidos.length}\n❌ Pendentes: ${idsPendentes.length}\n\nIDs Pendentes:\n${idsPendentes.join('\n')}`;
    const campoTexto = document.getElementById('mensagem-final');
    campoTexto.value = mensagem;
    campoTexto.classList.remove('d-none');
    document.getElementById('copy-message').classList.remove('d-none');
};

// Botão de Voltar
document.getElementById('back-btn').onclick = function() {
    location.reload(); // Recarrega a página para resetar
};

function tocarSom(sucesso) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(sucesso ? 880 : 220, audioCtx.currentTime);
    osc.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}
