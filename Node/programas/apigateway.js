const express = require('express');
const https = require('https');
const http = require('http');
const cluster = require('cluster');
const os = require('os');
const fs = require('fs');
const path = require('path');

// ========== CONFIGURAÇÕES ==========
const PORTA = 3022;
const MAX_REQUISICOES_POR_MINUTO = 30;
const TEMPO_CACHE = 30000; // 30 segundos

// ========== CACHE EM MEMÓRIA (ALTA PERFORMANCE) ==========
const cache = new Map();

// ========== RATE LIMITER (CONTROLE DE REQUISIÇÕES) ==========
const requisicoesPorIP = new Map();

// ========== LOGS ==========
const logFile = path.join(__dirname, '..', 'dados', 'api-logs.txt');
if (!fs.existsSync(path.dirname(logFile))) {
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
}

function log(mensagem) {
    const timestamp = new Date().toLocaleString();
    const logMsg = `[${timestamp}] ${mensagem}\n`;
    console.log(logMsg.trim());
    fs.appendFileSync(logFile, logMsg, 'utf8');
}

// ========== FUNÇÃO DE RATE LIMIT ==========
function verificarRateLimit(ip) {
    const agora = Date.now();
    const dados = requisicoesPorIP.get(ip) || { count: 0, resetTime: agora + 60000 };
    
    if (agora > dados.resetTime) {
        dados.count = 0;
        dados.resetTime = agora + 60000;
    }
    
    dados.count++;
    requisicoesPorIP.set(ip, dados);
    
    return {
        allowed: dados.count <= MAX_REQUISICOES_POR_MINUTO,
        remaining: Math.max(0, MAX_REQUISICOES_POR_MINUTO - dados.count),
        resetTime: dados.resetTime
    };
}

// ========== FUNÇÃO PARA BUSCAR API EXTERNA (ASSÍNCRONO) ==========
function buscarAPI(url, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const timer = setTimeout(() => {
            reject(new Error('Timeout na requisição'));
        }, timeout);
        
        client.get(url, (res) => {
            clearTimeout(timer);
            let dados = '';
            res.on('data', chunk => dados += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(dados));
                } catch {
                    resolve(dados);
                }
            });
        }).on('error', (err) => {
            clearTimeout(timer);
            reject(err);
        });
    });
}

// ========== MIDDLEWARE DE CACHE ==========
function cacheMiddleware(ttl = TEMPO_CACHE) {
    return (req, res, next) => {
        const key = req.originalUrl;
        const cached = cache.get(key);
        
        if (cached && (Date.now() - cached.timestamp) < ttl) {
            log(`💾 Cache HIT: ${key}`);
            return res.json(cached.data);
        }
        
        res.originalJson = res.json;
        res.json = (data) => {
            cache.set(key, { data, timestamp: Date.now() });
            res.originalJson(data);
        };
        next();
    };
}

// ========== MIDDLEWARE DE RATE LIMIT ==========
function rateLimitMiddleware(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const rate = verificarRateLimit(ip);
    
    res.setHeader('X-RateLimit-Limit', MAX_REQUISICOES_POR_MINUTO);
    res.setHeader('X-RateLimit-Remaining', rate.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(rate.resetTime).toISOString());
    
    if (!rate.allowed) {
        log(`⚠️ Rate limit excedido para IP: ${ip}`);
        return res.status(429).json({ 
            erro: 'Muitas requisições. Aguarde um momento.',
            limite: MAX_REQUISICOES_POR_MINUTO,
            reset: new Date(rate.resetTime).toLocaleString()
        });
    }
    next();
}

// ========== INICIAR SERVIDOR ==========
const app = express();

// Middlewares globais
app.use(express.json());
app.use(rateLimitMiddleware);

// ========== ROTAS ==========

// 1. Rota de Status (mostra informações do sistema)
app.get('/status', (req, res) => {
    const usoMemoria = process.memoryUsage();
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        node_version: process.version,
        plataforma: process.platform,
        arquitetura: process.arch,
        cpu_nucleos: os.cpus().length,
        memoria: {
            rss: `${Math.round(usoMemoria.rss / 1024 / 1024)} MB`,
            heapTotal: `${Math.round(usoMemoria.heapTotal / 1024 / 1024)} MB`,
            heapUsed: `${Math.round(usoMemoria.heapUsed / 1024 / 1024)} MB`
        },
        cache_tamanho: cache.size,
        requisicoes_ativas: Object.keys(requisicoesPorIP).length
    });
});

