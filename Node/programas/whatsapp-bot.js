const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dados simulados
let conversas = [
    {
        id: 1,
        nome: "João Silva",
        numero: "5511999999999",
        avatar: "👨",
        status: "online",
        ultimaVisto: "agora",
        mensagens: [
            { id: 1, texto: "Olá! Como você está?", data: "10:30", enviada: false, lida: true },
            { id: 2, texto: "Estou bem, e você?", data: "10:32", enviada: true, lida: true },
            { id: 3, texto: "Tudo certo por aqui! Vamos nos falando.", data: "10:33", enviada: false, lida: false }
        ]
    },
    {
        id: 2,
        nome: "Maria Santos",
        numero: "5511988888888",
        avatar: "👩",
        status: "digitando...",
        ultimaVisto: "visto por último às 09:45",
        mensagens: [
            { id: 1, texto: "Bom dia!", data: "09:00", enviada: false, lida: true },
            { id: 2, texto: "Bom dia! Tudo bem?", data: "09:05", enviada: true, lida: true },
            { id: 3, texto: "Sim, e você?", data: "09:06", enviada: false, lida: true }
        ]
    },
    {
        id: 3,
        nome: "Pedro Oliveira",
        numero: "5511977777777",
        avatar: "👨‍💻",
        status: "online",
        ultimaVisto: "agora",
        mensagens: [
            { id: 1, texto: "Vamos trabalhar no projeto?", data: "Ontem", enviada: false, lida: true },
            { id: 2, texto: "Podemos sim! Que horas?", data: "Ontem", enviada: true, lida: true },
            { id: 3, texto: "14h está bom?", data: "Ontem", enviada: false, lida: true }
        ]
    }
];

let conversaAtual = 1;

// Função para adicionar mensagem
function adicionarMensagem(conversaId, texto, enviada) {
    const conversa = conversas.find(c => c.id == conversaId);
    if (conversa) {
        const novaMensagem = {
            id: Date.now(),
            texto: texto,
            data: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            enviada: enviada,
            lida: enviada
        };
        conversa.mensagens.push(novaMensagem);
        
        // Simular resposta automática (se for mensagem enviada)
        if (enviada && conversaId === conversaAtual) {
            setTimeout(() => {
                const respostas = [
                    "Legal! 👍",
                    "Entendi! 😊",
                    "Obrigado pela mensagem!",
                    "Vou verificar isso",
                    "Ok! Combinado!"
                ];
                const resposta = respostas[Math.floor(Math.random() * respostas.length)];
                adicionarMensagem(conversaId, resposta, false);
            }, 2000);
        }
        return true;
    }
    return false;
}

