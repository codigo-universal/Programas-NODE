const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Calculadora Python + Node.js</title>
        <meta charset="utf-8">
        <style>
            body {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                font-family: 'Segoe UI', Arial, sans-serif;
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
                padding: 40px;
                text-align: center;
                max-width: 500px;
                width: 100%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            h1 { color: #764ba2; margin-bottom: 10px; }
            .subtitle { color: #666; margin-bottom: 30px; font-size: 14px; }
            .display {
                background: #1e1e1e;
                color: #4ec9b0;
                font-size: 2em;
                padding: 20px;
                border-radius: 10px;
                text-align: right;
                font-family: monospace;
                margin-bottom: 20px;
                min-height: 80px;
            }
            .buttons {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 10px;
                margin-bottom: 20px;
            }
            button {
                padding: 20px;
                font-size: 1.2em;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                background: #f0f0f0;
            }
            button:hover { transform: scale(1.02); }
            .btn-num { background: #e0e0e0; font-weight: bold; }
            .btn-op { background: #ff9800; color: white; }
            .btn-equals { background: #4CAF50; color: white; }
            .btn-clear { background: #f44336; color: white; }
            .resultado {
                background: #e8f5e9;
                padding: 15px;
                border-radius: 10px;
                margin-top: 20px;
                color: #2e7d32;
                font-weight: bold;
            }
            .loading { display: none; color: #666; margin-top: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🧮 Calculadora</h1>
            <p class="subtitle">Python + Node.js integrados!</p>
            
            <div class="display" id="display">0</div>
            
            <div class="buttons">
                <button class="btn-clear" onclick="limpar()">C</button>
                <button class="btn-op" onclick="adicionarOperacao('/')">÷</button>
                <button class="btn-op" onclick="adicionarOperacao('*')">×</button>
                <button class="btn-op" onclick="adicionarOperacao('-')">-</button>
                
                <button class="btn-num" onclick="adicionarNumero('7')">7</button>
                <button class="btn-num" onclick="adicionarNumero('8')">8</button>
                <button class="btn-num" onclick="adicionarNumero('9')">9</button>
                <button class="btn-op" onclick="adicionarOperacao('+')">+</button>
                
                <button class="btn-num" onclick="adicionarNumero('4')">4</button>
                <button class="btn-num" onclick="adicionarNumero('5')">5</button>
                <button class="btn-num" onclick="adicionarNumero('6')">6</button>
                <button class="btn-equals" onclick="calcular()">=</button>
                
                <button class="btn-num" onclick="adicionarNumero('1')">1</button>
                <button class="btn-num" onclick="adicionarNumero('2')">2</button>
                <button class="btn-num" onclick="adicionarNumero('3')">3</button>
                
                <button class="btn-num" onclick="adicionarNumero('0')">0</button>
                <button class="btn-num" onclick="adicionarNumero('.')">.</button>
                <button class="btn-op" onclick="backspace()">⌫</button>
            </div>
            
            <div id="resultado" class="resultado" style="display:none"></div>
            <div id="loading" class="loading">⏳ Calculando no Python...</div>
        </div>
        
        <script>
            var expressao = '';
            
            function atualizarDisplay() {
                document.getElementById('display').textContent = expressao || '0';
            }
            
            function adicionarNumero(num) {
                expressao += num;
                atualizarDisplay();
                document.getElementById('resultado').style.display = 'none';
            }
            
            function adicionarOperacao(op) {
                if (expressao && !isNaN(expressao.slice(-1))) {
                    expressao += op;
                    atualizarDisplay();
                    document.getElementById('resultado').style.display = 'none';
                }
            }
            
            function limpar() {
                expressao = '';
                atualizarDisplay();
                document.getElementById('resultado').style.display = 'none';
            }
            
            function backspace() {
                expressao = expressao.slice(0, -1);
                atualizarDisplay();
                document.getElementById('resultado').style.display = 'none';
            }
            
            function calcular() {
                if (!expressao) return;
                
                var match = expressao.match(/(\\d+\\.?\\d*)\\s*([\\+\\-\\*\\/])\\s*(\\d+\\.?\\d*)/);
                if (!match) {
                    alert('Digite algo como: 10 + 5');
                    return;
                }
                
                var num1 = parseFloat(match[1]);
                var operador = match[2];
                var num2 = parseFloat(match[3]);
                
                var operacao = '';
                if (operador === '+') operacao = 'soma';
                else if (operador === '-') operacao = 'subtracao';
                else if (operador === '*') operacao = 'multiplicacao';
                else if (operador === '/') operacao = 'divisao';
                
                document.getElementById('loading').style.display = 'block';
                document.getElementById('resultado').style.display = 'none';
                
                fetch('/calcular', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ num1: num1, num2: num2, operacao: operacao })
                })
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    document.getElementById('loading').style.display = 'none';
                    if (data.erro) {
                        document.getElementById('resultado').innerHTML = '❌ ' + data.erro;
                    } else {
                        document.getElementById('resultado').innerHTML = '🐍 Python: ' + num1 + ' ' + operador + ' ' + num2 + ' = ' + data.resultado;
                    }
                    document.getElementById('resultado').style.display = 'block';
                })
                .catch(function(err) {
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('resultado').innerHTML = '❌ Erro: ' + err.message;
                    document.getElementById('resultado').style.display = 'block';
                });
            }
        </script>
    </body>
    </html>
    `);
});

// Rota para calcular via Python
app.post('/calcular', (req, res) => {
    var num1 = req.body.num1;
    var num2 = req.body.num2;
    var operacao = req.body.operacao;
    
    var caminhoScript = path.join(__dirname, 'calculadoraempython.py');
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(caminhoScript)) {
        return res.json({ erro: 'Arquivo calculadoraempython.py nao encontrado!' });
    }
    
    var dados = JSON.stringify({ num1: num1, num2: num2, operacao: operacao });
    
    var processo = exec('python "' + caminhoScript + '"', { timeout: 5000 }, function(error, stdout, stderr) {
        if (error) {
            res.json({ erro: stderr || error.message });
        } else {
            res.json({ resultado: stdout.trim() });
        }
    });
    
    processo.stdin.write(dados);
    processo.stdin.end();
});

// Iniciar servidor
var PORTA = 3019;
app.listen(PORTA, function() {
    console.log('========================================');
    console.log('🧮 CALCULADORA PYTHON + NODE.JS');
    console.log('👉 http://localhost:' + PORTA);
    console.log('========================================');
});