const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Estado do jogo
let jogo = {
    tabuleiro: ['', '', '', '', '', '', '', '', ''],
    jogadorAtual: 'X',
    vencedor: null,
    empate: false,
    pontuacao: { X: 0, O: 0, empates: 0 }
};

// Função para verificar vencedor
function verificarVencedor(tabuleiro) {
    const combinacoes = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Linhas
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Colunas
        [0, 4, 8], [2, 4, 6]              // Diagonais
    ];
    
    for (let combo of combinacoes) {
        const [a, b, c] = combo;
        if (tabuleiro[a] && tabuleiro[a] === tabuleiro[b] && tabuleiro[a] === tabuleiro[c]) {
            return tabuleiro[a];
        }
    }
    return null;
}

// Função para verificar empate
function verificarEmpate(tabuleiro) {
    return tabuleiro.every(celula => celula !== '');
}

// Função para reiniciar o jogo
function reiniciarJogo() {
    jogo.tabuleiro = ['', '', '', '', '', '', '', '', ''];
    jogo.jogadorAtual = 'X';
    jogo.vencedor = null;
    jogo.empate = false;
}

// Página principal
app.get('/', (req, res) => {
    const { tabuleiro, jogadorAtual, vencedor, empate, pontuacao } = jogo;
    
    // Montar o tabuleiro HTML
    let tabuleiroHTML = '';
    for (let i = 0; i < 9; i++) {
        const valor = tabuleiro[i];
        const classe = valor === 'X' ? 'x' : (valor === 'O' ? 'o' : 'vazio');
        tabuleiroHTML += `
            <div class="celula ${classe}" onclick="fazerJogada(${i})">
                ${valor}
            </div>
        `;
    }
    
    // Mensagem de status
    let statusHTML = '';
    let statusClasse = 'status';
    
    if (vencedor) {
        statusHTML = `🎉 Jogador ${vencedor} venceu! 🎉`;
        statusClasse += ' vitoria';
    } else if (empate) {
        statusHTML = `🤝 Empate! 🤝`;
        statusClasse += ' empate';
    } else {
        statusHTML = `Vez do jogador ${jogadorAtual}`;
        statusClasse += ` vez-${jogadorAtual.toLowerCase()}`;
    }
    
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Jogo da Velha</title>
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
            
            .container {
                background: white;
                border-radius: 30px;
                padding: 30px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                max-width: 600px;
                width: 100%;
            }
            
            h1 {
                text-align: center;
                color: #764ba2;
                margin-bottom: 20px;
                font-size: 2em;
            }
            
            .pontuacao {
                display: flex;
                justify-content: space-around;
                margin-bottom: 30px;
                gap: 15px;
            }
            
            .pontuacao-card {
                flex: 1;
                text-align: center;
                padding: 15px;
                border-radius: 15px;
                background: #f8f9fa;
            }
            
            .pontuacao-card.x {
                background: linear-gradient(135deg, #2196F3, #1976D2);
                color: white;
            }
            
            .pontuacao-card.o {
                background: linear-gradient(135deg, #f44336, #d32f2f);
                color: white;
            }
            
            .pontuacao-card.empate {
                background: #607D8B;
                color: white;
            }
            
            .pontuacao-valor {
                font-size: 2em;
                font-weight: bold;
            }
            
            .pontuacao-label {
                font-size: 12px;
                opacity: 0.9;
                margin-top: 5px;
            }
            
            .status {
                text-align: center;
                padding: 15px;
                margin-bottom: 20px;
                border-radius: 15px;
                font-size: 1.2em;
                font-weight: bold;
                background: #f8f9fa;
            }
            
            .status.vez-x {
                background: #e3f2fd;
                color: #1976D2;
            }
            
            .status.vez-o {
                background: #ffebee;
                color: #d32f2f;
            }
            
            .status.vitoria {
                background: #4CAF50;
                color: white;
            }
            
            .status.empate {
                background: #ff9800;
                color: white;
            }
            
            .tabuleiro {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                margin-bottom: 30px;
                background: #f8f9fa;
                padding: 20px;
                border-radius: 20px;
            }
            
            .celula {
                aspect-ratio: 1;
                background: white;
                border-radius: 15px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 4em;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            
            .celula:hover {
                transform: scale(1.02);
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            }
            
            .celula.x {
                color: #2196F3;
            }
            
            .celula.o {
                color: #f44336;
            }
            
            .celula.vazio {
                cursor: pointer;
            }
            
            .celula.vazio:hover {
                background: #e3f2fd;
            }
            
            .botoes {
                display: flex;
                gap: 15px;
                justify-content: center;
            }
            
            button {
                padding: 12px 25px;
                font-size: 16px;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                transition: transform 0.2s;
                font-weight: bold;
            }
            
            button:hover {
                transform: scale(1.02);
            }
            
            .btn-reiniciar {
                background: #4CAF50;
                color: white;
            }
            
            .btn-novo-jogo {
                background: #ff9800;
                color: white;
            }
            
            .btn-limpar {
                background: #f44336;
                color: white;
            }
            
            .info {
                text-align: center;
                margin-top: 20px;
                color: #999;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎮 Jogo da Velha</h1>
            
            <div class="pontuacao">
                <div class="pontuacao-card x">
                    <div class="pontuacao-valor">${pontuacao.X}</div>
                    <div class="pontuacao-label">Jogador X</div>
                </div>
                <div class="pontuacao-card empate">
                    <div class="pontuacao-valor">${pontuacao.empates}</div>
                    <div class="pontuacao-label">Empates</div>
                </div>
                <div class="pontuacao-card o">
                    <div class="pontuacao-valor">${pontuacao.O}</div>
                    <div class="pontuacao-label">Jogador O</div>
                </div>
            </div>
            
            <div class="${statusClasse}">
                ${statusHTML}
            </div>
            
            <div class="tabuleiro">
                ${tabuleiroHTML}
            </div>
            
            <div class="botoes">
                <button class="btn-reiniciar" onclick="reiniciarJogo()">🔄 Reiniciar</button>
                <button class="btn-novo-jogo" onclick="novoJogo()">🎮 Nova Partida</button>
                <button class="btn-limpar" onclick="limparPlacar()">🗑️ Limpar Placar</button>
            </div>
            
            <div class="info">
                💡 Clique em uma célula para jogar | X começa primeiro
            </div>
        </div>
        
        <script>
            async function fazerJogada(posicao) {
                const response = await fetch('/jogada', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ posicao })
                });
                const data = await response.json();
                if (data.success) {
                    location.reload();
                } else {
                    alert(data.error);
                }
            }
            
            async function reiniciarJogo() {
                await fetch('/reiniciar', { method: 'POST' });
                location.reload();
            }
            
            async function novoJogo() {
                await fetch('/novo-jogo', { method: 'POST' });
                location.reload();
            }
            
            async function limparPlacar() {
                if (confirm('Limpar todo o placar?')) {
                    await fetch('/limpar-placar', { method: 'POST' });
                    location.reload();
                }
            }
        </script>
    </body>
    </html>
    `);
});

// Rota para fazer jogada
app.post('/jogada', (req, res) => {
    const { posicao } = req.body;
    
    // Verificar se o jogo já acabou
    if (jogo.vencedor || jogo.empate) {
        return res.json({ success: false, error: 'O jogo já acabou! Clique em "Nova Partida"' });
    }
    
    // Verificar se a posição é válida
    if (posicao < 0 || posicao > 8) {
        return res.json({ success: false, error: 'Posição inválida' });
    }
    
    // Verificar se a célula está vazia
    if (jogo.tabuleiro[posicao] !== '') {
        return res.json({ success: false, error: 'Essa posição já está ocupada!' });
    }
    
    // Fazer a jogada
    jogo.tabuleiro[posicao] = jogo.jogadorAtual;
    
    // Verificar vencedor
    const vencedor = verificarVencedor(jogo.tabuleiro);
    if (vencedor) {
        jogo.vencedor = vencedor;
        jogo.pontuacao[vencedor]++;
    } else if (verificarEmpate(jogo.tabuleiro)) {
        jogo.empate = true;
        jogo.pontuacao.empates++;
    } else {
        // Mudar jogador
        jogo.jogadorAtual = jogo.jogadorAtual === 'X' ? 'O' : 'X';
    }
    
    res.json({ success: true });
});

// Rota para reiniciar o jogo (mantém pontuação)
app.post('/reiniciar', (req, res) => {
    reiniciarJogo();
    res.json({ success: true });
});

// Rota para novo jogo (mantém pontuação)
app.post('/novo-jogo', (req, res) => {
    jogo.tabuleiro = ['', '', '', '', '', '', '', '', ''];
    jogo.jogadorAtual = 'X';
    jogo.vencedor = null;
    jogo.empate = false;
    res.json({ success: true });
});

// Rota para limpar placar
app.post('/limpar-placar', (req, res) => {
    jogo.pontuacao = { X: 0, O: 0, empates: 0 };
    reiniciarJogo();
    res.json({ success: true });
});

// Iniciar servidor
const PORTA = 3008;
app.listen(PORTA, () => {
    console.log('========================================');
    console.log('🎮 JOGO DA VELHA');
    console.log(`👉 http://localhost:${PORTA}`);
    console.log('========================================');
    console.log('');
    console.log('Como jogar:');
    console.log('✓ Clique em qualquer célula do tabuleiro');
    console.log('✓ X começa primeiro');
    console.log('✓ Tente fazer uma linha, coluna ou diagonal');
    console.log('✓ Acompanhe o placar');
    console.log('========================================');
});