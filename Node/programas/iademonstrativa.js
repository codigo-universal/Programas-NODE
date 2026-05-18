const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Arquivos para salvar dados
const ARQUIVO_CONHECIMENTO = path.join(__dirname, '..', 'dados', 'ia-progresso-conhecimento.json');
const ARQUIVO_ESTATISTICAS = path.join(__dirname, '..', 'dados', 'ia-progresso-estatisticas.json');

// ========== CARREGAR DADOS ==========
function carregarConhecimento() {
    try {
        if (fs.existsSync(ARQUIVO_CONHECIMENTO)) {
            const dados = fs.readFileSync(ARQUIVO_CONHECIMENTO, 'utf8');
            return JSON.parse(dados);
        }
    } catch (erro) {
        console.error('Erro ao carregar conhecimento:', erro);
    }
    
    // Conhecimento inicial
    return {
        saudacoes: {
            palavras: ['oi', 'olá', 'opa', 'bom dia', 'boa tarde', 'boa noite', 'hello'],
            respostas: ['Olá! Como posso ajudar? 😊', 'Oi! Tudo bem?', 'Olá! Prazer em conversar!']
        },
        despedidas: {
            palavras: ['tchau', 'adeus', 'até logo', 'até mais', 'bye'],
            respostas: ['Até logo! 👋', 'Tchau! Volte sempre!', 'Até mais!']
        },
        nome: {
            palavras: ['qual seu nome', 'quem é você', 'como se chama', 'seu nome'],
            respostas: ['Sou a ProgressIA! Uma IA que evolui com você! 🧠']
        },
        nodejs: {
            palavras: ['node', 'node.js', 'javascript'],
            respostas: ['Node.js é onde eu existo! 🚀', 'JavaScript no servidor!']
        }
    };
}

function carregarEstatisticas() {
    try {
        if (fs.existsSync(ARQUIVO_ESTATISTICAS)) {
            const dados = fs.readFileSync(ARQUIVO_ESTATISTICAS, 'utf8');
            return JSON.parse(dados);
        }
    } catch (erro) {}
    
    return {
        totalAprendizados: 0,
        totalPerguntas: 0,
        totalAcertos: 0,
        nivel: 1,
        experiencia: 0,
        experienciaProximoNivel: 100,
        categorias: {},
        historico: []
    };
}

function salvarConhecimento(conhecimento) {
    try {
        fs.writeFileSync(ARQUIVO_CONHECIMENTO, JSON.stringify(conhecimento, null, 2));
        return true;
    } catch (erro) {
        return false;
    }
}

function salvarEstatisticas(estatisticas) {
    try {
        fs.writeFileSync(ARQUIVO_ESTATISTICAS, JSON.stringify(estatisticas, null, 2));
        return true;
    } catch (erro) {
        return false;
    }
}

let conhecimento = carregarConhecimento();
let estatisticas = carregarEstatisticas();

// ========== FUNÇÕES DA IA ==========
function calcularNivel(exp) {
    return Math.floor(exp / 100) + 1;
}

function ganharExperiencia(quantidade, motivo) {
    estatisticas.experiencia += quantidade;
    const novoNivel = calcularNivel(estatisticas.experiencia);
    
    if (novoNivel > estatisticas.nivel) {
        estatisticas.nivel = novoNivel;
        estatisticas.experienciaProximoNivel = estatisticas.nivel * 100;
        return true; // Subiu de nível
    }
    return false; // Não subiu
}

