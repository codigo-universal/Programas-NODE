const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const app = express();

// Configuração do WebSocket da Binance
const symbol = 'btcusdt';
const url = `wss://stream.binance.com:9443/ws/${symbol}@ticker`;

let ultimoPreco = '0.00';
let ultimaAlta = '0.00';
let ultimaBaixa = '0.00';
let variacao = '0.00';
let volume = '0.00';
let conectado = false;
let ultimaAtualizacao = new Date();

// Conectar ao WebSocket da Binance
const ws = new WebSocket(url);

ws.on('open', () => {
    console.log(`✅ Conectado ao stream da Binance: ${symbol.toUpperCase()}`);
    conectado = true;
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        
        // Extrair dados importantes
        ultimoPreco = parseFloat(message.c).toFixed(2);      // Preço atual
        ultimaAlta = parseFloat(message.h).toFixed(2);       // Máxima 24h
        ultimaBaixa = parseFloat(message.l).toFixed(2);      // Mínima 24h
        variacao = parseFloat(message.P).toFixed(2);         // Variação percentual
        volume = (parseFloat(message.v) / 1000).toFixed(2);  // Volume em milhares
        ultimaAtualizacao = new Date();
        
        console.log(`BTC: $${ultimoPreco} | 24h: ${variacao}%`);
    } catch (err) {
        console.error('Erro ao processar mensagem:', err);
    }
});

ws.on('error', (err) => {
    console.error('❌ Erro na conexão WebSocket:', err.message);
    conectado = false;
});

ws.on('close', () => {
    console.log('⚠️ Conexão encerrada. Tentando reconectar em 5 segundos...');
    conectado = false;
    
    // Tentar reconectar após 5 segundos
    setTimeout(() => {
        console.log('🔄 Reconectando...');
        const newWs = new WebSocket(url);
        // Transferir eventos
        newWs.on('open', ws.onopen);
        newWs.on('message', ws.onmessage);
        newWs.on('error', ws.onerror);
        newWs.on('close', ws.onclose);
        ws._socket = newWs;
    }, 5000);
});