// 2. Rota de Bitcoin (com cache)
app.get('/bitcoin', cacheMiddleware(30000), async (req, res) => {
    try {
        log('📡 Buscando preço do Bitcoin...');
        const data = await buscarAPI('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
        res.json({
            moeda: 'Bitcoin',
            simbolo: 'BTC',
            preco: parseFloat(data.c).toFixed(2),
            alta_24h: parseFloat(data.h).toFixed(2),
            baixa_24h: parseFloat(data.l).toFixed(2),
            volume: parseFloat(data.v).toFixed(2),
            variacao: parseFloat(data.P).toFixed(2),
            atualizado_em: new Date().toISOString()
        });
    } catch (erro) {
        res.status(500).json({ erro: 'Erro ao buscar Bitcoin', mensagem: erro.message });
    }
});

// 3. Rota de Clima (simulada + cache)
app.get('/clima/:cidade', cacheMiddleware(60000), async (req, res) => {
    const cidade = req.params.cidade;
    // Simulação (API real precisaria de chave)
    const climas = {
        'sao paulo': { temp: 22, clima: 'Nublado', umidade: 65 },
        'rio de janeiro': { temp: 28, clima: 'Ensolarado', umidade: 55 },
        'belo horizonte': { temp: 24, clima: 'Limpo', umidade: 60 },
        'curitiba': { temp: 18, clima: 'Chuvoso', umidade: 80 }
    };
    
    const dados = climas[cidade.toLowerCase()];
    if (dados) {
        res.json({ cidade, ...dados, atualizado_em: new Date().toISOString() });
    } else {
        res.json({ cidade, mensagem: 'Clima não disponível para esta cidade' });
    }
});

// 4. Rota de Echo (mostra headers, IP, etc)
app.get('/echo', (req, res) => {
    res.json({
        ip: req.ip,
        headers: req.headers,
        metodo: req.method,
        url: req.url,
        query: req.query,
        timestamp: new Date().toISOString()
    });
});

// 5. Rota de Cache Stats
app.get('/cache-stats', (req, res) => {
    const stats = [];
    for (let [key, value] of cache) {
        stats.push({
            rota: key,
            idade: `${Math.floor((Date.now() - value.timestamp) / 1000)}s`,
            tamanho: JSON.stringify(value.data).length
        });
    }
    res.json({
        total_cacheado: cache.size,
        items: stats
    });
});

// 6. Rota de Limpar Cache
app.post('/cache/limpar', (req, res) => {
    cache.clear();
    log('🗑️ Cache limpo manualmente');
    res.json({ mensagem: 'Cache limpo com sucesso!', cache_tamanho: cache.size });
});

// 7. Rota para testar Rate Limit
app.get('/teste-rapido', (req, res) => {
    res.json({ mensagem: 'Requisição processada!', timestamp: Date.now() });
});

// 8. Dashboard HTML
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>API Gateway - Node.js Super Poderoso</title>
        <meta charset="utf-8">
        <meta http-equiv="refresh" content="5">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
                font-family: 'Segoe UI', Arial, sans-serif;
                min-height: 100vh;
                padding: 20px;
            }
            .container { max-width: 1200px; margin: 0 auto; }
            .header {
                background: white;
                border-radius: 20px;
                padding: 30px;
                margin-bottom: 20px;
                text-align: center;
            }
            .header h1 { color: #764ba2; font-size: 2em; }
            .header p { color: #666; margin-top: 10px; }
            .grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
            }
            .card {
                background: white;
                border-radius: 15px;
                padding: 20px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            .card h3 {
                color: #764ba2;
                margin-bottom: 15px;
                border-bottom: 2px solid #764ba2;
                padding-bottom: 8px;
            }
            .metric {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            .metric-label { font-weight: bold; color: #666; }
            .metric-value { font-family: monospace; color: #764ba2; }
            .endpoint {
                background: #f5f5f5;
                padding: 10px;
                border-radius: 8px;
                margin: 10px 0;
                font-family: monospace;
                font-size: 12px;
            }
            .badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: bold;
            }
            .badge.get { background: #4CAF50; color: white; }
            .badge.post { background: #2196F3; color: white; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 API Gateway - Node.js Super Poderoso</h1>
                <p>Demonstração de Cache, Rate Limiter, Proxy e muito mais!</p>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h3>📊 Status do Sistema</h3>
                    <div id="status">Carregando...</div>
                </div>
                
                <div class="card">
                    <h3>💰 Bitcoin em Tempo Real</h3>
                    <div id="bitcoin">Carregando...</div>
                </div>
                
                <div class="card">
                    <h3>📡 Cache Stats</h3>
                    <div id="cache">Carregando...</div>
                </div>
            </div>
            
            <div class="card">
                <h3>🔗 Endpoints Disponíveis</h3>
                <div class="endpoint"><span class="badge get">GET</span> /status - Status do sistema</div>
                <div class="endpoint"><span class="badge get">GET</span> /bitcoin - Preço do Bitcoin (com cache)</div>
                <div class="endpoint"><span class="badge get">GET</span> /clima/:cidade - Clima da cidade</div>
                <div class="endpoint"><span class="badge get">GET</span> /echo - Mostra headers e IP</div>
                <div class="endpoint"><span class="badge get">GET</span> /cache-stats - Estatísticas do cache</div>
                <div class="endpoint"><span class="badge post">POST</span> /cache/limpar - Limpa o cache</div>
                <div class="endpoint"><span class="badge get">GET</span> /teste-rapido - Testa rate limit</div>
            </div>
        </div>
        
        <script>
            async function carregarStatus() {
                const res = await fetch('/status');
                const data = await res.json();
                document.getElementById('status').innerHTML = \`
                    <div class="metric"><span class="metric-label">🟢 Status</span><span class="metric-value">\${data.status}</span></div>
                    <div class="metric"><span class="metric-label">📦 Node.js</span><span class="metric-value">\${data.node_version}</span></div>
                    <div class="metric"><span class="metric-label">💾 Memória Heap</span><span class="metric-value">\${data.memoria.heapUsed}</span></div>
                    <div class="metric"><span class="metric-label">🎯 CPU Núcleos</span><span class="metric-value">\${data.cpu_nucleos}</span></div>
                    <div class="metric"><span class="metric-label">🗄️ Cache</span><span class="metric-value">\${data.cache_tamanho} itens</span></div>
                \`;
            }
            
            async function carregarBitcoin() {
                const res = await fetch('/bitcoin');
                const data = await res.json();
                const variacaoCor = data.variacao >= 0 ? '#4CAF50' : '#f44336';
                document.getElementById('bitcoin').innerHTML = \`
                    <div class="metric"><span class="metric-label">💰 Preço</span><span class="metric-value">$ \${data.preco}</span></div>
                    <div class="metric"><span class="metric-label">📈 Variação 24h</span><span class="metric-value" style="color:\${variacaoCor}">\${data.variacao}%</span></div>
                    <div class="metric"><span class="metric-label">📊 Volume</span><span class="metric-value">\${data.volume}</span></div>
                    <div class="metric"><span class="metric-label">🕐 Atualizado</span><span class="metric-value">\${new Date(data.atualizado_em).toLocaleTimeString()}</span></div>
                \`;
            }
            
            async function carregarCache() {
                const res = await fetch('/cache-stats');
                const data = await res.json();
                let html = '<div class="metric"><span class="metric-label">📦 Total Cacheado</span><span class="metric-value">' + data.total_cacheado + '</span></div>';
                data.items.forEach(item => {
                    html += '<div class="metric"><span class="metric-label">🔗 ' + item.rota + '</span><span class="metric-value">' + item.idade + '</span></div>';
                });
                document.getElementById('cache').innerHTML = html || '<div class="metric">Nenhum item em cache</div>';
            }
            
            carregarStatus();
            carregarBitcoin();
            carregarCache();
            setInterval(() => {
                carregarStatus();
                carregarBitcoin();
                carregarCache();
            }, 10000);
        </script>
    </body>
    </html>
    `);
});

// Middleware de log
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    });
    next();
});

// Tratamento de erros global
app.use((err, req, res, next) => {
    log(`❌ ERRO: ${err.message}`);
    res.status(500).json({ erro: 'Erro interno do servidor', mensagem: err.message });
});

// Iniciar servidor
app.listen(PORTA, () => {
    log(`🚀 API Gateway rodando em http://localhost:${PORTA}`);
    console.log('========================================');
    console.log('🚀 API GATEWAY - NODE.JS PODEROSO');
    console.log(`👉 http://localhost:${PORTA}`);
    console.log('========================================');
    console.log('');
    console.log('✅ FUNCIONALIDADES DEMONSTRADAS:');
    console.log('  ✓ Cache em memória (alta performance)');
    console.log('  ✓ Rate Limiter (controle de tráfego)');
    console.log('  ✓ Requisições assíncronas');
    console.log('  ✓ Proxy para APIs externas');
    console.log('  ✓ Logs em arquivo');
    console.log('  ✓ Dashboard em tempo real');
    console.log('========================================');
});