function aprenderNovaCategoria(pergunta, resposta) {
    // Extrair palavras-chave
    const palavras = pergunta.toLowerCase().split(' ');
    const palavrasChave = palavras.filter(p => p.length > 3).slice(0, 5);
    
    if (palavrasChave.length === 0) return false;
    
    const categoriaNome = 'aprendizado_' + Date.now();
    conhecimento[categoriaNome] = {
        palavras: palavrasChave,
        respostas: [resposta],
        aprendido: true,
        data: new Date().toLocaleString(),
        perguntaOriginal: pergunta,
        vezesUsado: 0
    };
    
    // Atualizar estatísticas
    estatisticas.totalAprendizados++;
    estatisticas.totalPerguntas++;
    estatisticas.totalAcertos++;
    
    // Ganhar experiência
    const subiuNivel = ganharExperiencia(30, `Aprendeu: ${pergunta.substring(0, 30)}`);
    
    // Registrar no histórico
    estatisticas.historico.unshift({
        tipo: 'aprendizado',
        pergunta: pergunta,
        resposta: resposta,
        data: new Date().toLocaleString(),
        ganhouExp: 30
    });
    
    // Manter apenas últimos 50 registros
    if (estatisticas.historico.length > 50) {
        estatisticas.historico = estatisticas.historico.slice(0, 50);
    }
    
    salvarConhecimento(conhecimento);
    salvarEstatisticas(estatisticas);
    
    return { sucesso: true, subiuNivel: subiuNivel };
}

function responder(mensagem, sessao) {
    const texto = mensagem.toLowerCase().trim();
    estatisticas.totalPerguntas++;
    
    // Verificar aprendizado
    if (texto.startsWith('aprender:')) {
        const pergunta = texto.substring(9).trim();
        if (pergunta) {
            sessao.aprendendo = true;
            sessao.perguntaAprendizado = pergunta;
            return {
                tipo: 'aprendizado',
                mensagem: '📚 *Vamos aprender!*\n\n' +
                         `Pergunta: "${pergunta}"\n\n` +
                         `Agora me diga qual deve ser a RESPOSTA para esta pergunta.`
            };
        }
    }
    
    if (sessao.aprendendo && sessao.perguntaAprendizado) {
        const resposta = mensagem;
        const resultado = aprenderNovaCategoria(sessao.perguntaAprendizado, resposta);
        
        sessao.aprendendo = false;
        const perguntaSalva = sessao.perguntaAprendizado;
        sessao.perguntaAprendizado = null;
        
        let mensagemRetorno = '✅ *Aprendizado concluído!*\n\n' +
            `Agora sei que quando perguntarem "${perguntaSalva}",\n` +
            `devo responder: "${resposta}"\n\n` +
            `📈 +30 EXP!`;
        
        if (resultado.subiuNivel) {
            mensagemRetorno += `\n\n🎉 *PARABÉNS! IA subiu para NÍVEL ${estatisticas.nivel}!* 🎉`;
        }
        
        return { tipo: 'sucesso', mensagem: mensagemRetorno };
    }
    
    // Verificar comandos
    if (texto === 'estatísticas' || texto === 'stats' || texto === 'progresso') {
        const porcentagemExp = (estatisticas.experiencia % 100);
        return {
            tipo: 'stats',
            mensagem: gerarRelatorioEstatisticas()
        };
    }
    
    if (texto === 'resetar ia') {
        conhecimento = carregarConhecimento(); // Recarrega original
        estatisticas = carregarEstatisticas();
        salvarConhecimento(conhecimento);
        salvarEstatisticas(estatisticas);
        return { tipo: 'sucesso', mensagem: '🔄 IA resetada para o estado inicial!' };
    }
    
    // Calcular matemática
    const calcMatch = texto.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
    if (calcMatch) {
        const a = parseInt(calcMatch[1]);
        const b = parseInt(calcMatch[3]);
        const op = calcMatch[2];
        let resultado;
        if (op === '+') resultado = a + b;
        else if (op === '-') resultado = a - b;
        else if (op === '*') resultado = a * b;
        else if (op === '/') resultado = b !== 0 ? (a / b).toFixed(2) : 'erro';
        
        ganharExperiencia(5, `Calculou: ${a} ${op} ${b}`);
        
        return { tipo: 'resposta', mensagem: '🧮 ' + a + ' ' + op + ' ' + b + ' = ' + resultado + '\n\n📈 +5 EXP!' };
    }
    
    // Buscar no conhecimento
    for (let categoria in conhecimento) {
        const cat = conhecimento[categoria];
        for (let i = 0; i < cat.palavras.length; i++) {
            if (texto.includes(cat.palavras[i])) {
                const respostas = cat.respostas;
                const indice = Math.floor(Math.random() * respostas.length);
                
                // Marcar como usado
                if (cat.vezesUsado !== undefined) {
                    cat.vezesUsado++;
                } else {
                    cat.vezesUsado = 1;
                }
                
                ganharExperiencia(2, `Respondeu: ${categoria.substring(0, 20)}`);
                salvarConhecimento(conhecimento);
                salvarEstatisticas(estatisticas);
                
                return { tipo: 'resposta', mensagem: respostas[indice] + '\n\n📈 +2 EXP!' };
            }
        }
    }
    
    // Não sabe responder
    return {
        tipo: 'naoSei',
        mensagem: '🤔 *Ainda não aprendi sobre isso!*\n\n' +
                 `Me ensine usando:\n` +
                 `"aprender: ${mensagem.substring(0, 40)}..."\n\n` +
                 `Cada aprendizado me dá +30 EXP e me deixa mais inteligente! 🧠`
    };
}

