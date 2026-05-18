const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Arquivo para salvar o conhecimento
const ARQUIVO_CONHECIMENTO = path.join(__dirname, '..', 'dados', 'ia-conhecimento.json');

// ========== CARREGAR CONHECIMENTO SALVO ==========
function carregarConhecimento() {
    try {
        if (fs.existsSync(ARQUIVO_CONHECIMENTO)) {
            const dados = fs.readFileSync(ARQUIVO_CONHECIMENTO, 'utf8');
            const salvo = JSON.parse(dados);
            console.log('📚 Conhecimento carregado!');
            return salvo;
        }
    } catch (erro) {
        console.error('Erro ao carregar conhecimento:', erro);
    }
    
    // Conhecimento inicial (padrão)
    return {
        saudacoes: {
            palavras: ['oi', 'olá', 'opa', 'eae', 'bom dia', 'boa tarde', 'boa noite', 'hello', 'hi'],
            respostas: [
                'Olá! Como posso ajudar você hoje? 😊',
                'Oi! Tudo bem? O que você precisa?',
                'Olá! Sou sua IA assistente. Pergunte algo!'
            ]
        },
        despedidas: {
            palavras: ['tchau', 'adeus', 'até logo', 'até mais', 'flw', 'bye'],
            respostas: [
                'Até logo! Foi um prazer conversar! 👋',
                'Tchau! Volte sempre que precisar!'
            ]
        },
        nome: {
            palavras: ['qual seu nome', 'quem é você', 'como se chama', 'seu nome'],
            respostas: [
                'Sou uma IA que aprende! Meu nome é LearnIA 🤖',
                'Sou a LearnIA - uma inteligência artificial que aprende com você!'
            ]
        },
        nodejs: {
            palavras: ['node', 'node.js', 'nodejs', 'javascript'],
            respostas: [
                'Node.js é incrível! Estou sendo executado nele agora! 🚀',
                'JavaScript no servidor! Poderoso demais!'
            ]
        }
    };
}

// ========== SALVAR CONHECIMENTO ==========
function salvarConhecimento(conhecimento) {
    try {
        fs.writeFileSync(ARQUIVO_CONHECIMENTO, JSON.stringify(conhecimento, null, 2));
        console.log('💾 Conhecimento salvo!');
        return true;
    } catch (erro) {
        console.error('Erro ao salvar conhecimento:', erro);
        return false;
    }
}

// Carregar conhecimento ao iniciar
let conhecimento = carregarConhecimento();

// ========== FUNÇÃO PARA ENSINAR A IA ==========
function ensinarIA(mensagem, respostaUsuario) {
    // Extrair palavras-chave da mensagem
    const palavras = mensagem.toLowerCase().split(' ');
    const palavrasImportantes = palavras.filter(p => p.length > 3);
    
    if (palavrasImportantes.length === 0) return false;
    
    // Criar ou atualizar categoria
    const categoriaNome = 'aprendizado_' + Date.now();
    const palavrasChave = palavrasImportantes.slice(0, 5);
    
    conhecimento[categoriaNome] = {
        palavras: palavrasChave,
        respostas: [respostaUsuario],
        aprendido: true,
        data: new Date().toLocaleString()
    };
    
    salvarConhecimento(conhecimento);
    return true;
}

