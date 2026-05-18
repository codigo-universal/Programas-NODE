const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota principal
app.get('/', (req, res) => {
    // Listar arquivos .py
    var scripts = [];
    try {
        var arquivos = fs.readdirSync(__dirname);
        for (var i = 0; i < arquivos.length; i++) {
            if (arquivos[i].endsWith('.py')) {
                scripts.push(arquivos[i]);
            }
        }
    } catch(e) {}
    
    var options = '';
    for (var i = 0; i < scripts.length; i++) {
        options += '<option value="' + scripts[i] + '">' + scripts[i] + '</option>';
    }
    
    if (options === '') {
        options = '<option value="">Nenhum .py encontrado</option>';
    }
    
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Executar Python</title>
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
                max-width: 600px;
                width: 100%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            h1 { color: #764ba2; margin-bottom: 10px; }
            select, button {
                padding: 12px;
                font-size: 16px;
                border-radius: 10px;
                margin: 10px 5px;
            }
            select {
                border: 2px solid #ddd;
                width: 200px;
            }
            button {
                background: #4CAF50;
                color: white;
                border: none;
                cursor: pointer;
            }
            .console {
                background: #1e1e1e;
                color: #d4d4d4;
                border-radius: 10px;
                padding: 20px;
                text-align: left;
                font-family: monospace;
                margin-top: 20px;
                min-height: 150px;
                white-space: pre-wrap;
                font-size: 13px;
            }
            .saida { color: #6a9955; }
            .erro { color: #f48771; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🐍 Executar Python</h1>
            <p>Selecione um arquivo .py:</p>
            <select id="scriptSelect">${options}</select>
            <button onclick="executar()">▶ Executar</button>
            <div class="console" id="console">⚡ Aguardando...</div>
        </div>
        
        <script>
            function executar() {
                var select = document.getElementById('scriptSelect');
                var nome = select.value;
                var consoleDiv = document.getElementById('console');
                
                if (!nome) {
                    consoleDiv.innerHTML = '<span class="erro">Selecione um arquivo!</span>';
                    return;
                }
                
                consoleDiv.innerHTML = '<span class="info">Executando ' + nome + '...</span>';
                
                fetch('/executar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome: nome })
                })
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    if (data.erro) {
                        consoleDiv.innerHTML = '<span class="erro">ERRO:\\n' + data.mensagem + '</span>';
                    } else {
                        consoleDiv.innerHTML = '<span class="saida">SAÍDA:\\n' + data.saida + '</span>';
                    }
                })
                .catch(function(err) {
                    consoleDiv.innerHTML = '<span class="erro">Erro: ' + err.message + '</span>';
                });
            }
        </script>
    </body>
    </html>
    `);
});

// Rota para executar
app.post('/executar', function(req, res) {
    var nome = req.body.nome;
    var caminho = path.join(__dirname, nome);
    
    console.log('Executando:', caminho);
    
    if (!fs.existsSync(caminho)) {
        return res.json({ erro: true, mensagem: 'Arquivo não encontrado: ' + nome });
    }
    
    // Tentar com py
    exec('py "' + caminho + '"', { timeout: 10000 }, function(error, stdout, stderr) {
        if (error) {
            // Tentar com python
            exec('python "' + caminho + '"', { timeout: 10000 }, function(error2, stdout2, stderr2) {
                if (error2) {
                    res.json({ erro: true, mensagem: stderr2 || error2.message });
                } else {
                    res.json({ erro: false, saida: stdout2 });
                }
            });
        } else {
            res.json({ erro: false, saida: stdout });
        }
    });
});

// Iniciar servidor
var PORTA = 3018;
app.listen(PORTA, function() {
    console.log('========================================');
    console.log('🐍 EXECUTOR PYTHON');
    console.log('👉 http://localhost:' + PORTA);
    console.log('========================================');
    console.log('📁 Pasta: ' + __dirname);
    console.log('========================================');
});