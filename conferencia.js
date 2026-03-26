// Variáveis de controle
let dadosRota = {
    unidade: "",
    rota: "",
    idsPendentes: [],
    idsConferidos: [],
    foraDeRota: []
};

// --- 1. FUNÇÃO PARA PUXAR DADOS DO CÓDIGO FONTE HTML ---
document.getElementById('extract-btn').onclick = function() {
    const htmlBruto = document.getElementById('html-input').value;
    if (!htmlBruto) return alert("Por favor, cole o código fonte HTML primeiro.");

    // Regex para buscar IDs (ajustado para o padrão comum de 10 a 20 dígitos)
    const regexIDs = /\d{10,20}/g;
    const encontrados = htmlBruto.match(regexIDs) || [];

    if (encontrados.length > 0) {
        // Remove duplicados e limpa espaços
        dadosRota.idsPendentes = [...new Set(encontrados.map(id => id.trim()))];
        
        // Tenta achar o nome da rota ou unidade no meio do HTML (opcional)
        const buscaUnidade = htmlBruto.match(/Facility:\s*([\w\s]+)/);
        dadosRota.unidade = buscaUnidade ? buscaUnidade[1] : "Unidade Não Identificada";

        iniciarInterfaceConferencia();
    } else {
        alert("Nenhum ID de pacote foi encontrado nesse HTML. Verifique se copiou o código correto.");
    }
};

// --- 2. FUNÇÃO PARA IMPORTAR ARQUIVOS (CSV/XLSX) ---
document.getElementById('check-csv').onclick = function() {
    const fileInput = document.getElementById('csv-input');
    const file = fileInput.files[0];

    if (!file) return alert("Selecione um arquivo CSV ou Excel primeiro.");

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = e.target.result;
        // Se for Excel, usamos a biblioteca XLSX (que já está no seu HTML)
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { header: 1 });

        // Extrai todos os números longos encontrados nas células do arquivo
        let idsArquivo = [];
        rows.forEach(row => {
            row.forEach(cell => {
                if (cell && cell.toString().match(/\d{10,}/)) {
                    idsArquivo.push(cell.toString().trim());
                }
            });
        });

        if (idsArquivo.length > 0) {
            dadosRota.idsPendentes = [...new Set(idsArquivo)];
            iniciarInterfaceConferencia();
        } else {
            alert("Não encontramos IDs válidos dentro do arquivo.");
        }
    };
    reader.readAsBinaryString(file);
};

// --- 3. LÓGICA DE CONFERÊNCIA (BIPAGEM) ---
function iniciarInterfaceConferencia() {
    document.getElementById('initial-interface').classList.add('d-none');
    document.getElementById('conference-interface').classList.remove('d-none');
    document.getElementById('destination-facility-title').innerText = dadosRota.unidade;
    atualizarTelas();
}

document.getElementById('barcode-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const idBipado = this.value.trim();
        if (!idBipado) return;

        if (dadosRota.idsPendentes.includes(idBipado)) {
            // Sucesso: estava pendente
            dadosRota.idsPendentes = dadosRota.idsPendentes.filter(id => id !== idBipado);
            dadosRota.idsConferidos.push(idBipado);
            emitirSom(880); // Som agudo (sucesso)
        } else if (dadosRota.idsConferidos.includes(idBipado)) {
            alert("Este pacote já foi bipado!");
        } else {
            // Fora de rota
            dadosRota.foraDeRota.push(idBipado);
            emitirSom(220); // Som grave (erro)
        }

        this.value = ""; // Limpa campo
        atualizarTelas();
    }
});

// --- 4. ATUALIZAÇÃO VISUAL ---
function atualizarTelas() {
    document.getElementById('extracted-total').innerText = dadosRota.idsPendentes.length + dadosRota.idsConferidos.length;
    document.getElementById('verified-total').innerText = dadosRota.idsConferidos.length;

    // Listas HTML
    document.getElementById('conferidos-list').innerHTML = dadosRota.idsConferidos.map(id => `<li class="list-group-item list-group-item-success">${id}</li>`).join('');
    document.getElementById('faltantes-list').innerHTML = dadosRota.idsPendentes.map(id => `<li class="list-group-item list-group-item-danger">${id}</li>`).join('');
    document.getElementById('fora-rota-list').innerHTML = dadosRota.foraDeRota.map(id => `<li class="list-group-item list-group-item-warning">${id}</li>`).join('');

    // Barra de progresso
    const total = dadosRota.idsPendentes.length + dadosRota.idsConferidos.length;
    const progresso = (dadosRota.idsConferidos.length / total) * 100 || 0;
    document.getElementById('progress-bar').style.width = progresso + "%";
}

// --- 5. SONS E UTILITÁRIOS ---
function emitirSom(freq) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
}

document.getElementById('back-btn').onclick = () => location.reload();
