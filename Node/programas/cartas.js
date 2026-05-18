const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Página principal
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Jogo da Memória</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                user-select: none;
            }
            
            body {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                font-family: 'Segoe UI', Arial, sans-serif;
                min-height: 100vh;
                padding: 15px;
            }
            
            .container {
                max-width: 700px;
                margin: 0 auto;
            }
            
            .header {
                background: white;
                border-radius: 15px;
                padding: 12px;
                margin-bottom: 15px;
                text-align: center;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            
            .header h1 {
                color: #764ba2;
                font-size: 1.5em;
                margin-bottom: 5px;
            }
            
            .header p {
                color: #666;
                font-size: 11px;
            }
            
            .stats {
                display: flex;
                justify-content: space-around;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 10px;
            }
            
            .stat-card {
                background: #f8f9fa;
                padding: 5px 12px;
                border-radius: 10px;
                text-align: center;
                min-width: 70px;
            }
            
            .stat-label {
                font-size: 10px;
                color: #999;
                margin-bottom: 3px;
            }
            
            .stat-value {
                font-size: 18px;
                font-weight: bold;
                color: #764ba2;
            }
            
            .preview-timer {
                background: #ff9800;
                color: white;
                padding: 8px;
                border-radius: 8px;
                margin-bottom: 12px;
                text-align: center;
                font-weight: bold;
                font-size: 14px;
            }
            
            .temas {
                display: flex;
                gap: 8px;
                justify-content: center;
                margin-bottom: 15px;
                flex-wrap: wrap;
            }
            
            .tema-btn {
                padding: 6px 12px;
                background: white;
                border: 2px solid #764ba2;
                border-radius: 8px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s;
            }
            
            .tema-btn:hover {
                background: #764ba2;
                color: white;
                transform: scale(1.02);
            }
            
            .tema-btn.ativo {
                background: #764ba2;
                color: white;
            }
            
            .game-board {
                background: white;
                border-radius: 15px;
                padding: 15px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            
            .grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 10px;
                margin-bottom: 15px;
            }
            
            .card {
                aspect-ratio: 1;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 2.2em;
                transition: all 0.3s;
                box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            }
            
            .card.virada {
                background: white;
                box-shadow: 0 3px 10px rgba(0,0,0,0.1);
            }
            
            .card.combinada {
                background: #4CAF50;
                cursor: default;
                opacity: 0.7;
                transform: scale(0.95);
            }
            
            .card:hover:not(.combinada):not(.preview-mode) {
                transform: scale(1.02);
            }
            
            .card.preview-mode {
                cursor: default;
            }
            
            .controls {
                display: flex;
                gap: 10px;
                justify-content: center;
            }
            
            .btn {
                padding: 8px 16px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 12px;
                font-weight: bold;
                transition: transform 0.2s;
            }
            
            .btn:hover {
                transform: scale(1.02);
            }
            
            .btn-novo {
                background: #4CAF50;
                color: white;
            }
            
            .btn-reset {
                background: #ff9800;
                color: white;
            }
            
            .btn-dicas {
                background: #2196F3;
                color: white;
            }
            
            .mensagem {
                text-align: center;
                margin-top: 15px;
                padding: 10px;
                border-radius: 8px;
                font-weight: bold;
                display: none;
                font-size: 12px;
            }
            
            .mensagem.vitoria {
                background: #d4edda;
                color: #155724;
                display: block;
            }
            
            .timer {
                font-size: 16px;
                font-weight: bold;
                color: #764ba2;
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-3px); }
                75% { transform: translateX(3px); }
            }
            
            .card.erro {
                animation: shake 0.3s ease-in-out;
                background: #f44336;
            }
            
            @keyframes pulse {
                0%, 100% { transform: scale(1); background: #ffd700; }
                50% { transform: scale(1.05); background: #ffed4a; }
            }
            
            @media (max-width: 500px) {
                .card {
                    font-size: 1.5em;
                }
                .stat-card {
                    min-width: 55px;
                    padding: 4px 8px;
                }
                .stat-value {
                    font-size: 14px;
                }
                .btn {
                    padding: 6px 12px;
                    font-size: 10px;
                }
                .grid {
                    gap: 8px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎮 Jogo da Memória</h1>
                <p>Encontre os pares de cartas iguais!</p>
                
                <div class="stats">
                    <div class="stat-card">
                        <div class="stat-label">🎯 Movimentos</div>
                        <div class="stat-value" id="movimentos">0</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">✨ Pares</div>
                        <div class="stat-value" id="pares">0/8</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">⏱️ Tempo</div>
                        <div class="stat-value timer" id="tempo">00:00</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">🏆 Recorde</div>
                        <div class="stat-value" id="recorde">-</div>
                    </div>
                </div>
            </div>
            
            <div id="previewTimer" class="preview-timer" style="display: none;">
                ⏰ Memorize as cartas! <span id="previewCountdown">15</span> segundos...
            </div>
            
            <div class="temas">
                <button class="tema-btn" data-tema="animais">🐶 Animais</button>
                <button class="tema-btn" data-tema="frutas">🍎 Frutas</button>
                <button class="tema-btn" data-tema="esportes">⚽ Esportes</button>
                <button class="tema-btn" data-tema="emocao">😀 Emoções</button>
            </div>
            
            <div class="game-board">
                <div class="grid" id="grid"></div>
                
                <div class="controls">
                    <button class="btn btn-novo" id="novoJogoBtn">🔄 Novo Jogo</button>
                    <button class="btn btn-reset" id="resetarBtn">🎮 Resetar</button>
                    <button class="btn btn-dicas" id="dicaBtn">💡 Dica</button>
                </div>
                
                <div id="mensagem" class="mensagem"></div>
            </div>
        </div>
        
        <script>
            let cartas = [];
            let cartasViradas = [];
            let paresEncontrados = 0;
            let movimentos = 0;
            let bloqueado = false;
            let tempo = 0;
            let timerInterval = null;
            let previewInterval = null;
            let temaAtual = 'animais';
            let jogoIniciado = false;
            let melhorPontuacao = localStorage.getItem('melhorPontuacao') ? parseInt(localStorage.getItem('melhorPontuacao')) : null;
            
            const temas = {
                animais: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'],
                frutas: ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓'],
                esportes: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸'],
                emocao: ['😀', '😂', '😍', '😎', '😢', '😡', '😱', '🥶']
            };
            
            function embaralhar(array) {
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [array[i], array[j]] = [array[j], array[i]];
                }
                return array;
            }
            
            function mostrarPreview(tempoPreview) {
                return new Promise((resolve) => {
                    cartas.forEach(carta => {
                        carta.virada = true;
                    });
                    renderizarGrid();
                    
                    document.querySelectorAll('.card').forEach(card => {
                        card.classList.add('preview-mode');
                    });
                    
                    const previewDiv = document.getElementById('previewTimer');
                    const countdownSpan = document.getElementById('previewCountdown');
                    previewDiv.style.display = 'block';
                    
                    let tempoRestante = tempoPreview;
                    countdownSpan.textContent = tempoRestante;
                    
                    previewInterval = setInterval(() => {
                        tempoRestante--;
                        countdownSpan.textContent = tempoRestante;
                        
                        if (tempoRestante <= 0) {
                            clearInterval(previewInterval);
                            previewDiv.style.display = 'none';
                            
                            cartas.forEach(carta => {
                                carta.virada = false;
                            });
                            renderizarGrid();
                            
                            document.querySelectorAll('.card').forEach(card => {
                                card.classList.remove('preview-mode');
                            });
                            
                            jogoIniciado = true;
                            bloqueado = false;
                            
                            if (timerInterval) clearInterval(timerInterval);
                            tempo = 0;
                            atualizarTempo();
                            timerInterval = setInterval(() => {
                                if (!bloqueado && paresEncontrados < 8 && jogoIniciado && tempo < 999) {
                                    tempo++;
                                    atualizarTempo();
                                }
                            }, 1000);
                            
                            resolve();
                        }
                    }, 1000);
                });
            }
            
            async function iniciarJogo() {
                bloqueado = true;
                jogoIniciado = false;
                
                if (timerInterval) clearInterval(timerInterval);
                if (previewInterval) clearInterval(previewInterval);
                
                const cartasBase = [...temas[temaAtual], ...temas[temaAtual]];
                const cartasEmbaralhadas = embaralhar([...cartasBase]);
                
                cartas = cartasEmbaralhadas.map((valor, index) => ({
                    id: index,
                    valor: valor,
                    virada: false,
                    combinada: false
                }));
                
                cartasViradas = [];
                paresEncontrados = 0;
                movimentos = 0;
                
                if (melhorPontuacao) {
                    document.getElementById('recorde').textContent = melhorPontuacao;
                } else {
                    document.getElementById('recorde').textContent = '-';
                }
                
                atualizarStats();
                
                await mostrarPreview(15);
            }
            
            function renderizarGrid() {
                const grid = document.getElementById('grid');
                grid.innerHTML = '';
                
                cartas.forEach((carta, idx) => {
                    const cardDiv = document.createElement('div');
                    cardDiv.className = 'card';
                    if (carta.virada) cardDiv.classList.add('virada');
                    if (carta.combinada) cardDiv.classList.add('combinada');
                    if (!jogoIniciado) cardDiv.classList.add('preview-mode');
                    cardDiv.textContent = carta.virada || carta.combinada ? carta.valor : '?';
                    cardDiv.onclick = () => virarCarta(idx);
                    grid.appendChild(cardDiv);
                });
            }
            
            function virarCarta(id) {
                if (bloqueado) return;
                if (!jogoIniciado) return;
                
                const carta = cartas[id];
                if (carta.virada || carta.combinada) return;
                if (cartasViradas.length >= 2) return;
                
                carta.virada = true;
                cartasViradas.push(carta);
                renderizarGrid();
                
                if (cartasViradas.length === 2) {
                    movimentos++;
                    atualizarStats();
                    verificarPar();
                }
            }
            
            function verificarPar() {
                const [carta1, carta2] = cartasViradas;
                
                if (carta1.valor === carta2.valor) {
                    carta1.combinada = true;
                    carta2.combinada = true;
                    carta1.virada = false;
                    carta2.virada = false;
                    paresEncontrados++;
                    cartasViradas = [];
                    atualizarStats();
                    renderizarGrid();
                    
                    if (paresEncontrados === 8) {
                        finalizarJogo(true);
                    }
                } else {
                    bloqueado = true;
                    mostrarErro(carta1.id, carta2.id);
                    
                    setTimeout(() => {
                        carta1.virada = false;
                        carta2.virada = false;
                        cartasViradas = [];
                        bloqueado = false;
                        renderizarGrid();
                    }, 800);
                }
            }
            
            function mostrarErro(id1, id2) {
                const cards = document.querySelectorAll('.card');
                cards[id1].classList.add('erro');
                cards[id2].classList.add('erro');
                setTimeout(() => {
                    cards[id1].classList.remove('erro');
                    cards[id2].classList.remove('erro');
                }, 800);
            }
            
            function atualizarStats() {
                document.getElementById('movimentos').textContent = movimentos;
                document.getElementById('pares').textContent = paresEncontrados + '/8';
            }
            
            function atualizarTempo() {
                const minutos = Math.floor(tempo / 60);
                const segundos = tempo % 60;
                document.getElementById('tempo').textContent = 
                    minutos.toString().padStart(2, '0') + ':' + segundos.toString().padStart(2, '0');
            }
            
            function finalizarJogo(ganhou) {
                if (timerInterval) clearInterval(timerInterval);
                
                if (ganhou) {
                    const mensagemDiv = document.getElementById('mensagem');
                    mensagemDiv.className = 'mensagem vitoria';
                    mensagemDiv.innerHTML = '🎉 PARABÉNS! Você completou o jogo! 🎉<br>' +
                        '📊 Movimentos: ' + movimentos + '<br>' +
                        '⏱️ Tempo: ' + document.getElementById('tempo').textContent;
                    
                    if (!melhorPontuacao || movimentos < melhorPontuacao) {
                        melhorPontuacao = movimentos;
                        localStorage.setItem('melhorPontuacao', melhorPontuacao);
                        document.getElementById('recorde').textContent = melhorPontuacao;
                        mensagemDiv.innerHTML += '<br>🏆 NOVO RECORDE! 🏆';
                    }
                }
            }
            
            async function mudarTema(tema) {
                temaAtual = tema;
                document.querySelectorAll('.tema-btn').forEach(btn => {
                    btn.classList.remove('ativo');
                    if (btn.getAttribute('data-tema') === tema) {
                        btn.classList.add('ativo');
                    }
                });
                await iniciarJogo();
                document.getElementById('mensagem').className = 'mensagem';
            }
            
            function dica() {
                if (!jogoIniciado) return;
                
                const naoCombinadas = cartas.filter(c => !c.combinada && !c.virada);
                const paresDisponiveis = {};
                
                naoCombinadas.forEach(carta => {
                    if (!paresDisponiveis[carta.valor]) {
                        paresDisponiveis[carta.valor] = [];
                    }
                    paresDisponiveis[carta.valor].push(carta.id);
                });
                
                for (let valor in paresDisponiveis) {
                    if (paresDisponiveis[valor].length >= 2) {
                        const [id1, id2] = paresDisponiveis[valor];
                        const cards = document.querySelectorAll('.card');
                        cards[id1].style.animation = 'pulse 0.5s ease-in-out';
                        cards[id2].style.animation = 'pulse 0.5s ease-in-out';
                        setTimeout(() => {
                            cards[id1].style.animation = '';
                            cards[id2].style.animation = '';
                        }, 1000);
                        break;
                    }
                }
            }
            
            // Configurar eventos
            document.querySelectorAll('.tema-btn').forEach(btn => {
                btn.onclick = () => mudarTema(btn.getAttribute('data-tema'));
            });
            
            document.getElementById('novoJogoBtn').onclick = async () => {
                await iniciarJogo();
                document.getElementById('mensagem').className = 'mensagem';
            };
            
            document.getElementById('resetarBtn').onclick = async () => {
                await iniciarJogo();
                document.getElementById('mensagem').className = 'mensagem';
            };
            
            document.getElementById('dicaBtn').onclick = dica;
            
            // Iniciar o jogo
            iniciarJogo();
        </script>
    </body>
    </html>
    `);
});

// Iniciar servidor na porta 3011
const PORTA = 3011;
app.listen(PORTA, () => {
    console.log('========================================');
    console.log('🎮 JOGO DA MEMÓRIA');
    console.log(`👉 http://localhost:${PORTA}`);
    console.log('========================================');
    console.log('');
    console.log('COMO JOGAR:');
    console.log('✓ Primeiro, mostramos TODAS as cartas por 15 segundos');
    console.log('✓ Memorize as posições!');
    console.log('✓ Depois clique nas cartas para virar');
    console.log('✓ Encontre os pares iguais');
    console.log('========================================');
});