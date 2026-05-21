const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Arquivo para salvar senhas
const ARQUIVO_SENHAS = path.join(__dirname, '..', 'dados', 'senhas-python.json');

function carregarSenhas() {
    try {
        if (fs.existsSync(ARQUIVO_SENHAS)) {
            return JSON.parse(fs.readFileSync(ARQUIVO_SENHAS, 'utf8'));
        }
    } catch(e) {}
    return [];
}

function salvarSenha(senha, forca, servico) {
    const senhas = carregarSenhas();
    senhas.unshift({
        id: Date.now(),
        senha: senha,
        forca: forca,
        servico: servico || 'Não especificado',
        data: new Date().toLocaleString(),
        tamanho: senha.length
    });
    if (senhas.length > 50) senhas.pop();
    fs.writeFileSync(ARQUIVO_SENHAS, JSON.stringify(senhas, null, 2));
}

// ========== ROTA PRINCIPAL ==========
app.get('/', (req, res) => {
    const senhasSalvas = carregarSenhas();
    
    let historicoHTML = '';
    senhasSalvas.forEach(s => {
        const forcaCor = s.forca === 'MUITO FORTE' ? '#2e7d32' : (s.forca === 'FORTE' ? '#1976d2' : (s.forca === 'MEDIA' ? '#ed6c02' : '#d32f2f'));
        historicoHTML += `
            <div class="historico-item">
                <div class="historico-senha">${'•'.repeat(Math.min(s.senha.length, 15))}</div>
                <div class="historico-info">
                    <span style="color:${forcaCor}">${s.forca}</span>
                    <span>${s.tamanho} chars</span>
                    <span>${s.servico}</span>
                    <small>${s.data}</small>
                </div>
                <button class="btn-copiar" onclick="copiarSenha('${s.senha}')">📋</button>
            </div>
        `;
    });
    
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Gerador de Senhas (Python + Node.js)</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                font-family: 'Segoe UI', Arial, sans-serif;
                min-height: 100vh;
                padding: 20px;
            }
            
            .container { max-width: 800px; margin: 0 auto; }
            
            .header {
                background: white;
                border-radius: 20px;
                padding: 30px;
                margin-bottom: 20px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            
            .header h1 { color: #764ba2; font-size: 2em; margin-bottom: 10px; }
            .header p { color: #666; }
            
            .badge-node {
                background: #339933;
                color: white;
                padding: 5px 12px;
                border-radius: 20px;
                display: inline-block;
                margin: 5px;
                font-size: 12px;
            }
            
            .badge-python {
                background: #3776ab;
                color: white;
                padding: 5px 12px;
                border-radius: 20px;
                display: inline-block;
                margin: 5px;
                font-size: 12px;
            }
            
            .card {
                background: white;
                border-radius: 20px;
                padding: 30px;
                margin-bottom: 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            
            .senha-display {
                background: #f5f5f5;
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 20px;
                text-align: center;
                position: relative;
            }
            
            .senha-value {
                font-size: 1.5em;
                font-family: monospace;
                word-break: break-all;
                letter-spacing: 1px;
                color: #333;
            }
            
            .btn-copiar-senha {
                position: absolute;
                right: 20px;
                top: 50%;
                transform: translateY(-50%);
                background: #4CAF50;
                color: white;
                border: none;
                padding: 8px 15px;
                border-radius: 8px;
                cursor: pointer;
            }
            
            .controles {
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .controle-group {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .controle-group label { color: #666; }
            input[type="range"] { width: 200px; }
            input[type="checkbox"] { width: 20px; height: 20px; cursor: pointer; }
            .tamanho-valor { font-weight: bold; color: #764ba2; min-width: 40px; }
            
            .btn-gerar {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                cursor: pointer;
                transition: transform 0.2s;
                margin-top: 10px;
            }
            
            .btn-gerar:hover { transform: scale(1.02); }
            
            .forca-indicador {
                margin-top: 20px;
                padding: 15px;
                border-radius: 10px;
                text-align: center;
                display: none;
            }
            
            .salvar-area {
                margin-top: 20px;
                display: flex;
                gap: 10px;
            }
            
            .salvar-area input {
                flex: 2;
                padding: 10px;
                border: 2px solid #ddd;
                border-radius: 8px;
            }
            
            .salvar-area button {
                flex: 1;
                background: #2196F3;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
            }
            
            .historico h3 { color: #764ba2; margin-bottom: 15px; }
            
            .historico-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                border-bottom: 1px solid #eee;
                gap: 10px;
                flex-wrap: wrap;
            }
            
            .historico-senha { font-family: monospace; font-size: 1.1em; min-width: 100px; }
            .historico-info { flex: 1; display: flex; gap: 15px; font-size: 12px; color: #666; flex-wrap: wrap; }
            .btn-copiar { background: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; }
            
            .toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #333;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                display: none;
                z-index: 1000;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Gerador de Senhas</h1>
                <p>Python gera | Node.js entrega</p>
                <div>
                    <span class="badge-node">🟢 Node.js</span>
                    <span class="badge-python">🐍 Python</span>
                </div>
            </div>
            
            <div class="card">
                <div class="senha-display">
                    <div class="senha-value" id="senhaGerada">Clique em Gerar Senha</div>
                    <button class="btn-copiar-senha" onclick="copiarSenhaAtual()">📋 Copiar</button>
                </div>
                
                <div class="controles">
                    <div class="controle-group">
                        <label>📏 Tamanho: <span id="tamanhoValor" class="tamanho-valor">12</span></label>
                        <input type="range" id="tamanho" min="6" max="32" value="12" oninput="atualizarTamanho()">
                    </div>
                    <div class="controle-group">
                        <label>🔠 Maiúsculas (A-Z)</label>
                        <input type="checkbox" id="maiusculas" checked>
                    </div>
                    <div class="controle-group">
                        <label>🔡 Minúsculas (a-z)</label>
                        <input type="checkbox" id="minusculas" checked>
                    </div>
                    <div class="controle-group">
                        <label>🔢 Números (0-9)</label>
                        <input type="checkbox" id="numeros" checked>
                    </div>
                    <div class="controle-group">
                        <label>✨ Símbolos (!@#$%)</label>
                        <input type="checkbox" id="simbolos" checked>
                    </div>
                </div>
                
                <button class="btn-gerar" onclick="gerarNovaSenha()">🔄 Gerar com Python</button>
                
                <div id="forcaIndicador" class="forca-indicador"></div>
                
                <div class="salvar-area">
                    <input type="text" id="servico" placeholder="Para qual serviço? (ex: Gmail, Facebook)">
                    <button onclick="salvarSenha()">💾 Salvar Senha</button>
                </div>
            </div>
            
            <div class="card">
                <div class="historico">
                    <h3>📜 Últimas Senhas Salvas</h3>
                    <div id="historico">${historicoHTML || '<div style="text-align:center; color:#999; padding:20px;">Nenhuma senha salva ainda</div>'}</div>
                </div>
            </div>
        </div>
        
        <div id="toast" class="toast"></div>
        
        <script>
            let senhaAtual = '';
            let forcaAtual = {};
            
            function atualizarTamanho() {
                document.getElementById('tamanhoValor').textContent = document.getElementById('tamanho').value;
            }
            
            function gerarNovaSenha() {
                const dados = {
                    tamanho: parseInt(document.getElementById('tamanho').value),
                    maiusculas: document.getElementById('maiusculas').checked,
                    minusculas: document.getElementById('minusculas').checked,
                    numeros: document.getElementById('numeros').checked,
                    simbolos: document.getElementById('simbolos').checked
                };
                
                fetch('/gerar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                })
                .then(res => res.json())
                .then(data => {
                    if (data.erro) {
                        mostrarToast('❌ ' + data.erro, 'error');
                        return;
                    }
                    
                    senhaAtual = data.senha;
                    forcaAtual = data.forca;
                    document.getElementById('senhaGerada').textContent = data.senha;
                    
                    const forcaDiv = document.getElementById('forcaIndicador');
                    forcaDiv.style.display = 'block';
                    forcaDiv.style.background = data.forca.bg || '#f5f5f5';
                    forcaDiv.innerHTML = '<strong style="color:' + data.forca.cor + '">' + data.forca.nivel + '</strong><br>' + data.forca.mensagem;
                });
            }
            
            function copiarSenhaAtual() {
                if (!senhaAtual) {
                    mostrarToast('Gere uma senha primeiro!', 'error');
                    return;
                }
                navigator.clipboard.writeText(senhaAtual);
                mostrarToast('✅ Senha copiada!', 'success');
            }
            
            function copiarSenha(senha) {
                navigator.clipboard.writeText(senha);
                mostrarToast('✅ Senha copiada!', 'success');
            }
            
            function salvarSenha() {
                if (!senhaAtual) {
                    mostrarToast('Gere uma senha primeiro!', 'error');
                    return;
                }
                
                const servico = document.getElementById('servico').value;
                
                fetch('/salvar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ senha: senhaAtual, forca: forcaAtual.nivel, servico: servico })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        mostrarToast('✅ Senha salva!', 'success');
                        document.getElementById('servico').value = '';
                        setTimeout(() => location.reload(), 1000);
                    }
                });
            }
            
            function mostrarToast(msg, tipo) {
                const toast = document.getElementById('toast');
                toast.textContent = msg;
                toast.style.background = tipo === 'error' ? '#f44336' : '#4CAF50';
                toast.style.display = 'block';
                setTimeout(() => toast.style.display = 'none', 2000);
            }
            
            gerarNovaSenha();
        </script>
    </body>
    </html>
    `);
});

// ========== API ROTAS ==========

app.post('/gerar', (req, res) => {
    const { tamanho, maiusculas, minusculas, numeros, simbolos } = req.body;
    const caminhoScript = path.join(__dirname, 'geradordesenha.py');
    const dados = JSON.stringify({ tamanho, maiusculas, minusculas, numeros, simbolos });
    
    const processo = exec('python "' + caminhoScript + '"', { timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
            return res.json({ erro: stderr || error.message });
        }
        try {
            const resultado = JSON.parse(stdout);
            res.json(resultado);
        } catch(e) {
            res.json({ erro: 'Erro ao processar resultado' });
        }
    });
    
    processo.stdin.write(dados);
    processo.stdin.end();
});

app.post('/salvar', (req, res) => {
    const { senha, forca, servico } = req.body;
    salvarSenha(senha, forca, servico);
    res.json({ success: true });
});

// Iniciar servidor
const PORTA = 3023;
app.listen(PORTA, () => {
    console.log('========================================');
    console.log('🔐 GERADOR DE SENHAS (Python + Node.js)');
    console.log(`👉 http://localhost:${PORTA}`);
    console.log('========================================');
    console.log('');
    console.log('🐍 Python gera as senhas');
    console.log('🟢 Node.js serve a interface e salva os dados');
    console.log('========================================');
});