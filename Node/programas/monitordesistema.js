const express = require('express');
const os = require('os');
const app = express();

// Rota principal
app.get('/', (req, res) => {
    // Pegar dados do sistema
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(function(cpu) {
        for (var type in cpu.times) {
            totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
    });
    
    var usoCPU = (100 - (totalIdle / totalTick) * 100).toFixed(1);
    var nucleos = cpus.length;
    var modeloCPU = cpus[0] ? cpus[0].model : 'Desconhecido';
    
    var totalMem = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(1);
    var livreMem = (os.freemem() / (1024 * 1024 * 1024)).toFixed(1);
    var usadoMem = (totalMem - livreMem).toFixed(1);
    var usoMem = ((usadoMem / totalMem) * 100).toFixed(1);
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Monitor do Sistema</title>
            <meta charset="utf-8">
            <style>
                body {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    font-family: Arial, sans-serif;
                    min-height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    background: white;
                    border-radius: 20px;
                    padding: 30px;
                    text-align: center;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    max-width: 500px;
                    width: 100%;
                }
                h1 {
                    color: #764ba2;
                    font-size: 1.8em;
                    margin-bottom: 10px;
                }
                p {
                    color: #666;
                    font-size: 0.9em;
                    margin-bottom: 20px;
                }
                .info {
                    background: #f0f0f0;
                    padding: 15px;
                    border-radius: 10px;
                    font-family: monospace;
                    color: #333;
                    text-align: left;
                    font-size: 13px;
                }
                .info-row {
                    padding: 5px 0;
                    border-bottom: 1px solid #ddd;
                }
                .info-row:last-child {
                    border-bottom: none;
                }
                .porta {
                    color: #4CAF50;
                    font-weight: bold;
                }
                .valor {
                    color: #764ba2;
                    font-weight: bold;
                }
                .barra {
                    background: #ddd;
                    border-radius: 10px;
                    height: 18px;
                    margin: 5px 0 10px 0;
                    overflow: hidden;
                }
                .barra-fill {
                    background: linear-gradient(90deg, #667eea, #764ba2);
                    height: 100%;
                    border-radius: 10px;
                    width: 0%;
                    transition: width 0.5s;
                }
                .refresh-btn {
                    background: #764ba2;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    margin-top: 15px;
                    font-size: 12px;
                }
                .refresh-btn:hover {
                    opacity: 0.9;
                }
                .timestamp {
                    margin-top: 10px;
                    font-size: 10px;
                    color: #999;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📊 Monitor do Sistema</h1>
                <p>Servidor rodando na porta 3013</p>
                
                <div class="info">
                    <div class="info-row">
                        <strong>📡 Porta:</strong> <span class="porta">3013</span>
                    </div>
                    <div class="info-row">
                        <strong>💻 Hostname:</strong> ${os.hostname()}
                    </div>
                    <div class="info-row">
                        <strong>🔧 CPU:</strong> <span class="valor">${nucleos} núcleos</span>
                    </div>
                    <div class="info-row">
                        <strong>⚡ Modelo:</strong> <span style="font-size:10px">${modeloCPU.substring(0, 40)}</span>
                    </div>
                    <div class="info-row">
                        <strong>📊 Uso CPU:</strong> <span class="valor" id="cpuUso">${usoCPU}%</span>
                    </div>
                    <div class="barra">
                        <div class="barra-fill" id="cpuBarra" style="width: ${usoCPU}%"></div>
                    </div>
                    <div class="info-row">
                        <strong>💾 Memória Total:</strong> <span class="valor">${totalMem} GB</span>
                    </div>
                    <div class="info-row">
                        <strong>📌 Em uso:</strong> <span class="valor">${usadoMem} GB</span> (${usoMem}%)
                    </div>
                    <div class="barra">
                        <div class="barra-fill" id="memBarra" style="width: ${usoMem}%"></div>
                    </div>
                    <div class="info-row">
                        <strong>✅ Disponível:</strong> <span class="valor">${livreMem} GB</span>
                    </div>
                    <div class="info-row">
                        <strong>🪟 Sistema:</strong> ${os.type()} ${os.release()}
                    </div>
                    <div class="info-row">
                        <strong>🕐 Atualização:</strong> <span id="dataHora"></span>
                    </div>
                </div>
                
                <button class="refresh-btn" onclick="atualizarAgora()">🔄 Atualizar Agora</button>
                <div class="timestamp" id="timestamp"></div>
            </div>
            
            <script>
                function atualizarAgora() {
                    atualizarDados();
                }
                
                function atualizarDados() {
                    fetch('/api/dados')
                        .then(function(res) { return res.json(); })
                        .then(function(data) {
                            document.getElementById('cpuUso').textContent = data.cpu + '%';
                            document.getElementById('cpuBarra').style.width = data.cpu + '%';
                            document.getElementById('memBarra').style.width = data.memoria + '%';
                            document.getElementById('dataHora').textContent = data.hora;
                            document.getElementById('timestamp').innerHTML = '✅ Atualizado: ' + data.hora;
                            setTimeout(function() {
                                document.getElementById('timestamp').innerHTML = '';
                            }, 2000);
                        })
                        .catch(function(err) {
                            console.error('Erro:', err);
                            document.getElementById('timestamp').innerHTML = '❌ Erro ao atualizar';
                        });
                }
                
                // Atualizar a cada 5 segundos
                setInterval(atualizarDados, 5000);
                document.getElementById('dataHora').textContent = new Date().toLocaleString();
            </script>
        </body>
        </html>
    `);
});

// Rota JSON para dados em tempo real
app.get('/api/dados', function(req, res) {
    var cpus = os.cpus();
    var totalIdle = 0;
    var totalTick = 0;
    
    for (var i = 0; i < cpus.length; i++) {
        var cpu = cpus[i];
        for (var type in cpu.times) {
            totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
    }
    
    var usoCPU = (100 - (totalIdle / totalTick) * 100).toFixed(1);
    
    var totalMem = os.totalmem();
    var livreMem = os.freemem();
    var usadoMem = totalMem - livreMem;
    var usoMem = ((usadoMem / totalMem) * 100).toFixed(1);
    
    var agora = new Date();
    var hora = agora.getHours().toString().padStart(2,'0') + ':' + 
                agora.getMinutes().toString().padStart(2,'0') + ':' + 
                agora.getSeconds().toString().padStart(2,'0');
    
    res.json({
        cpu: usoCPU,
        memoria: usoMem,
        hora: hora,
        timestamp: Date.now()
    });
});

// Rota JSON simples
app.get('/api', function(req, res) {
    res.json({
        mensagem: 'Monitor do Sistema',
        porta: 3013,
        status: 'online',
        data: new Date().toISOString()
    });
});

// Iniciar servidor na porta 3013
var PORTA = 3013;
app.listen(PORTA, function() {
    console.log('========================================');
    console.log('📊 MONITOR DO SISTEMA - PORTA 3013');
    console.log('👉 http://localhost:' + PORTA);
    console.log('👉 http://localhost:' + PORTA + '/api/dados');
    console.log('========================================');
    console.log('');
    console.log('✅ Servidor rodando com sucesso!');
    console.log('📡 Porta: 3013');
    console.log('========================================');
});