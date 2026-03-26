<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conferência de Rota - EMN1</title>
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
  <link rel="stylesheet" href="https://onildopr.github.io/rodacoop.ui/css/rodacoop.css">
  <style>
    .list-section { max-height: 300px; overflow-y: auto; font-size: 12px; font-family: monospace; border: 1px solid #eee; border-radius: 4px; padding: 5px; }
    .brand-card { border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #ddd; }
    .list-group-item { padding: 4px 8px !important; margin-bottom: 2px; border: none; border-radius: 4px; }
    .bg-pendente { background-color: #f8d7da; color: #721c24; }
    .bg-conferido { background-color: #d4edda; color: #155724; }
    .bg-fora { background-color: #fff3cd; color: #856404; }
  </style>
</head>
<body class="rk-scope">

<div class="container pt-4">
  <div class="row">
    <div class="col-sm-1"></div>
    <div class="col-sm-10">
      
      <div id="initial-interface">
        <div class="text-center mb-3">
          <h2 class="brand-title">Conferência de Rota</h2>
          <div class="brand-subtle">Filtro de IDs 11 dígitos • EMN1</div>
        </div>

        <div class="card mb-3 brand-card">
          <div class="card-body">
            <h5 class="mb-2 brand-title" style="font-size:16px;">Importar Dados</h5>
            <textarea id="html-input" class="form-control mb-3" rows="8" placeholder="Cole o código HTML bruto da rota aqui (Ctrl+U e Ctrl+A)..."></textarea>
            <button id="extract-btn" class="btn btn-primary btn-block">Iniciar Conferência da Rota</button>
          </div>
        </div>
      </div>

      <div id="conference-interface" class="d-none">
        <div class="text-center mb-3">
          <h2 id="route-title" class="brand-title">Carregando Rota...</h2>
          <div id="id-rota-display" class="brand-subtle text-muted">ID: ---</div>
        </div>

        <div class="card mb-3 brand-card">
          <div class="card-body">
            <div class="row text-center">
              <div class="col-6">
                <div class="brand-subtle">TOTAL NA ROTA</div>
                <h4 id="extracted-total">0</h4>
              </div>
              <div class="col-6">
                <div class="brand-subtle text-success">RECEBIDOS (BIPADOS)</div>
                <h4 id="verified-total">0</h4>
              </div>
            </div>
          </div>
        </div>

        <input type="text" id="barcode-input" class="form-control form-control-lg text-center mb-3" placeholder="Leia o código de barras ou digite o ID" autofocus>

        <div class="row text-center mt-4">
          <div class="col-md-4">
            <h6 class="text-success">✅ Recebidos</h6>
            <div id="conferidos-list" class="list-section"></div>
          </div>
          <div class="col-md-4">
            <h6 class="text-danger">❌ Pendentes</h6>
            <div id="faltantes-list" class="list-section"></div>
          </div>
          <div class="col-md-4">
            <h6 class="text-warning">⚠️ Fora de Rota</h6>
            <div id="fora-rota-list" class="list-section"></div>
          </div>
        </div>

        <div class="text-center my-4">
          <button id="generate-report-btn" class="btn btn-success btn-block mb-2">GERAR MENSAGEM WHATSAPP 🚀</button>
          <button onclick="location.reload()" class="btn btn-outline-secondary btn-block btn-sm">Reiniciar Sistema</button>
        </div>
      </div>

    </div>
    <div class="col-sm-1"></div>
  </div>
</div>

<script>
let bancoDeDados = {
    pendentes: [],
    conferidos: [],
    foraRota: [],
    idRota: "",
    nomeRota: ""
};

// 1. EXTRAÇÃO
document.getElementById('extract-btn').onclick = function() {
    const htmlInput = document.getElementById('html-input').value;
    if (!htmlInput) return alert("Por favor, cole o HTML primeiro!");

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlInput, 'text/html');

    // Captura o ID da Rota
    const rotaMatch = htmlInput.match(/detail\/(\d+)/);
    bancoDeDados.idRota = rotaMatch ? rotaMatch[1] : "Não identificado";
    
    // Captura o Nome da Rota (ex: F8_AM4)
    const titulo = doc.querySelector('title')?.innerText || "";
    bancoDeDados.nomeRota = titulo.includes('|') ? titulo.split('|')[1].trim() : "Filtro";

    // Filtro Sniper para IDs de 11 dígitos
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
        
        document.getElementById('route-title').innerText = "Rota: " + bancoDeDados.nomeRota;
        document.getElementById('id-rota-display').innerText = "ID: " + bancoDeDados.idRota;
        
        document.getElementById('initial-interface').classList.add('d-none');
        document.getElementById('conference-interface').classList.remove('d-none');
        atualizarPainel();
    } else {
        alert("Nenhum código de 11 dígitos foi encontrado no HTML colado.");
    }
};

// 2. BIPAGEM
document.getElementById('barcode-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const id = this.value.trim();
        if (!id) return;

        if (bancoDeDados.pendentes.includes(id)) {
            bancoDeDados.pendentes = bancoDeDados.pendentes.filter(p => p !== id);
            bancoDeDados.conferidos.unshift(id); // Adiciona no topo da lista
            tocarSom(880);
        } else if (!bancoDeDados.conferidos.includes(id)) {
            if (!bancoDeDados.foraRota.includes(id)) {
                bancoDeDados.foraRota.unshift(id);
                tocarSom(300);
            }
        }
        this.value = ""; 
        atualizarPainel();
    }
});

// 3. RELATÓRIO
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

    navigator.clipboard.writeText(msg).then(() => {
        alert("MENSAGEM COPIADA!\nAgora vá no WhatsApp e cole (Ctrl + V).");
    });
};

function atualizarPainel() {
    document.getElementById('extracted-total').innerText = bancoDeDados.pendentes.length + bancoDeDados.conferidos.length;
    document.getElementById('verified-total').innerText = bancoDeDados.conferidos.length;
    
    document.getElementById('conferidos-list').innerHTML = bancoDeDados.conferidos.map(p => `<div class="list-group-item bg-conferido">${p}</div>`).join('');
    document.getElementById('faltantes-list').innerHTML = bancoDeDados.pendentes.map(p => `<div class="list-group-item bg-pendente">${p}</div>`).join('');
    document.getElementById('fora-rota-list').innerHTML = bancoDeDados.foraRota.map(p => `<div class="list-group-item bg-fora">${p}</div>`).join('');
}

function tocarSom(freq) {
    try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = freq;
        oscillator.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.1);
    } catch(e) { console.log("Som bloqueado pelo navegador"); }
}
</script>

</body>
</html>
