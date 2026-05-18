const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Arquivo para salvar histórico
const ARQUIVO_HISTORICO = path.join(__dirname, '..', 'dados', 'saudacoes.json');

// ========== FUNÇÕES ==========
function getDataHora() {
    const agora = new Date();
    const dia = agora.getDate().toString().padStart(2, '0');
    const mes = (agora.getMonth() + 1).toString().padStart(2, '0');
    const ano = agora.getFullYear();
    const horas = agora.getHours().toString().padStart(2, '0');
    const minutos = agora.getMinutes().toString().padStart(2, '0');
    const segundos = agora.getSeconds().toString().padStart(2, '0');
    return `${dia}/${mes}/${ano} ${horas}:${minutos}:${segundos}`;
}

function getSaudacaoPorHora() {
    const hora = new Date().getHours();
    if (hora < 12) return { texto: "Bom dia", emoji: "🌅", cor: "#FFA500" };
    if (hora < 18) return { texto: "Boa tarde", emoji: "☀️", cor: "#FF8C00" };
    return { texto: "Boa noite", emoji: "🌙", cor: "#4B0082" };
}

function getMensagemPersonalizada(nome) {
    const mensagens = [
        `Que bom ver você por aqui, ${nome}!`,
        `${nome}, você é incrível!`,
        `Tenha um ótimo dia, ${nome}!`,
        `${nome}, continue assim!`,
        `É sempre um prazer receber ${nome}!`,
        `${nome}, você faz a diferença!`
    ];
    return mensagens[Math.floor(Math.random() * mensagens.length)];
}

function salvarHistorico(nome, saudacao) {
    try {
        let historico = [];
        if (fs.existsSync(ARQUIVO_HISTORICO)) {
            const dados = fs.readFileSync(ARQUIVO_HISTORICO, 'utf8');
            historico = JSON.parse(dados);
        }
        
        historico.unshift({
            id: Date.now(),
            nome: nome,
            saudacao: saudacao,
            data: getDataHora()
        });
        
        // Manter apenas os últimos 50 registros
        if (historico.length > 50) historico = historico.slice(0, 50);
        
        fs.writeFileSync(ARQUIVO_HISTORICO, JSON.stringify(historico, null, 2));
    } catch (erro) {
        console.error('Erro ao salvar histórico:', erro);
    }
}

function carregarHistorico() {
    try {
        if (fs.existsSync(ARQUIVO_HISTORICO)) {
            const dados = fs.readFileSync(ARQUIVO_HISTORICO, 'utf8');
            return JSON.parse(dados);
        }
        return [];
    } catch (erro) {
        return [];
    }
}

// ========== ROTAS ==========