// Página principal
app.get('/', (req, res) => {
    const conversaSelecionada = conversas.find(c => c.id == conversaAtual);
    
    // Gerar lista de conversas
    let conversasHTML = '';
    conversas.forEach(conv => {
        const ultimaMsg = conv.mensagens[conv.mensagens.length - 1];
        const horario = ultimaMsg ? ultimaMsg.data : '';
        const textoPreview = ultimaMsg ? (ultimaMsg.texto.length > 30 ? ultimaMsg.texto.substring(0, 30) + '...' : ultimaMsg.texto) : '';
        const ativa = conv.id === conversaAtual ? 'ativa' : '';
        const statusIcon = conv.status === 'online' ? '🟢' : (conv.status === 'digitando...' ? '✏️' : '');
        
        conversasHTML += `
            <div class="conversa-item ${ativa}" onclick="selecionarConversa(${conv.id})">
                <div class="avatar">${conv.avatar}</div>
                <div class="conversa-info">
                    <div class="conversa-nome">${conv.nome} ${statusIcon}</div>
                    <div class="conversa-preview">${textoPreview || 'Nenhuma mensagem'}</div>
                </div>
                <div class="conversa-horario">${horario}</div>
            </div>
        `;
    });
    
    // Gerar mensagens da conversa atual
    let mensagensHTML = '';
    if (conversaSelecionada) {
        conversaSelecionada.mensagens.forEach(msg => {
            const classe = msg.enviada ? 'enviada' : 'recebida';
            const checkIcon = msg.enviada && msg.lida ? '✓✓' : (msg.enviada ? '✓' : '');
            
            mensagensHTML += `
                <div class="mensagem ${classe}">
                    <div class="mensagem-texto">${msg.texto}</div>
                    <div class="mensagem-info">
                        <span class="mensagem-hora">${msg.data}</span>
                        ${checkIcon ? `<span class="mensagem-check">${checkIcon}</span>` : ''}
                    </div>
                </div>
            `;
        });
    }
    
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>WhatsApp Clone</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background: #121212;
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            
            /* Container principal estilo WhatsApp */
            .whatsapp-container {
                width: 100%;
                max-width: 1400px;
                height: 100vh;
                background: #0a0a0a;
                display: flex;
                overflow: hidden;
                box-shadow: 0 0 20px rgba(0,0,0,0.5);
            }
            
            /* Sidebar - Lista de conversas */
            .sidebar {
                width: 380px;
                background: #111b21;
                border-right: 1px solid #2a2f32;
                display: flex;
                flex-direction: column;
                overflow-y: auto;
            }
            
            /* Header da sidebar */
            .sidebar-header {
                background: #202c33;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                position: sticky;
                top: 0;
                z-index: 10;
            }
            
            .sidebar-header h2 {
                color: #e9edef;
                font-size: 1.2em;
                font-weight: 500;
            }
            
            .sidebar-header-icons {
                display: flex;
                gap: 20px;
            }
            
            .sidebar-header-icons span {
                font-size: 1.2em;
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            
            .sidebar-header-icons span:hover {
                opacity: 1;
            }
            
            /* Busca */
            .search-bar {
                background: #202c33;
                padding: 8px 15px;
            }
            
            .search-box {
                background: #2a3942;
                border-radius: 8px;
                padding: 8px 15px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .search-box span {
                color: #8696a0;
                font-size: 1.1em;
            }
            
            .search-box input {
                background: none;
                border: none;
                color: #e9edef;
                font-size: 0.9em;
                width: 100%;
                outline: none;
            }
            
            .search-box input::placeholder {
                color: #8696a0;
            }
            
            /* Lista de conversas */
            .conversas-list {
                flex: 1;
                overflow-y: auto;
            }
            
            .conversa-item {
                display: flex;
                align-items: center;
                padding: 12px 15px;
                cursor: pointer;
                transition: background 0.2s;
                border-bottom: 1px solid #2a2f32;
                gap: 12px;
            }
            
            .conversa-item:hover {
                background: #2a3942;
            }
            
            .conversa-item.ativa {
                background: #2a3942;
            }
            
            .avatar {
                width: 50px;
                height: 50px;
                background: #2a3942;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.8em;
            }
            
            .conversa-info {
                flex: 1;
                min-width: 0;
            }
            
            .conversa-nome {
                color: #e9edef;
                font-weight: 500;
                font-size: 1em;
                margin-bottom: 4px;
            }
            
            .conversa-preview {
                color: #8696a0;
                font-size: 0.85em;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .conversa-horario {
                color: #8696a0;
                font-size: 0.7em;
                align-self: flex-start;
            }
            
            /* Chat Principal */
            .chat-area {
                flex: 1;
                display: flex;
                flex-direction: column;
                background: #0a0a0a;
            }
            
            /* Chat Header */
            .chat-header {
                background: #202c33;
                padding: 10px 20px;
                display: flex;
                align-items: center;
                gap: 15px;
                border-bottom: 1px solid #2a2f32;
            }
            
            .chat-avatar {
                width: 40px;
                height: 40px;
                background: #2a3942;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.4em;
            }
            
            .chat-info {
                flex: 1;
            }
            
            .chat-nome {
                color: #e9edef;
                font-weight: 500;
                font-size: 1em;
            }
            
            .chat-status {
                color: #8696a0;
                font-size: 0.75em;
            }
            
            .chat-icons {
                display: flex;
                gap: 20px;
            }
            
            .chat-icons span {
                font-size: 1.2em;
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            
            .chat-icons span:hover {
                opacity: 1;
            }
            
            /* Mensagens */
            .messages-area {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 8px;
                background: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
                background-size: cover;
                background-position: center;
            }
            
            .mensagem {
                max-width: 65%;
                padding: 8px 12px;
                border-radius: 8px;
                position: relative;
                word-wrap: break-word;
            }
            
            .mensagem.recebida {
                background: #202c33;
                color: #e9edef;
                align-self: flex-start;
                border-top-left-radius: 0;
            }
            
            .mensagem.enviada {
                background: #005c4b;
                color: #e9edef;
                align-self: flex-end;
                border-top-right-radius: 0;
            }
            
            .mensagem-texto {
                font-size: 0.9em;
                line-height: 1.4;
            }
            
            .mensagem-info {
                display: flex;
                justify-content: flex-end;
                gap: 5px;
                margin-top: 5px;
                font-size: 0.65em;
                opacity: 0.7;
            }
            
            .mensagem-hora {
                color: #aebac1;
            }
            
            .mensagem-check {
                color: #53bdeb;
            }
            
            /* Input Area */
            .input-area {
                background: #202c33;
                padding: 12px 20px;
                display: flex;
                gap: 15px;
                align-items: center;
            }
            
            .input-icons {
                display: flex;
                gap: 15px;
            }
            
            .input-icons span {
                font-size: 1.3em;
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.2s;
            }
            
            .input-icons span:hover {
                opacity: 1;
            }
            
            .input-area input {
                flex: 1;
                background: #2a3942;
                border: none;
                padding: 12px 15px;
                border-radius: 8px;
                color: #e9edef;
                font-size: 0.9em;
                outline: none;
            }
            
            .input-area input::placeholder {
                color: #8696a0;
            }
            
            .send-btn {
                background: #005c4b;
                border: none;
                border-radius: 50%;
                width: 42px;
                height: 42px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            .send-btn:hover {
                background: #006b58;
            }
            
            .send-btn span {
                font-size: 1.2em;
                color: #e9edef;
            }
            
            /* Scrollbar */
            ::-webkit-scrollbar {
                width: 6px;
            }
            
            ::-webkit-scrollbar-track {
                background: #2a2f32;
            }
            
            ::-webkit-scrollbar-thumb {
                background: #4a5b6b;
                border-radius: 3px;
            }
            
            /* Responsivo */
            @media (max-width: 768px) {
                .sidebar {
                    width: 100%;
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    z-index: 20;
                    transform: translateX(-100%);
                    transition: transform 0.3s;
                }
                
                .sidebar.mobile-open {
                    transform: translateX(0);
                }
                
                .chat-area {
                    width: 100%;
                }
                
                .mobile-back {
                    display: inline-block;
                }
            }
            
            @media (min-width: 769px) {
                .mobile-back {
                    display: none;
                }
            }
        </style>
    </head>
    <body>
        <div class="whatsapp-container">
            <!-- Sidebar -->
            <div class="sidebar" id="sidebar">
                <div class="sidebar-header">
                    <h2>WhatsApp</h2>
                    <div class="sidebar-header-icons">
                        <span>🔄</span>
                        <span>💬</span>
                        <span>⋮</span>
                    </div>
                </div>
                <div class="search-bar">
                    <div class="search-box">
                        <span>🔍</span>
                        <input type="text" placeholder="Pesquisar no WhatsApp">
                    </div>
                </div>
                <div class="conversas-list">
                    ${conversasHTML}
                </div>
            </div>
            
            <!-- Chat Area -->
            <div class="chat-area">
                <div class="chat-header">
                    <span class="mobile-back" id="mobileBack" style="cursor: pointer; font-size: 1.5em; color: #e9edef;">←</span>
                    <div class="chat-avatar">${conversaSelecionada ? conversaSelecionada.avatar : '💬'}</div>
                    <div class="chat-info">
                        <div class="chat-nome">${conversaSelecionada ? conversaSelecionada.nome : 'Selecione uma conversa'}</div>
                        <div class="chat-status">${conversaSelecionada ? (conversaSelecionada.status === 'online' ? '🟢 online' : conversaSelecionada.status) : ''}</div>
                    </div>
                    <div class="chat-icons">
                        <span>📞</span>
                        <span>📹</span>
                        <span>⋮</span>
                    </div>
                </div>
                
                <div class="messages-area" id="messagesArea">
                    ${mensagensHTML}
                </div>
                
                <div class="input-area">
                    <div class="input-icons">
                        <span>😊</span>
                        <span>📎</span>
                        <span>🎤</span>
                    </div>
                    <input type="text" id="messageInput" placeholder="Digite uma mensagem" onkeypress="handleKeyPress(event)">
                    <button class="send-btn" onclick="enviarMensagem()">
                        <span>📤</span>
                    </button>
                </div>
            </div>
        </div>
        
        <script>
            let conversaAtual = ${conversaAtual};
            
            function selecionarConversa(id) {
                fetch('/selecionar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ conversaId: id })
                }).then(() => {
                    window.location.reload();
                });
            }
            
            function enviarMensagem() {
                const input = document.getElementById('messageInput');
                const texto = input.value.trim();
                
                if (!texto) return;
                
                fetch('/enviar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ conversaId: conversaAtual, texto: texto })
                }).then(() => {
                    input.value = '';
                    setTimeout(() => window.location.reload(), 500);
                });
            }
            
            function handleKeyPress(event) {
                if (event.key === 'Enter') {
                    enviarMensagem();
                }
            }
            
            // Auto-scroll para o final
            const messagesArea = document.getElementById('messagesArea');
            if (messagesArea) {
                messagesArea.scrollTop = messagesArea.scrollHeight;
            }
            
            // Mobile: voltar para lista de conversas
            document.getElementById('mobileBack')?.addEventListener('click', () => {
                const sidebar = document.getElementById('sidebar');
                sidebar.classList.toggle('mobile-open');
            });
            
            // Atualizar a cada 2 segundos (para novas mensagens)
            setInterval(() => {
                fetch('/verificar')
                    .then(res => res.json())
                    .then(data => {
                        if (data.atualizado) {
                            window.location.reload();
                        }
                    });
            }, 3000);
        </script>
    </body>
    </html>
    `);
});

// API Endpoints
app.post('/selecionar', (req, res) => {
    const { conversaId } = req.body;
    conversaAtual = conversaId;
    res.json({ success: true });
});

app.post('/enviar', (req, res) => {
    const { conversaId, texto } = req.body;
    adicionarMensagem(parseInt(conversaId), texto, true);
    res.json({ success: true });
});

app.get('/verificar', (req, res) => {
    res.json({ atualizado: false });
});

// Iniciar servidor
const PORTA = 3010;
app.listen(PORTA, () => {
    console.log('========================================');
    console.log('💬 WHATSAPP CLONE - INTERFACE ORIGINAL');
    console.log(`👉 http://localhost:${PORTA}`);
    console.log('========================================');
    console.log('');
    console.log('CARACTERÍSTICAS:');
    console.log('✓ Interface idêntica ao WhatsApp Web');
    console.log('✓ Bolhas de mensagem estilo WhatsApp');
    console.log('✓ Conversas com status online');
    console.log('✓ Mensagens enviadas e recebidas');
    console.log('✓ Layout responsivo');
    console.log('✓ Simulação de respostas automáticas');
    console.log('========================================');
});