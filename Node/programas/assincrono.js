const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== FUNÇÕES DEMONSTRATIVAS ==========

// Função síncrona (bloqueante)
function tarefaSync(nome, ms) {
    var inicio = Date.now();
    console.log('  🔵 INÍCIO: ' + nome);
    
    // Loop bloqueante (simula tarefa pesada)
    var fim = Date.now() + ms;
    while (Date.now() < fim) {
        // fica aqui travado
    }
    
    var duracao = Date.now() - inicio;
    console.log('  🟢 FIM: ' + nome + ' (' + duracao + 'ms)');
    return nome + ' concluída em ' + duracao + 'ms';
}

// Função assíncrona (não bloqueante)
function tarefaAsync(nome, ms, callback) {
    console.log('  🔵 INÍCIO: ' + nome + ' (vai levar ' + ms + 'ms)');
    
    setTimeout(function() {
        console.log('  🟢 FIM: ' + nome);
        if (callback) callback(nome + ' concluída em ' + ms + 'ms');
    }, ms);
}

// Função assíncrona com Promise
function tarefaPromise(nome, ms) {
    return new Promise(function(resolve, reject) {
        console.log('  🔵 INÍCIO: ' + nome + ' (Promise - ' + ms + 'ms)');
        setTimeout(function() {
            console.log('  🟢 FIM: ' + nome);
            resolve(nome + ' concluída em ' + ms + 'ms');
        }, ms);
    });
}

// Simular requisição a API (assíncrona)
function buscarApi(endpoint, tempo) {
    return new Promise(function(resolve) {
        console.log('  🌐 Buscando ' + endpoint + '...');
        setTimeout(function() {
            console.log('  ✅ ' + endpoint + ' respondido!');
            resolve({ endpoint: endpoint, dados: 'Dados de ' + endpoint, tempo: tempo });
        }, tempo);
    });
}