// ========== FUNÇÃO PRINCIPAL DA IA ==========
function responder(mensagem, sessao) {
    var texto = mensagem.toLowerCase().trim();
    
    // Comando para ensinar a IA
    if (texto.startsWith('aprender:')) {
        const novoConhecimento = texto.substring(9).trim();
        return '📚 *Modo de aprendizado ativado!*\n\n' +
               'Me ensine algo novo! Responda com o que devo dizer quando alguém perguntar algo similar.\n\n' +
               'Exemplo: Se você perguntar "O que é amor?", me diga a resposta que devo dar.\n\n' +
               'Digite a resposta agora:';
    }
    
    // Verificar se está em modo de aprendizado
    if (sessao.aprendendo) {
        const pergunta = sessao.perguntaAprendizado;
        const resposta = mensagem;
        
        // Extrair palavras-chave da pergunta
        const palavrasChave = pergunta.toLowerCase().split(' ').filter(p => p.length > 3);
        
        if (palavrasChave.length > 0) {
            const categoriaNome = 'aprendizado_' + Date.now();
            conhecimento[categoriaNome] = {
                palavras: palavrasChave,
                respostas: [resposta],
                aprendido: true,
                data: new Date().toLocaleString(),
                perguntaOriginal: pergunta
            };
            salvarConhecimento(conhecimento);
            sessao.aprendendo = false;
            return '✅ *Aprendizado concluído!*\n\n' +
                   `Agora quando alguém perguntar sobre "${pergunta}", ` +
                   `eu responderei: "${resposta}"\n\nObrigado por me ensinar! 🎓`;
        }
    }
    
    // Comando para ver o que aprendeu
    if (texto === 'o que você aprendeu' || texto === 'conhecimento') {
        let aprendidos = [];
        for (var cat in conhecimento) {
            if (conhecimento[cat].aprendido) {
                aprendidos.push({
                    nome: cat,
                    palavras: conhecimento[cat].palavras.join(', '),
                    resposta: conhecimento[cat].respostas[0],
                    data: conhecimento[cat].data
                });
            }
        }
        
        if (aprendidos.length === 0) {
            return 'Ainda não aprendi nada novo. Me ensine algo com o comando "aprender: [assunto]"!';
        }
        
        let resposta = '📚 *O que eu aprendi até agora:*\n\n';
        for (var i = 0; i < Math.min(aprendidos.length, 5); i++) {
            resposta += `🔹 *Pergunta:* ${aprendidos[i].palavras}\n`;
            resposta += `   *Resposta:* ${aprendidos[i].resposta}\n`;
            resposta += `   📅 ${aprendidos[i].data}\n\n`;
        }
        return resposta;
    }
    
    // Comando para limpar aprendizado
    if (texto === 'limpar aprendizado') {
        for (var cat in conhecimento) {
            if (conhecimento[cat].aprendido) {
                delete conhecimento[cat];
            }
        }
        salvarConhecimento(conhecimento);
        return '🧹 *Aprendizado limpo!* Agora só sei o conhecimento inicial.';
    }
    
    // Verificar cálculo matemático
    var calcMatch = texto.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
    if (calcMatch) {
        var a = parseInt(calcMatch[1]);
        var b = parseInt(calcMatch[3]);
        var op = calcMatch[2];
        var resultado;
        if (op === '+') resultado = a + b;
        else if (op === '-') resultado = a - b;
        else if (op === '*') resultado = a * b;
        else if (op === '/') resultado = b !== 0 ? a / b : 'erro';
        return '🧮 Calculando: ' + a + ' ' + op + ' ' + b + ' = ' + resultado;
    }
    
    // Buscar no conhecimento (incluindo o aprendido)
    for (var categoria in conhecimento) {
        var cat = conhecimento[categoria];
        for (var i = 0; i < cat.palavras.length; i++) {
            if (texto.includes(cat.palavras[i])) {
                var respostas = cat.respostas;
                var indiceAleatorio = Math.floor(Math.random() * respostas.length);
                return respostas[indiceAleatorio];
            }
        }
    }
    
    // Se não sabe responder, oferece para ensinar
    return '🤔 *Não sei responder a isso ainda!*\n\n' +
           `Você pode me ensinar usando o comando:\n` +
           `"aprender: ${mensagem.substring(0, 30)}..."\n\n` +
           `Exemplo: "aprender: O que é JavaScript" e depois me diga a resposta!`;
}

// ========== ARMAZENAR SESSÕES DOS USUÁRIOS ==========
let sessoes = {};