function gerarRelatorioEstatisticas() {
    const expAtual = estatisticas.experiencia % 100;
    const expNecessaria = 100;
    const porcentagem = (expAtual / expNecessaria) * 100;
    
    let barraProgresso = '';
    const preenchido = Math.floor(porcentagem / 5);
    for (let i = 0; i < 20; i++) {
        barraProgresso += i < preenchido ? '█' : '░';
    }
    
    // Contar categorias por tipo
    let aprendidas = 0;
    let nativas = 0;
    for (let cat in conhecimento) {
        if (conhecimento[cat].aprendido) {
            aprendidas++;
        } else {
            nativas++;
        }
    }
    
    return `🧠 *ESTATÍSTICAS DA IA* 🧠
━━━━━━━━━━━━━━━━━━━━━━━━━━

🏆 *NÍVEL: ${estatisticas.nivel}*
${barraProgresso} ${expAtual}/${expNecessaria} EXP

📚 *CONHECIMENTO:*
• Conhecimento nativo: ${nativas} categorias
• Aprendizado próprio: ${aprendidas} categorias
• Total: ${estatisticas.totalAprendizados} aprendizados

📊 *ATIVIDADE:*
• Perguntas respondidas: ${estatisticas.totalPerguntas}
• Taxa de acerto: ${estatisticas.totalPerguntas > 0 ? Math.round((estatisticas.totalAcertos / estatisticas.totalPerguntas) * 100) : 0}%

🎯 *PRÓXIMO NÍVEL:*
Falta ${expNecessaria - expAtual} EXP para subir de nível

✨ *DICA:* Me ensine coisas novas para ganhar experiência e subir de nível!`;
}