// ========== PÁGINA PRINCIPAL ==========
app.get('/', function(req, res) {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Node.js Assíncrono - Demonstração</title>
        <meta charset="utf-8">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
                background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
                font-family: 'Segoe UI', Arial, sans-serif;
                min-height: 100vh;
                padding: 20px;
            }
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .header {
                background: white;
                border-radius: 20px;
                padding: 30px;
                margin-bottom: 20px;
                text-align: center;
            }
            
            .header h1 {
                color: #764ba2;
                font-size: 2em;
                margin-bottom: 10px;
            }
            
            .header p {
                color: #666;
            }
            
            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .card {
                background: white;
                border-radius: 20px;
                padding: 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            
            .card h2 {
                color: #764ba2;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .card p {
                color: #666;
                margin-bottom: 15px;
                font-size: 14px;
            }
            
            .btn {
                padding: 12px 24px;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                font-weight: bold;
                transition: transform 0.2s;
                margin: 5px;
            }
            
            .btn:hover {
                transform: scale(1.02);
            }
            
            .btn-sync {
                background: #f44336;
                color: white;
            }
            
            .btn-async {
                background: #4CAF50;
                color: white;
            }
            
            .btn-promise {
                background: #2196F3;
                color: white;
            }
            
            .btn-await {
                background: #ff9800;
                color: white;
            }
            
            .btn-api {
                background: #9c27b0;
                color: white;
            }
            
            .console {
                background: #1e1e1e;
                color: #d4d4d4;
                border-radius: 15px;
                padding: 20px;
                font-family: 'Courier New', monospace;
                font-size: 13px;
                min-height: 300px;
                max-height: 400px;
                overflow-y: auto;
                white-space: pre-wrap;
            }
            
            .console .info { color: #4ec9b0; }
            .console .error { color: #f48771; }
            .console .success { color: #6a9955; }
            .console .warning { color: #ce9178; }
            
            .clear-btn {
                background: #607D8B;
                color: white;
                padding: 8px 16px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                margin-top: 10px;
                font-size: 12px;
            }
            
            .explicacao {
                background: #e3f2fd;
                border-radius: 15px;
                padding: 20px;
                margin-top: 20px;
            }
            
            .explicacao h3 {
                color: #1976d2;
                margin-bottom: 10px;
            }
            
            .explicacao p {
                color: #333;
                line-height: 1.5;
            }
            
            .codigo-exemplo {
                background: #2d2d2d;
                color: #f8f8f2;
                padding: 15px;
                border-radius: 10px;
                font-family: monospace;
                font-size: 12px;
                margin-top: 10px;
                overflow-x: auto;
            }
            
            @media (max-width: 700px) {
                .grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⚡ Node.js Assíncrono - Demonstração</h1>
                <p>Entenda como o Node.js executa código sem travar o servidor</p>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h2>🔴 Código SÍNCRONO (Bloqueante)</h2>
                    <p>As tarefas são executadas uma POR VEZ. A segunda só começa quando a primeira termina.<br>
                    <strong>❌ TRAVA o servidor!</strong></p>
                    <button class="btn btn-sync" onclick="executarSync()">▶ Executar Tarefas Síncronas (2s + 3s)</button>
                </div>
                
                <div class="card">
                    <h2>🟢 Código ASSÍNCRONO (Não Bloqueante)</h2>
                    <p>Todas as tarefas começam JUNTAS e terminam quando ficam prontas.<br>
                    <strong>✅ NÃO trava o servidor!</strong></p>
                    <button class="btn btn-async" onclick="executarAsync()">▶ Executar Tarefas Assíncronas</button>
                </div>
                
                <div class="card">
                    <h2>🔵 Promise (Assíncrono Moderno)</h2>
                    <p>Usando Promises para código mais organizado.<br>
                    <strong>✅ Encadeamento elegante</strong></p>
                    <button class="btn btn-promise" onclick="executarPromise()">▶ Executar com Promise.all</button>
                </div>
                
                <div class="card">
                    <h2>🟠 Async/Await (Sintaxe moderna)</h2>
                    <p>Código assíncrono que PARECE síncrono, mas NÃO BLOQUEIA.<br>
                    <strong>✅ Melhor legibilidade</strong></p>
                    <button class="btn btn-await" onclick="executarAwait()">▶ Executar com Async/Await</button>
                </div>
            </div>
            
            <div class="card">
                <h2>🌐 Simulando Múltiplas APIs (Assíncrono)</h2>
                <p>Buscando dados de várias APIs ao mesmo tempo - DEMONSTRA O PODER DO NODE!</p>
                <button class="btn btn-api" onclick="executarMultiplasApis()">▶ Buscar 3 APIs Simultaneamente</button>
                <button class="btn btn-api" onclick="executarApiSequencial()" style="background:#607D8B;">▶ Buscar 3 APIs em Sequência (Lento)</button>
            </div>
            
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h2>📟 Console de Saída</h2>
                    <button class="clear-btn" onclick="limparConsole()">🗑️ Limpar</button>
                </div>
                <div class="console" id="console">
                    <span class="info">⚡ Clique nos botões para ver a diferença entre código síncrono e assíncrono!</span>
                </div>
            </div>
            
            <div class="explicacao">
                <h3>📚 O que está acontecendo?</h3>
                <p><strong>🔴 Síncrono:</strong> O Node.js executa uma tarefa de cada vez. Se uma tarefa demora 2 segundos, o servidor fica "travado" até ela terminar.</p>
                <p><strong>🟢 Assíncrono:</strong> O Node.js inicia todas as tarefas e continua executando outras coisas enquanto espera. Quando a tarefa termina, ele volta para finalizar.</p>
                <p><strong>🚀 Vantagem:</strong> O Node.js consegue atender muitas requisições ao mesmo tempo sem travar!</p>
                
                <div class="codigo-exemplo">
                    // Código ASSÍNCRONO (NÃO BLOQUEIA)<br>
                    setTimeout(() => { console.log('Terminou!'); }, 2000);<br>
                    console.log('Isso executa IMEDIATAMENTE, sem esperar!');
                </div>
            </div>
        </div>
        
        <script>
            var consoleDiv = document.getElementById('console');
            
            function log(mensagem, tipo) {
                var div = document.createElement('div');
                var cor = '';
                if (tipo === 'info') cor = 'info';
                else if (tipo === 'error') cor = 'error';
                else if (tipo === 'success') cor = 'success';
                else if (tipo === 'warning') cor = 'warning';
                div.innerHTML = '<span class="' + cor + '">' + mensagem + '</span>';
                consoleDiv.appendChild(div);
                div.scrollIntoView();
            }
            
            function limparConsole() {
                consoleDiv.innerHTML = '<span class="info">⚡ Console limpo! Clique nos botões para testar.</span>';
            }
            
            function executarSync() {
                limparConsole();
                log('🔴 INICIANDO CÓDIGO SÍNCRONO (BLOQUEANTE)', 'warning');
                log('━'.repeat(50), 'info');
                
                var inicio = Date.now();
                
                // Função síncrona (trava o servidor)
                function tarefaSync(nome, ms) {
                    log('  🔵 INÍCIO: ' + nome + ' (vai levar ' + ms + 'ms)', 'info');
                    var fim = Date.now() + ms;
                    while (Date.now() < fim) { /* trava */ }
                    log('  🟢 FIM: ' + nome, 'success');
                }
                
                tarefaSync('Tarefa 1', 2000);
                tarefaSync('Tarefa 2', 3000);
                
                var duracao = Date.now() - inicio;
                log('━'.repeat(50), 'info');
                log('⏱️ TEMPO TOTAL: ' + duracao + 'ms', 'warning');
                log('❌ O servidor ficou TRAVADO por ' + duracao + 'ms!', 'error');
            }
            
            function executarAsync() {
                limparConsole();
                log('🟢 INICIANDO CÓDIGO ASSÍNCRONO (NÃO BLOQUEANTE)', 'warning');
                log('━'.repeat(50), 'info');
                
                var inicio = Date.now();
                var tarefasConcluidas = 0;
                
                function tarefaAsync(nome, ms, callback) {
                    log('  🔵 INÍCIO: ' + nome + ' (vai levar ' + ms + 'ms)', 'info');
                    setTimeout(function() {
                        log('  🟢 FIM: ' + nome, 'success');
                        tarefasConcluidas++;
                        if (tarefasConcluidas === 3 && callback) callback();
                    }, ms);
                }
                
                tarefaAsync('Tarefa A', 2000);
                tarefaAsync('Tarefa B', 1000);
                tarefaAsync('Tarefa C', 3000);
                
                setTimeout(function() {
                    var duracao = Date.now() - inicio;
                    log('━'.repeat(50), 'info');
                    log('⏱️ TEMPO TOTAL: ' + duracao + 'ms', 'warning');
                    log('✅ As 3 tarefas terminaram em ~3s (NÃO 6s)!', 'success');
                    log('✅ O servidor NÃO travou durante a execução!', 'success');
                }, 3100);
            }
            
            function executarPromise() {
                limparConsole();
                log('🔵 INICIANDO PROMISES (ASSÍNCRONO MODERNO)', 'warning');
                log('━'.repeat(50), 'info');
                
                var inicio = Date.now();
                
                function tarefaPromise(nome, ms) {
                    return new Promise(function(resolve) {
                        log('  🔵 INÍCIO: ' + nome + ' (Promise - ' + ms + 'ms)', 'info');
                        setTimeout(function() {
                            log('  🟢 FIM: ' + nome, 'success');
                            resolve();
                        }, ms);
                    });
                }
                
                Promise.all([
                    tarefaPromise('Promise 1', 2000),
                    tarefaPromise('Promise 2', 1500),
                    tarefaPromise('Promise 3', 1000)
                ]).then(function() {
                    var duracao = Date.now() - inicio;
                    log('━'.repeat(50), 'info');
                    log('⏱️ TEMPO TOTAL: ' + duracao + 'ms', 'warning');
                    log('✅ Promise.all executa TUDO EM PARALELO!', 'success');
                });
            }
            
            function executarAwait() {
                limparConsole();
                log('🟠 INICIANDO ASYNC/AWAIT (PARECE SÍNCRONO, MAS É ASSÍNCRONO)', 'warning');
                log('━'.repeat(50), 'info');
                
                var inicio = Date.now();
                
                function delay(nome, ms) {
                    return new Promise(function(resolve) {
                        log('  🔵 INÍCIO: ' + nome + ' (Async - ' + ms + 'ms)', 'info');
                        setTimeout(function() {
                            log('  🟢 FIM: ' + nome, 'success');
                            resolve();
                        }, ms);
                    });
                }
                
                async function executar() {
                    await delay('Async 1', 2000);
                    await delay('Async 2', 1000);
                    await delay('Async 3', 1500);
                    
                    var duracao = Date.now() - inicio;
                    log('━'.repeat(50), 'info');
                    log('⏱️ TEMPO TOTAL: ' + duracao + 'ms', 'warning');
                    log('✅ Async/await é mais LEGÍVEL, mas executa em SEQUÊNCIA!', 'info');
                    log('💡 Use Promise.all para paralelismo', 'warning');
                }
                
                executar();
            }
            
            function executarMultiplasApis() {
                limparConsole();
                log('🌐 BUSCANDO 3 APIS SIMULTANEAMENTE (ASSÍNCRONO PARALELO)', 'warning');
                log('━'.repeat(50), 'info');
                
                var inicio = Date.now();
                
                function buscarApi(nome, tempo) {
                    return new Promise(function(resolve) {
                        log('  🌐 Requisição para ' + nome + ' iniciada...', 'info');
                        setTimeout(function() {
                            log('  ✅ ' + nome + ' respondeu em ' + tempo + 'ms!', 'success');
                            resolve();
                        }, tempo);
                    });
                }
                
                Promise.all([
                    buscarApi('API de Usuários', 2000),
                    buscarApi('API de Produtos', 1500),
                    buscarApi('API de Pedidos', 2500)
                ]).then(function() {
                    var duracao = Date.now() - inicio;
                    log('━'.repeat(50), 'info');
                    log('⏱️ TEMPO TOTAL: ' + duracao + 'ms', 'warning');
                    log('✅ As 3 APIs foram buscadas em PARALELO!', 'success');
                    log('💡 Se fosse síncrono, levaria ~6s!', 'info');
                });
            }
            
            function executarApiSequencial() {
                limparConsole();
                log('🌐 BUSCANDO 3 APIs EM SEQUÊNCIA (MODO LENTO)', 'warning');
                log('━'.repeat(50), 'info');
                
                var inicio = Date.now();
                
                function buscarApi(nome, tempo) {
                    return new Promise(function(resolve) {
                        log('  🌐 Requisição para ' + nome + ' iniciada...', 'info');
                        setTimeout(function() {
                            log('  ✅ ' + nome + ' respondeu em ' + tempo + 'ms!', 'success');
                            resolve();
                        }, tempo);
                    });
                }
                
                async function executar() {
                    await buscarApi('API de Usuários', 2000);
                    await buscarApi('API de Produtos', 1500);
                    await buscarApi('API de Pedidos', 2500);
                    
                    var duracao = Date.now() - inicio;
                    log('━'.repeat(50), 'info');
                    log('⏱️ TEMPO TOTAL: ' + duracao + 'ms', 'warning');
                    log('❌ Em sequência, levou MUITO mais tempo!', 'error');
                    log('💡 Use Promise.all para executar em paralelo!', 'info');
                }
                
                executar();
            }
        </script>
    </body>
    </html>
    `);
});

// Iniciar servidor
var PORTA = 3017;
app.listen(PORTA, function() {
    console.log('========================================');
    console.log('⚡ NODE.JS ASSÍNCRONO - DEMONSTRAÇÃO');
    console.log('👉 http://localhost:' + PORTA);
    console.log('========================================');
    console.log('');
    console.log('✅ O QUE ESTE SISTEMA MOSTRA:');
    console.log('  ✓ Código SÍNCRONO (bloqueia o servidor)');
    console.log('  ✓ Código ASSÍNCRONO (não bloqueia)');
    console.log('  ✓ Promises (assíncrono moderno)');
    console.log('  ✓ Async/Await (sintaxe elegante)');
    console.log('  ✓ Múltiplas APIs em paralelo');
    console.log('========================================');
});