// Página inicial com formulário
app.get('/', (req, res) => {
    const saudacao = getSaudacaoPorHora();
    const historico = carregarHistorico();
    
    // Montar histórico HTML
    let historicoHTML = '';
    historico.slice(0, 10).forEach(item => {
        historicoHTML += `
            <div class="historico-item">
                <span class="historico-nome">👤 ${item.nome}</span>
                <span class="historico-saudacao">${item.saudacao}</span>
                <span class="historico-data">📅 ${item.data}</span>
            </div>
        `;
    });
    
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Sistema de Saudação</title>
        <meta charset="utf-8">
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
            
            .card {
                background: white;
                border-radius: 20px;
                padding: 40px;
                margin-bottom: 20px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                animation: fadeIn 0.5s;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .saudacao-emoji {
                font-size: 60px;
                margin-bottom: 20px;
            }
            
            h1 {
                color: #764ba2;
                font-size: 2em;
                margin-bottom: 10px;
            }
            
            .subtitle {
                color: #666;
                margin-bottom: 30px;
            }
            
            .form-group {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }
            
            .form-group input {
                flex: 2;
                padding: 15px;
                font-size: 16px;
                border: 2px solid #ddd;
                border-radius: 10px;
                outline: none;
                transition: border-color 0.3s;
            }
            
            .form-group input:focus {
                border-color: #764ba2;
            }
            
            .form-group button {
                flex: 1;
                padding: 15px;
                font-size: 16px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                transition: transform 0.2s;
            }
            
            .form-group button:hover {
                transform: scale(1.02);
            }
            
            .exemplos {
                display: flex;
                gap: 10px;
                justify-content: center;
                flex-wrap: wrap;
                margin-top: 20px;
            }
            
            .exemplo-btn {
                padding: 8px 15px;
                background: #e0e0e0;
                border: none;
                border-radius: 20px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
            }
            
            .exemplo-btn:hover {
                background: #764ba2;
                color: white;
            }
            
            .historico {
                background: white;
                border-radius: 20px;
                padding: 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            
            .historico h3 {
                color: #764ba2;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .historico-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                border-bottom: 1px solid #eee;
                font-size: 14px;
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .historico-item:last-child {
                border-bottom: none;
            }
            
            .historico-nome {
                font-weight: bold;
                color: #764ba2;
                min-width: 100px;
            }
            
            .historico-saudacao {
                color: #666;
                flex: 1;
            }
            
            .historico-data {
                color: #999;
                font-size: 11px;
            }
            
            .vazio {
                text-align: center;
                color: #999;
                padding: 20px;
            }
            
            .btn-limpar {
                margin-top: 15px;
                padding: 8px 15px;
                background: #f44336;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 12px;
            }
            
            footer {
                text-align: center;
                margin-top: 20px;
                color: white;
                opacity: 0.7;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="card">
                <div class="saudacao-emoji">${saudacao.emoji}</div>
                <h1>Sistema de Saudação Personalizada</h1>
                <p class="subtitle">Digite seu nome e receba uma saudação especial!</p>
                
                <form id="formSaudacao">
                    <div class="form-group">
                        <input type="text" id="nome" placeholder="Digite seu nome..." required autocomplete="off">
                        <button type="submit">🎉 Saudar</button>
                    </div>
                </form>
                
                <div class="exemplos">
                    <button onclick="preencherNome('Ricardo')" class="exemplo-btn">Ricardo</button>
                    <button onclick="preencherNome('Maria')" class="exemplo-btn">Maria</button>
                    <button onclick="preencherNome('João')" class="exemplo-btn">João</button>
                    <button onclick="preencherNome('Ana')" class="exemplo-btn">Ana</button>
                </div>
            </div>
            
            <div class="historico">
                <h3>
                    <span>📜</span> Últimas Saudações
                </h3>
                <div id="historicoLista">
                    ${historicoHTML || '<div class="vazio">Nenhuma saudação ainda. Seja o primeiro!</div>'}
                </div>
                ${historico.length > 0 ? '<button onclick="limparHistorico()" class="btn-limpar">🗑️ Limpar Histórico</button>' : ''}
            </div>
            
            <footer>
                💡 Dica: Você também pode usar a URL: /ola/SeuNome
            </footer>
        </div>
        
        <script>
            function preencherNome(nome) {
                document.getElementById('nome').value = nome;
                document.getElementById('formSaudacao').dispatchEvent(new Event('submit'));
            }
            
            document.getElementById('formSaudacao').onsubmit = async (e) => {
                e.preventDefault();
                const nome = document.getElementById('nome').value;
                if (nome) {
                    window.location.href = '/ola/' + encodeURIComponent(nome);
                }
            };
            
            async function limparHistorico() {
                if (confirm('Tem certeza que deseja limpar o histórico?')) {
                    await fetch('/limpar-historico', { method: 'POST' });
                    location.reload();
                }
            }
        </script>
    </body>
    </html>
    `);
});

// Rota de saudação personalizada
app.get('/ola/:nome', (req, res) => {
    const nome = req.params.nome;
    const saudacao = getSaudacaoPorHora();
    const mensagemPersonalizada = getMensagemPersonalizada(nome);
    const dataHora = getDataHora();
    
    // Salvar no histórico
    salvarHistorico(nome, `${saudacao.texto}, ${nome}!`);
    
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Saudação para ${nome}</title>
        <meta charset="utf-8">
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
            
            .card {
                background: white;
                border-radius: 30px;
                padding: 50px;
                max-width: 600px;
                text-align: center;
                box-shadow: 0 30px 60px rgba(0,0,0,0.3);
                animation: fadeIn 0.5s;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.9); }
                to { opacity: 1; transform: scale(1); }
            }
            
            .emoji {
                font-size: 80px;
                margin-bottom: 20px;
            }
            
            h1 {
                color: #764ba2;
                font-size: 2.5em;
                margin-bottom: 20px;
            }
            
            .mensagem {
                font-size: 1.2em;
                color: #666;
                margin-bottom: 20px;
                line-height: 1.5;
            }
            
            .saudacao {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px;
                border-radius: 15px;
                margin: 20px 0;
                font-size: 1.1em;
            }
            
            .data {
                color: #999;
                font-size: 12px;
                margin-top: 20px;
            }
            
            .botoes {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-top: 30px;
                flex-wrap: wrap;
            }
            
            .btn {
                padding: 12px 25px;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                text-decoration: none;
                font-size: 14px;
                transition: transform 0.2s;
            }
            
            .btn:hover {
                transform: scale(1.02);
            }
            
            .btn-voltar {
                background: #764ba2;
                color: white;
            }
            
            .btn-novo {
                background: #4CAF50;
                color: white;
            }
            
            .dica {
                margin-top: 20px;
                font-size: 12px;
                color: #999;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="emoji">${saudacao.emoji}</div>
            <h1>${saudacao.texto}, ${nome}! 👋</h1>
            <div class="mensagem">${mensagemPersonalizada}</div>
            <div class="saudacao">
                ✨ Seja muito bem-vindo ao Node.js! ✨
            </div>
            <div class="data">
                📅 ${dataHora}
            </div>
            <div class="botoes">
                <a href="/" class="btn btn-voltar">← Voltar ao Início</a>
                <a href="/ola/${nome}" class="btn btn-novo">🔄 Atualizar Saudação</a>
            </div>
            <div class="dica">
                💡 Compartilhe este link: <strong>http://localhost:3007/ola/${nome}</strong>
            </div>
        </div>
    </body>
    </html>
    `);
});

// Limpar histórico
app.post('/limpar-historico', (req, res) => {
    try {
        if (fs.existsSync(ARQUIVO_HISTORICO)) {
            fs.unlinkSync(ARQUIVO_HISTORICO);
        }
        res.json({ success: true });
    } catch (erro) {
        res.json({ success: false });
    }
});

// Iniciar servidor
const PORTA = 3007;
app.listen(PORTA, () => {
    console.log('========================================');
    console.log('🎉 SISTEMA DE SAUDAÇÃO PERSONALIZADA');
    console.log(`👉 http://localhost:${PORTA}`);
    console.log('========================================');
    console.log('');
    console.log('Funcionalidades:');
    console.log('✓ Saudação por horário (Bom dia/tarde/noite)');
    console.log('✓ Mensagens personalizadas aleatórias');
    console.log('✓ Histórico de visitantes');
    console.log('✓ Interface bonita e responsiva');
    console.log('✓ URL amigável: /ola/SeuNome');
    console.log('✓ Exemplos rápidos de nomes');
    console.log('✓ Data e hora da saudação');
    console.log('========================================');
});