// ========== PÁGINA PRINCIPAL ==========
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Monitor Bitcoin - Binance</title>
        <meta charset="utf-8">
        <meta http-equiv="refresh" content="3">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                font-family: 'Segoe UI', Arial, sans-serif;
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            }
            
            .container {
                max-width: 500px;
                width: 100%;
            }
            
            .card {
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                border-radius: 30px;
                padding: 40px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                border: 1px solid rgba(255,255,255,0.2);
            }
            
            .logo {
                font-size: 3em;
                margin-bottom: 20px;
            }
            
            h1 {
                color: #f7931a;
                font-size: 1.5em;
                margin-bottom: 10px;
            }
            
            .subtitle {
                color: #aaa;
                font-size: 12px;
                margin-bottom: 30px;
            }
            
            .preco {
                background: rgba(0,0,0,0.3);
                border-radius: 20px;
                padding: 30px;
                margin-bottom: 30px;
            }
            
            .preco-label {
                color: #888;
                font-size: 14px;
                letter-spacing: 2px;
            }
            
            .preco-valor {
                font-size: 3em;
                font-weight: bold;
                color: #f7931a;
                margin: 10px 0;
            }
            
            .preco-valor span {
                font-size: 0.5em;
                color: #888;
            }
            
            .variacao {
                font-size: 1.2em;
                font-weight: bold;
            }
            
            .variacao.positiva {
                color: #4CAF50;
            }
            
            .variacao.negativa {
                color: #f44336;
            }
            
            .stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 30px;
            }
            
            .stat {
                background: rgba(0,0,0,0.3);
                border-radius: 15px;
                padding: 15px;
            }
            
            .stat-label {
                color: #888;
                font-size: 11px;
                margin-bottom: 5px;
            }
            
            .stat-value {
                color: white;
                font-size: 1.1em;
                font-weight: bold;
            }
            
            .status {
                display: inline-block;
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 11px;
                margin-top: 20px;
            }
            
            .status.online {
                background: #4CAF50;
                color: white;
            }
            
            .status.offline {
                background: #f44336;
                color: white;
            }
            
            .atualizacao {
                color: #666;
                font-size: 10px;
                margin-top: 20px;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            .atualizando {
                animation: pulse 1s ease-in-out;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="card">
                <div class="logo">₿</div>
                <h1>BITCOIN / USDT</h1>
                <p class="subtitle">Monitorado via Binance WebSocket</p>
                
                <div class="preco">
                    <div class="preco-label">PREÇO ATUAL</div>
                    <div class="preco-valor" id="preco">$ ${ultimoPreco}</div>
                    <div class="variacao" id="variacao">${variacao}%</div>
                </div>
                
                <div class="stats">
                    <div class="stat">
                        <div class="stat-label">📈 MÁXIMA 24H</div>
                        <div class="stat-value" id="alta">$ ${ultimaAlta}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">📉 MÍNIMA 24H</div>
                        <div class="stat-value" id="baixa">$ ${ultimaBaixa}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">📊 VOLUME (MIL)</div>
                        <div class="stat-value" id="volume">${volume} K</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">🔄 STATUS</div>
                        <div class="stat-value" id="status">${conectado ? 'Online' : 'Offline'}</div>
                    </div>
                </div>
                
                <div class="status ${conectado ? 'online' : 'offline'}" id="statusBadge">
                    ${conectado ? '🟢 Conectado à Binance' : '🔴 Desconectado'}
                </div>
                <div class="atualizacao" id="atualizacao">
                    Última atualização: ${ultimaAtualizacao.toLocaleTimeString()}
                </div>
            </div>
        </div>
        
        <script>
            function atualizarDados() {
                fetch('/api/preco')
                    .then(res => res.json())
                    .then(data => {
                        document.getElementById('preco').innerHTML = '$ ' + data.preco;
                        document.getElementById('alta').innerHTML = '$ ' + data.alta;
                        document.getElementById('baixa').innerHTML = '$ ' + data.baixa;
                        document.getElementById('volume').innerHTML = data.volume + ' K';
                        document.getElementById('atualizacao').innerHTML = 'Última atualização: ' + data.hora;
                        
                        var variacaoElem = document.getElementById('variacao');
                        variacaoElem.innerHTML = data.variacao + '%';
                        if (parseFloat(data.variacao) >= 0) {
                            variacaoElem.className = 'variacao positiva';
                            variacaoElem.innerHTML = '▲ ' + data.variacao + '%';
                        } else {
                            variacaoElem.className = 'variacao negativa';
                            variacaoElem.innerHTML = '▼ ' + data.variacao + '%';
                        }
                        
                        var statusElem = document.getElementById('status');
                        var statusBadge = document.getElementById('statusBadge');
                        if (data.conectado) {
                            statusElem.innerHTML = 'Online';
                            statusBadge.innerHTML = '🟢 Conectado à Binance';
                            statusBadge.className = 'status online';
                        } else {
                            statusElem.innerHTML = 'Offline';
                            statusBadge.innerHTML = '🔴 Desconectado';
                            statusBadge.className = 'status offline';
                        }
                        
                        // Animação
                        document.querySelector('.preco-valor').classList.add('atualizando');
                        setTimeout(() => {
                            document.querySelector('.preco-valor').classList.remove('atualizando');
                        }, 500);
                    });
            }
            
            setInterval(atualizarDados, 2000);
        </script>
    </body>
    </html>
    `);
});

// API para pegar o preço atual
app.get('/api/preco', (req, res) => {
    let variacaoFormatada = variacao;
    let sinal = '';
    if (parseFloat(variacao) > 0) sinal = '+';
    
    res.json({
        preco: ultimoPreco,
        alta: ultimaAlta,
        baixa: ultimaBaixa,
        variacao: variacaoFormatada,
        volume: volume,
        conectado: conectado,
        hora: ultimaAtualizacao.toLocaleTimeString()
    });
});

// Iniciar servidor
const PORTA = 3020;
app.listen(PORTA, () => {
    console.log('========================================');
    console.log('₿ MONITOR BITCOIN - BINANCE');
    console.log(`👉 http://localhost:${PORTA}`);
    console.log('========================================');
    console.log('');
    console.log(`📡 Conectando ao WebSocket: ${symbol.toUpperCase()}`);
    console.log('========================================');
});