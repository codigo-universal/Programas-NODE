const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Estado do jogo (armazenado em memória)
let jogoAtual = {
    ativo: false,
    numero_secreto: null,
    dificuldade: null,
    tentativas: 0,
    pontuacao: 0,
    recorde: 0,
    ultimo_palpite: null
};

// Carregar recorde do arquivo
const ARQUIVO_RECORDE = path.join(__dirname, '..', 'dados', 'adivinhacao-recorde.json');
try {
    if (fs.existsSync(ARQUIVO_RECORDE)) {
        const dados = fs.readFileSync(ARQUIVO_RECORDE, 'utf8');
        jogoAtual.recorde = JSON.parse(dados).recorde || 0;
    }
} catch(e) {}

function salvarRecorde() {
    fs.writeFileSync(ARQUIVO_RECORDE, JSON.stringify({ recorde: jogoAtual.recorde }, null, 2));
}

// Função para chamar Python
function chamarPython(dados, callback) {
    const caminhoScript = path.join(__dirname, 'jogoadvinhacao.py');
    const processo = exec('python "' + caminhoScript + '"', { timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
            callback({ erro: stderr || error.message });
            return;
        }
        try {
            const resultado = JSON.parse(stdout);
            callback(resultado);
        } catch(e) {
            callback({ erro: 'Erro ao processar resposta do Python' });
        }
    });
    
    processo.stdin.write(JSON.stringify(dados));
    processo.stdin.end();
}