// ========== PÁGINA PRINCIPAL ==========
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>ProgressIA - IA que Evolui</title>
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
            
            .dashboard {
                display: grid;
                grid-template-columns: 300px 1fr;
                gap: 20px;
                max-width: 1300px;
                margin: 0 auto;
                height: calc(100vh - 40px);
            }
            
            /* Sidebar de estatísticas */
            .stats-panel {
                background: rgba(255,255,255,0.95);
                border-radius: 20px;
                padding: 20px;
                overflow-y: auto;
                backdrop-filter: blur(10px);
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            
            .stats-panel h2 {
                color: #764ba2;
                font-size: 1.2em;
                margin-bottom: 15px;
                border-bottom: 2px solid #764ba2;
                padding-bottom: 8px;
            }
            
            .level-box {
                text-align: center;
                margin-bottom: 20px;
            }
            
            .level-number {
                font-size: 2.5em;
                font-weight: bold;
                color: #764ba2;
            }
            
            .progress-bar-container {
                background: #e0e0e0;
                border-radius: 10px;
                height: 20px;
                margin: 10px 0;
                overflow: hidden;
            }
            
            .progress-fill {
                background: linear-gradient(90deg, #667eea, #764ba2);
                height: 100%;
                transition: width 0.5s;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 10px;
            }
            
            .stat-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            
            .stat-label {
                color: #666;
            }
            
            .stat-value {
                font-weight: bold;
                color: #764ba2;
            }
            
            .badge {
                display: inline-block;
                background: #4CAF50;
                color: white;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 10px;
                margin-left: 5px;
            }
            
            /* Chat principal */
            .chat-panel {
                background: rgba(255,255,255,0.95);
                border-radius: 20px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                backdrop-filter: blur(10px);
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            
            .chat-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                text-align: center;
            }
            
            .chat-header h1 {
                font-size: 1.5em;
            }
            
            .chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                background: #f8f9fa;
            }
            
            .message {
                margin-bottom: 15px;
                display: flex;
                align-items: flex-start;
                gap: 10px;
                animation: fadeIn 0.3s;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .message.user {
                flex-direction: row-reverse;
            }
            
            .message-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
            }
            
            .message.user .message-avatar {
                background: #764ba2;
            }
            
            .message.bot .message-avatar {
                background: #667eea;
            }
            
            .message-content {
                max-width: 70%;
                padding: 12px 16px;
                border-radius: 18px;
                word-wrap: break-word;
                white-space: pre-wrap;
            }
            
            .message.user .message-content {
                background: #764ba2;
                color: white;
                border-bottom-right-radius: 4px;
            }
            
            .message.bot .message-content {
                background: white;
                color: #333;
                border-bottom-left-radius: 4px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            
            .message-time {
                font-size: 10px;
                opacity: 0.6;
                margin-top: 5px;
            }
            
            .chat-input-area {
                padding: 20px;
                background: white;
                border-top: 1px solid #eee;
                display: flex;
                gap: 10px;
            }
            
            .chat-input {
                flex: 1;
                padding: 12px;
                border: 2px solid #ddd;
                border-radius: 25px;
                outline: none;
                font-size: 14px;
            }
            
            .chat-input:focus {
                border-color: #764ba2;
            }
            
            .chat-send {
                background: #764ba2;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 25px;
                cursor: pointer;
                font-weight: bold;
            }
            
            .chat-send:hover {
                transform: scale(1.02);
            }
            
            .sugestoes {
                display: flex;
                gap: 8px;
                padding: 10px 20px;
                background: #f8f9fa;
                flex-wrap: wrap;
                border-top: 1px solid #eee;
            }
            
            .sugestao {
                background: #e0e0e0;
                padding: 5px 12px;
                border-radius: 15px;
                font-size: 11px;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .sugestao:hover {
                background: #764ba2;
                color: white;
            }
            
            .typing {
                display: inline-block;
                width: 40px;
                text-align: center;
            }
            
            .typing span {
                animation: typing 1.4s infinite;
                display: inline-block;
            }
            
            .typing span:nth-child(2) { animation-delay: 0.2s; }
            .typing span:nth-child(3) { animation-delay: 0.4s; }
            
            @keyframes typing {
                0%, 60%, 100% { transform: translateY(0); }
                30% { transform: translateY(-10px); }
            }
            
            @media (max-width: 900px) {
                .dashboard {
                    grid-template-columns: 1fr;
                }
                .stats-panel {
                    max-height: 300px;
                }
            }
        </style>
    </head>
    <body>
        <div class="dashboard">
            <div class="stats-panel" id="statsPanel">
                <div class="level-box">
                    <div class="level-number" id="nivel">1</div>
                    <div class="progress-bar-container">
                        <div class="progress-fill" id="expBarra" style="width: 0%">0%</div>
                    </div>
                </div>
                <h2>📊 Estatísticas</h2>
                <div id="statsContent">Carregando...</div>
            </div>
            
            <div class="chat-panel">
                <div class="chat-header">
                    <h1>🧠 ProgressIA</h1>
                    <p>Uma IA que evolui com você!</p>
                </div>
                
                <div class="chat-messages" id="chatMessages">
                    <div class="message bot">
                        <div class="message-avatar">🧠</div>
                        <div class="message-content">
                            Olá! Sou a ProgressIA, uma inteligência artificial que EVOLUI! 🎓<br><br>
                            <strong>Comandos:</strong><br>
                            • <code>aprender: [pergunta]</code> - Me ensina algo novo<br>
                            • <code>estatísticas</code> - Ver meu progresso<br>
                            • <code>resetar ia</code> - Resetar aprendizado<br><br>
                            Quanto mais você me ensina, mais experiente eu fico! 🚀
                            <div class="message-time">${new Date().toLocaleTimeString()}</div>
                        </div>
                    </div>
                </div>
                
                <div class="sugestoes">
                    <span class="sugestao" onclick="enviarSugestao('Olá')">👋 Olá</span>
                    <span class="sugestao" onclick="enviarSugestao('Qual seu nome?')">📛 Nome</span>
                    <span class="sugestao" onclick="enviarSugestao('aprender: O que é JavaScript?')">📚 Ensinar</span>
                    <span class="sugestao" onclick="enviarSugestao('estatísticas')">📊 Progresso</span>
                    <span class="sugestao" onclick="enviarSugestao('5+3')">🧮 5+3</span>
                </div>
                
                <div class="chat-input-area">
                    <input type="text" class="chat-input" id="messageInput" placeholder="Digite sua mensagem..." onkeypress="handleKeyPress(event)">
                    <button class="chat-send" onclick="enviarMensagem()">📤 Enviar</button>
                </div>
            </div>
        </div>
        
        <script>
            const chatMessages = document.getElementById('chatMessages');
            const messageInput = document.getElementById('messageInput');
            
            function atualizarEstatisticas() {
                fetch('/estatisticas')
                    .then(res => res.json())
                    .then(data => {
                        document.getElementById('nivel').textContent = data.nivel;
                        const expPercent = (data.expAtual / 100) * 100;
                        document.getElementById('expBarra').style.width = expPercent + '%';
                        document.getElementById('expBarra').textContent = Math.round(expPercent) + '%';
                        
                        document.getElementById('statsContent').innerHTML = \`
                            <div class="stat-item">
                                <span class="stat-label">🏆 Nível</span>
                                <span class="stat-value">\${data.nivel}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">✨ Experiência</span>
                                <span class="stat-value">\${data.expAtual}/100</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">📚 Aprendizados</span>
                                <span class="stat-value">\${data.totalAprendizados}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">💬 Perguntas</span>
                                <span class="stat-value">\${data.totalPerguntas}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">🎯 Taxa de acerto</span>
                                <span class="stat-value">\${data.taxaAcerto}%</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">🧠 Conhecimento</span>
                                <span class="stat-value">\${data.totalConhecimento} categorias</span>
                            </div>
                        \`;
                    });
            }
            
            function adicionarMensagem(texto, tipo) {
                const messageDiv = document.createElement('div');
                messageDiv.className = 'message ' + tipo;
                
                const avatar = document.createElement('div');
                avatar.className = 'message-avatar';
                avatar.textContent = tipo === 'user' ? '👤' : '🧠';
                
                const content = document.createElement('div');
                content.className = 'message-content';
                content.innerHTML = texto.replace(/\\n/g, '<br>');
                
                const time = document.createElement('div');
                time.className = 'message-time';
                time.textContent = new Date().toLocaleTimeString();
                content.appendChild(time);
                
                messageDiv.appendChild(avatar);
                messageDiv.appendChild(content);
                
                chatMessages.appendChild(messageDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            
            function mostrarDigitando() {
                const typingDiv = document.createElement('div');
                typingDiv.className = 'message bot';
                typingDiv.id = 'typingIndicator';
                typingDiv.innerHTML = \`
                    <div class="message-avatar">🧠</div>
                    <div class="message-content">
                        <div class="typing"><span>●</span><span>●</span><span>●</span></div>
                    </div>
                \`;
                chatMessages.appendChild(typingDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            
            function removerDigitando() {
                const typing = document.getElementById('typingIndicator');
                if (typing) typing.remove();
            }
            
            function enviarMensagem() {
                const texto = messageInput.value.trim();
                if (!texto) return;
                
                adicionarMensagem(texto, 'user');
                messageInput.value = '';
                
                mostrarDigitando();
                
                fetch('/perguntar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mensagem: texto })
                })
                .then(res => res.json())
                .then(data => {
                    removerDigitando();
                    adicionarMensagem(data.resposta, 'bot');
                    if (data.atualizarStats) {
                        atualizarEstatisticas();
                    }
                })
                .catch(erro => {
                    removerDigitando();
                    adicionarMensagem('Ops! Erro de conexão. Tente novamente.', 'bot');
                });
            }
            
            function enviarSugestao(texto) {
                messageInput.value = texto;
                enviarMensagem();
            }
            
            function handleKeyPress(event) {
                if (event.key === 'Enter') {
                    enviarMensagem();
                }
            }
            
            // Atualizar estatísticas a cada 5 segundos
            atualizarEstatisticas();
            setInterval(atualizarEstatisticas, 5000);
        </script>
    </body>
    </html>
    `);
});

// API endpoints
let sessoes = {};

app.post('/perguntar', (req, res) => {
    const { mensagem } = req.body;
    const sessionId = req.ip;
    
    if (!sessoes[sessionId]) {
        sessoes[sessionId] = { aprendendo: false, perguntaAprendizado: null };
    }
    
    const resultado = responder(mensagem, sessoes[sessionId]);
    
    res.json({
        resposta: resultado.mensagem,
        atualizarStats: true
    });
});

app.get('/estatisticas', (req, res) => {
    const expAtual = estatisticas.experiencia % 100;
    let totalConhecimento = 0;
    for (let cat in conhecimento) {
        totalConhecimento++;
    }
    
    res.json({
        nivel: estatisticas.nivel,
        expAtual: expAtual,
        totalAprendizados: estatisticas.totalAprendizados,
        totalPerguntas: estatisticas.totalPerguntas,
        taxaAcerto: estatisticas.totalPerguntas > 0 ? Math.round((estatisticas.totalAcertos / estatisticas.totalPerguntas) * 100) : 0,
        totalConhecimento: totalConhecimento
    });
});

// Iniciar servidor
const PORTA = 3015;
app.listen(PORTA, () => {
    console.log('========================================');
    console.log('🧠 PROGRESSIA - IA QUE EVOLUI');
    console.log(`👉 http://localhost:${PORTA}`);
    console.log('========================================');
    console.log('');
    console.log('🎯 FUNCIONALIDADES:');
    console.log('  ✓ Sistema de NÍVEIS e EXPERIÊNCIA');
    console.log('  ✓ Aprende com você (aprender:)');
    console.log('  ✓ Barra de progresso visual');
    console.log('  ✓ Estatísticas em tempo real');
    console.log('  ✓ Ganha EXP ao interagir');
    console.log('  ✓ Sobe de nível automaticamente');
    console.log('========================================');
    console.log('');
    console.log('💡 COMANDOS:');
    console.log('  "aprender: [pergunta]" - Ensinar algo');
    console.log('  "estatísticas" - Ver progresso');
    console.log('  "resetar ia" - Resetar aprendizado');
    console.log('========================================');
});