// ========== PÁGINA PRINCIPAL ==========
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>IA que Aprende - Chatbot Inteligente</title>
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
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            }
            
            .chat-container {
                background: white;
                border-radius: 20px;
                width: 100%;
                max-width: 800px;
                height: 90vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            
            .chat-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                text-align: center;
            }
            
            .chat-header h1 {
                font-size: 1.5em;
                margin-bottom: 5px;
            }
            
            .chat-header p {
                font-size: 0.8em;
                opacity: 0.9;
            }
            
            .chat-status {
                background: #4CAF50;
                display: inline-block;
                padding: 3px 10px;
                border-radius: 20px;
                font-size: 11px;
                margin-top: 10px;
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
                transition: border-color 0.3s;
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
                transition: transform 0.2s;
            }
            
            .chat-send:hover {
                transform: scale(1.02);
            }
            
            .comandos-sugestoes {
                display: flex;
                gap: 10px;
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
            
            .dica {
                background: #e8f5e9;
                padding: 8px;
                margin: 5px;
                border-radius: 8px;
                font-size: 11px;
                color: #2e7d32;
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
            
            @media (max-width: 600px) {
                .message-content {
                    max-width: 85%;
                    font-size: 13px;
                }
                .chat-header h1 {
                    font-size: 1.2em;
                }
            }
        </style>
    </head>
    <body>
        <div class="chat-container">
            <div class="chat-header">
                <h1>🧠 IA que Aprende</h1>
                <p>Uma inteligência artificial que aprende com você!</p>
                <div class="chat-status">🟢 Online | 🧠 Modo Aprendizagem</div>
            </div>
            
            <div class="chat-messages" id="chatMessages">
                <div class="message bot">
                    <div class="message-avatar">🧠</div>
                    <div class="message-content">
                        Olá! Sou a LearnIA, uma inteligência artificial que APRENDE com você! 🎓<br><br>
                        <strong>Comandos especiais:</strong><br>
                        • <code>aprender: [assunto]</code> - Me ensina algo novo<br>
                        • <code>o que você aprendeu</code> - Ver o que já sei<br>
                        • <code>limpar aprendizado</code> - Resetar meus conhecimentos<br><br>
                        Pergunte qualquer coisa! Se eu não souber, você pode me ensinar! 🤖
                        <div class="message-time">${new Date().toLocaleTimeString()}</div>
                    </div>
                </div>
            </div>
            
            <div class="comandos-sugestoes">
                <span class="sugestao" onclick="enviarSugestao('Olá')">👋 Olá</span>
                <span class="sugestao" onclick="enviarSugestao('Qual seu nome?')">📛 Qual seu nome?</span>
                <span class="sugestao" onclick="enviarSugestao('O que é Node.js?')">💻 O que é Node.js?</span>
                <span class="sugestao" onclick="enviarSugestao('aprender: O que é amor?')">📚 Ensinar algo</span>
                <span class="sugestao" onclick="enviarSugestao('o que você aprendeu')">📖 Ver aprendizado</span>
                <span class="sugestao" onclick="enviarSugestao('2+2')">🧮 2+2</span>
            </div>
            
            <div class="chat-input-area">
                <input type="text" class="chat-input" id="messageInput" placeholder="Digite sua mensagem..." onkeypress="handleKeyPress(event)">
                <button class="chat-send" onclick="enviarMensagem()">📤 Enviar</button>
            </div>
        </div>
        
        <script>
            const chatMessages = document.getElementById('chatMessages');
            const messageInput = document.getElementById('messageInput');
            
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
        </script>
    </body>
    </html>
    `);
});

// API para processar perguntas (com sessão)
let sessoesAPI = {};

app.post('/perguntar', (req, res) => {
    const { mensagem } = req.body;
    const sessionId = req.ip; // Usar IP como identificador
    
    if (!sessoesAPI[sessionId]) {
        sessoesAPI[sessionId] = { aprendendo: false, perguntaAprendizado: null };
    }
    
    const sessao = sessoesAPI[sessionId];
    
    // Verificar se é comando de aprendizado
    if (mensagem.toLowerCase().startsWith('aprender:')) {
        const pergunta = mensagem.substring(9).trim();
        if (pergunta) {
            sessao.aprendendo = true;
            sessao.perguntaAprendizado = pergunta;
            return res.json({ 
                resposta: '📚 *Me ensine sobre isso!*\n\n' +
                         `Pergunta registrada: "${pergunta}"\n\n` +
                         `Agora me diga qual deve ser a resposta para esta pergunta.`
            });
        }
    }
    
    const resposta = responder(mensagem, sessao);
    res.json({ resposta: resposta });
});

// Iniciar servidor
const PORTA = 3014;
app.listen(PORTA, () => {
    console.log('========================================');
    console.log('🧠 IA QUE APRENDE - CHATBOT INTELIGENTE');
    console.log(`👉 http://localhost:${PORTA}`);
    console.log('========================================');
    console.log('');
    console.log('🎯 O QUE A IA FAZ:');
    console.log('  ✓ Responde perguntas normais');
    console.log('  ✓ Aprende com você usando "aprender:"');
    console.log('  ✓ Salva conhecimento em JSON');
    console.log('  ✓ Mostra o que aprendeu');
    console.log('  ✓ Calcula operações matemáticas');
    console.log('========================================');
    console.log('');
    console.log('📂 ARQUIVO DE CONHECIMENTO:');
    console.log(`   ${ARQUIVO_CONHECIMENTO}`);
    console.log('========================================');
    console.log('');
    console.log('💡 COMANDOS ESPECIAIS:');
    console.log('   "aprender: [pergunta]" - Ensinar algo novo');
    console.log('   "o que você aprendeu" - Ver aprendizado');
    console.log('   "limpar aprendizado" - Resetar');
    console.log('========================================');
});