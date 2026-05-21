const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Verificar se o script Python existe
const pythonScript = path.join(__dirname, 'analisador-sentimentos.py');
console.log('🐍 Script Python:', pythonScript);
console.log('📁 Existe?', fs.existsSync(pythonScript));

// ========== PÁGINA PRINCIPAL ==========
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Analisador de Sentimentos</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                font-family: 'Segoe UI', Arial, sans-serif;
                min-height: 100vh;
                padding: 20px;
            }
            
            .container {
                max-width: 800px;
                margin: 0 auto;
            }
            
            .header {
                background: white;
                border-radius: 20px;
                padding: 30px;
                margin-bottom: 20px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            
            .header h1 {
                color: #764ba2;
                font-size: 2em;
                margin-bottom: 10px;
            }
            
            .header p {
                color: #666;
            }
            
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
            
            textarea {
                width: 100%;
                padding: 15px;
                font-size: 16px;
                border: 2px solid #ddd;
                border-radius: 15px;
                resize: vertical;
                font-family: inherit;
                margin-bottom: 15px;
            }
            
            textarea:focus {
                border-color: #764ba2;
                outline: none;
            }
            
            button {
                background: #764ba2;
                color: white;
                padding: 12px 30px;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                cursor: pointer;
                transition: transform 0.2s;
                width: 100%;
            }
            
            button:hover {
                transform: scale(1.02);
            }
            
            .exemplos {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                margin-top: 15px;
            }
            
            .exemplo-btn {
                background: #e0e0e0;
                color: #333;
                padding: 8px 15px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 12px;
                transition: background 0.2s;
            }
            
            .exemplo-btn:hover {
                background: #764ba2;
                color: white;
            }
            
            .resultado {
                display: none;
                margin-top: 20px;
                padding: 20px;
                border-radius: 15px;
                text-align: center;
            }
            
            .resultado.positivo {
                background: #e8f5e9;
                border: 2px solid #4CAF50;
            }
            
            .resultado.negativo {
                background: #ffebee;
                border: 2px solid #f44336;
            }
            
            .resultado.neutro {
                background: #f5f5f5;
                border: 2px solid #999;
            }
            
            .resultado-emoji {
                font-size: 3em;
            }
            
            .resultado-sentimento {
                font-size: 1.5em;
                font-weight: bold;
                margin: 10px 0;
            }
            
            .resultado-pontuacao {
                font-size: 0.9em;
                margin-top: 10px;
            }
            
            .palavras {
                margin-top: 15px;
                padding: 10px;
                background: rgba(0,0,0,0.05);
                border-radius: 10px;
            }
            
            .frase-motivacional {
                margin-top: 15px;
                padding: 15px;
                background: #e3f2fd;
                border-radius: 10px;
                color: #1976d2;
                font-style: italic;
            }
            
            .loading {
                display: none;
                text-align: center;
                margin-top: 20px;
                color: #666;
            }
            
            .erro {
                color: #f44336;
                margin-top: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔍 Analisador de Sentimentos</h1>
                <p>Node.js + Python analisam suas frases!</p>
                <div>
                    <span class="badge-node">🟢 Node.js</span>
                    <span class="badge-python">🐍 Python</span>
                </div>
            </div>
            
            <div class="card">
                <textarea id="frase" rows="4" placeholder="Digite uma frase para analisar...&#10;&#10;Exemplos:&#10;- Hoje estou muito feliz!&#10;- Que dia terrível...&#10;- O filme foi legal, mas podia ser melhor"></textarea>
                
                <button onclick="analisar()">🔍 Analisar Sentimento</button>
                
                <div class="exemplos">
                    <span class="exemplo-btn" onclick="usarExemplo('Estou muito feliz hoje! 😊')">😊 Feliz</span>
                    <span class="exemplo-btn" onclick="usarExemplo('Que dia horrível, tudo deu errado!')">😔 Triste</span>
                    <span class="exemplo-btn" onclick="usarExemplo('O filme foi bom, mas o livro é melhor')">😐 Neutro</span>
                    <span class="exemplo-btn" onclick="usarExemplo('Amo programar em Python e Node.js!')">💻 Programação</span>
                </div>
            </div>
            
            <div id="resultado" class="resultado"></div>
            <div id="loading" class="loading">⏳ Analisando com Python...</div>
        </div>
        
        <script>
            function usarExemplo(texto) {
                document.getElementById('frase').value = texto;
                analisar();
            }
            
            function analisar() {
                var frase = document.getElementById('frase').value.trim();
                
                if (!frase) {
                    alert('Digite uma frase para analisar!');
                    return;
                }
                
                var resultadoDiv = document.getElementById('resultado');
                var loadingDiv = document.getElementById('loading');
                
                resultadoDiv.style.display = 'none';
                loadingDiv.style.display = 'block';
                
                fetch('/analisar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ texto: frase })
                })
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    loadingDiv.style.display = 'none';
                    
                    if (data.erro) {
                        resultadoDiv.innerHTML = '<div class="erro">❌ ' + data.erro + '</div>';
                        resultadoDiv.style.display = 'block';
                        return;
                    }
                    
                    var html = '';
                    html += '<div class="resultado-emoji">' + data.emoji + '</div>';
                    html += '<div class="resultado-sentimento">Sentimento: <strong>' + data.sentimento.toUpperCase() + '</strong></div>';
                    
                    // Barra de intensidade
                    html += '<div class="resultado-pontuacao">';
                    html += '<div style="background:#e0e0e0; border-radius:10px; margin-top:10px;">';
                    html += '<div style="width:' + data.intensidade + '%; background:' + (data.sentimento === 'positivo' ? '#4CAF50' : (data.sentimento === 'negativo' ? '#f44336' : '#999')) + '; height:10px; border-radius:10px;"></div>';
                    html += '</div>';
                    html += '<div>Pontuação: ' + data.pontuacao + ' | Intensidade: ' + data.intensidade + '%</div>';
                    html += '</div>';
                    
                    if (data.palavras_positivas && data.palavras_positivas.length > 0) {
                        html += '<div class="palavras">✅ Palavras positivas: ' + data.palavras_positivas.join(', ') + '</div>';
                    }
                    
                    if (data.palavras_negativas && data.palavras_negativas.length > 0) {
                        html += '<div class="palavras">❌ Palavras negativas: ' + data.palavras_negativas.join(', ') + '</div>';
                    }
                    
                    if (data.frase_motivacional) {
                        html += '<div class="frase-motivacional">💪 ' + data.frase_motivacional + '</div>';
                    }
                    
                    resultadoDiv.innerHTML = html;
                    resultadoDiv.className = 'resultado ' + data.sentimento;
                    resultadoDiv.style.display = 'block';
                })
                .catch(function(err) {
                    loadingDiv.style.display = 'none';
                    resultadoDiv.innerHTML = '<div class="erro">❌ Erro: ' + err.message + '</div>';
                    resultadoDiv.style.display = 'block';
                });
            }
        </script>
    </body>
    </html>
    `);
});

// ========== API ==========
app.post('/analisar', (req, res) => {
    var texto = req.body.texto;
    var caminhoScript = path.join(__dirname, 'analisadordesentimentos.py');
    
    // Verificar se o arquivo Python existe
    if (!fs.existsSync(caminhoScript)) {
        return res.json({ erro: 'Script Python não encontrado: ' + caminhoScript });
    }
    
    var dados = JSON.stringify({ texto: texto });
    
    var processo = exec('python "' + caminhoScript + '"', { timeout: 10000 }, function(error, stdout, stderr) {
        if (error) {
            console.error('Erro:', stderr);
            return res.json({ erro: stderr || error.message });
        }
        
        try {
            var resultado = JSON.parse(stdout);
            res.json(resultado);
        } catch(e) {
            res.json({ erro: 'Erro ao processar resultado: ' + stdout });
        }
    });
    
    processo.stdin.write(dados);
    processo.stdin.end();
});

// Iniciar servidor
var PORTA = 3021;
app.listen(PORTA, function() {
    console.log('========================================');
    console.log('🔍 ANALISADOR DE SENTIMENTOS');
    console.log('👉 http://localhost:' + PORTA);
    console.log('========================================');
    console.log('');
    console.log('🐍 Python + 🟢 Node.js integrados!');
    console.log('========================================');
});