// ========== PÁGINA PRINCIPAL ==========
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Jogo da Adivinhação - Python + Node.js</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
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
                max-width: 600px;
                width: 100%;
            }
            
            .card {
                background: white;
                border-radius: 20px;
                padding: 30px;
                margin-bottom: 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                text-align: center;
            }
            
            .badge-node {
                background: #339933;
                color: white;
                padding: 5px 12px;
                border-radius: 20px;
                display: inline-block;
                margin: 5px;
                font-size: 11px;
            }
            
            .badge-python {
                background: #3776ab;
                color: white;
                padding: 5px 12px;
                border-radius: 20px;
                display: inline-block;
                margin: 5px;
                font-size: 11px;
            }
            
            h1 {
                color: #764ba2;
                margin-bottom: 10px;
                font-size: 1.8em;
            }
            
            .subtitle {
                color: #666;
                margin-bottom: 20px;
                font-size: 14px;
            }
            
            .dificuldade-area {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }
            
            .btn-dificuldade {
                padding: 12px 25px;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                font-weight: bold;
                transition: transform 0.2s;
            }
            
            .btn-dificuldade.facil {
                background: #4CAF50;
                color: white;
            }
            .btn-dificuldade.medio {
                background: #ff9800;
                color: white;
            }
            .btn-dificuldade.dificil {
                background: #f44336;
                color: white;
            }
            .btn-dificuldade:hover {
                transform: scale(1.02);
            }
            
            .jogo-area {
                display: none;
            }
            
            .mensagem {
                background: #f5f5f5;
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 20px;
                font-size: 1.1em;
                line-height: 1.5;
                white-space: pre-wrap;
            }
            
            .palpite-area {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .palpite-input {
                flex: 2;
                padding: 15px;
                font-size: 1.2em;
                border: 2px solid #ddd;
                border-radius: 10px;
                text-align: center;
                font-weight: bold;
            }
            
            .btn-palpite {
                flex: 1;
                background: #764ba2;
                color: white;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                font-size: 1.1em;
                font-weight: bold;
            }
            
            .btn-palpite:hover {
                background: #5a3a7a;
            }
            
            .stats {
                display: flex;
                justify-content: space-around;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 2px solid #eee;
            }
            
            .stat {
                text-align: center;
            }
            
            .stat-label {
                font-size: 12px;
                color: #999;
            }
            
            .stat-value {
                font-size: 1.5em;
                font-weight: bold;
                color: #764ba2;
            }
            
            .btn-dica {
                background: #2196F3;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                margin-top: 10px;
                width: 100%;
            }
            
            .btn-reiniciar {
                background: #607D8B;
                color: white;
                border: none;
                padding: 12px;
                border-radius: 8px;
                cursor: pointer;
                width: 100%;
                margin-top: 10px;
            }
            
            .loading {
                display: inline-block;
                width: 20px;
                height: 20px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #764ba2;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-left: 10px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="card">
                <div>
                    <span class="badge-node">🟢 Node.js (Interface)</span>
                    <span class="badge-python">🐍 Python (Lógica)</span>
                </div>
                <h1>🎯 Adivinhe o Número</h1>
                <p class="subtitle">Python pensa | Node.js entrega</p>
                
                <div id="inicioArea">
                    <div class="dificuldade-area">
                        <button class="btn-dificuldade facil" onclick="iniciarJogo('facil')">🎲 Fácil (1-50)</button>
                        <button class="btn-dificuldade medio" onclick="iniciarJogo('medio')">⭐ Médio (1-100)</button>
                        <button class="btn-dificuldade dificil" onclick="iniciarJogo('dificil')">💀 Difícil (1-200)</button>
                    </div>
                </div>
                
                <div id="jogoArea" class="jogo-area">
                    <div class="mensagem" id="mensagem"></div>
                    
                    <div class="palpite-area">
                        <input type="number" id="palpite" class="palpite-input" placeholder="Digite seu palpite...">
                        <button class="btn-palpite" onclick="fazerPalpite()">🔍 Chutar</button>
                    </div>
                    
                    <button class="btn-dica" onclick="pedirDica()">💡 Pedir Dica</button>
                    <button class="btn-reiniciar" onclick="reiniciar()">🔄 Novo Jogo</button>
                    
                    <div class="stats">
                        <div class="stat">
                            <div class="stat-label">🎯 Tentativas</div>
                            <div class="stat-value" id="tentativas">0</div>
                        </div>
                        <div class="stat">
                            <div class="stat-label">🏆 Pontuação</div>
                            <div class="stat-value" id="pontuacao">0</div>
                        </div>
                        <div class="stat">
                            <div class="stat-label">🏅 Recorde</div>
                            <div class="stat-value" id="recorde">${jogoAtual.recorde}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
            let jogoAtivo = false;
            let numeroSecreto = null;
            let dificuldadeAtual = null;
            
            function iniciarJogo(dificuldade) {
                document.querySelector('.dificuldade-area').innerHTML += '<div class="loading" id="loading"></div>';
                
                fetch('/iniciar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dificuldade: dificuldade })
                })
                .then(res => res.json())
                .then(data => {
                    document.getElementById('loading')?.remove();
                    if (data.erro) {
                        alert('Erro: ' + data.erro);
                        return;
                    }
                    
                    jogoAtivo = true;
                    numeroSecreto = data.numero_secreto;
                    dificuldadeAtual = data.dificuldade;
                    
                    document.getElementById('inicioArea').style.display = 'none';
                    document.getElementById('jogoArea').style.display = 'block';
                    document.getElementById('mensagem').innerHTML = data.mensagem;
                    document.getElementById('tentativas').textContent = '0';
                    document.getElementById('pontuacao').textContent = '0';
                    document.getElementById('palpite').value = '';
                    document.getElementById('palpite').focus();
                });
            }
            
            function fazerPalpite() {
                if (!jogoAtivo) return;
                
                const palpite = parseInt(document.getElementById('palpite').value);
                if (isNaN(palpite)) {
                    alert('Digite um número válido!');
                    return;
                }
                
                document.getElementById('mensagem').innerHTML += '<div class="loading"></div>';
                
                fetch('/palpite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        palpite: palpite,
                        numero_secreto: numeroSecreto,
                        tentativas: parseInt(document.getElementById('tentativas').textContent),
                        dificuldade: dificuldadeAtual
                    })
                })
                .then(res => res.json())
                .then(data => {
                    document.getElementById('mensagem').innerHTML = data.mensagem;
                    document.getElementById('tentativas').textContent = data.tentativas;
                    
                    if (data.dica) {
                        document.getElementById('mensagem').innerHTML += '<br><br>💡 Dica: ' + data.dica;
                    }
                    
                    if (data.acertou) {
                        jogoAtivo = false;
                        document.getElementById('pontuacao').textContent = data.pontuacao;
                        document.getElementById('recorde').textContent = data.recorde || document.getElementById('recorde').textContent;
                        document.getElementById('mensagem').innerHTML += '<br><br>🎉 ' + data.mensagem;
                        if (data.pontuacao > 0) {
                            document.getElementById('mensagem').innerHTML += '<br>🏆 Pontuação: ' + data.pontuacao;
                        }
                    }
                    
                    document.getElementById('palpite').value = '';
                    document.getElementById('palpite').focus();
                });
            }
            
            function pedirDica() {
                if (!jogoAtivo) return;
                
                const ultimoPalpite = document.getElementById('palpite').value;
                if (!ultimoPalpite) {
                    alert('Faça um palpite primeiro!');
                    return;
                }
                
                fetch('/dica', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        numero_secreto: numeroSecreto,
                        ultimo_palpite: parseInt(ultimoPalpite)
                    })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.mensagem) {
                        const msgDiv = document.getElementById('mensagem');
                        msgDiv.innerHTML += '<br><br>💡 ' + data.mensagem;
                        setTimeout(() => {
                            msgDiv.innerHTML = msgDiv.innerHTML.replace(/<br><br>💡.*$/, '');
                        }, 3000);
                    }
                });
            }
            
            function reiniciar() {
                jogoAtivo = false;
                document.getElementById('jogoArea').style.display = 'none';
                document.getElementById('inicioArea').style.display = 'block';
                document.getElementById('mensagem').innerHTML = '';
            }
        </script>
    </body>
    </html>
    `);
});

// ========== API ROTAS ==========

app.post('/iniciar', (req, res) => {
    const { dificuldade } = req.body;
    
    chamarPython({ acao: 'iniciar', dificuldade: dificuldade }, (resultado) => {
        if (resultado.erro) {
            res.json({ erro: resultado.erro });
        } else {
            jogoAtual.ativo = true;
            jogoAtual.numero_secreto = resultado.numero_secreto;
            jogoAtual.dificuldade = resultado.dificuldade;
            jogoAtual.tentativas = 0;
            res.json(resultado);
        }
    });
});

app.post('/palpite', (req, res) => {
    const { palpite, numero_secreto, tentativas, dificuldade } = req.body;
    
    chamarPython({ 
        acao: 'palpite', 
        numero_secreto: numero_secreto, 
        palpite: palpite, 
        tentativas: tentativas,
        dificuldade: dificuldade
    }, (resultado) => {
        if (resultado.erro) {
            res.json({ erro: resultado.erro });
        } else {
            if (resultado.acertou) {
                jogoAtual.ativo = false;
                if (resultado.pontuacao > jogoAtual.recorde) {
                    jogoAtual.recorde = resultado.pontuacao;
                    salvarRecorde();
                    resultado.recorde = jogoAtual.recorde;
                }
            }
            res.json(resultado);
        }
    });
});

app.post('/dica', (req, res) => {
    const { numero_secreto, ultimo_palpite } = req.body;
    
    chamarPython({ 
        acao: 'dica', 
        numero_secreto: numero_secreto, 
        ultimo_palpite: ultimo_palpite 
    }, (resultado) => {
        res.json(resultado);
    });
});

// Iniciar servidor
const PORTA = 3024;
app.listen(PORTA, () => {
    console.log('========================================');
    console.log('🎯 JOGO DA ADIVINHAÇÃO (Python + Node.js)');
    console.log(`👉 http://localhost:${PORTA}`);
    console.log('========================================');
    console.log('');
    console.log('🐍 Python: Lógica do jogo, números aleatórios, pontuação');
    console.log('🟢 Node.js: Interface web, API, salvamento de recorde');
    console.log('========================================');
});