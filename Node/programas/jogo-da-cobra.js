const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Estado do jogo
let jogo = {
    snake: [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
        { x: 7, y: 10 }
    ],
    food: { x: 15, y: 10 },
    direction: 'RIGHT',
    nextDirection: 'RIGHT',
    score: 0,
    gameOver: false,
    paused: false,
    speed: 150,
    highScore: 0
};

// Carregar pontuação máxima do arquivo
const fs = require('fs');
const path = require('path');
const ARQUIVO_SCORE = path.join(__dirname, '..', 'dados', 'snake-score.json');

try {
    if (fs.existsSync(ARQUIVO_SCORE)) {
        const dados = fs.readFileSync(ARQUIVO_SCORE, 'utf8');
        const saved = JSON.parse(dados);
        jogo.highScore = saved.highScore || 0;
    }
} catch (erro) {
    console.log('Nenhum recorde salvo ainda');
}

function salvarHighScore() {
    try {
        fs.writeFileSync(ARQUIVO_SCORE, JSON.stringify({ highScore: jogo.highScore }, null, 2));
    } catch (erro) {
        console.error('Erro ao salvar recorde:', erro);
    }
}

// Função para gerar nova comida
function gerarComida() {
    const maxX = 20;
    const maxY = 20;
    
    do {
        jogo.food = {
            x: Math.floor(Math.random() * maxX) + 1,
            y: Math.floor(Math.random() * maxY) + 1
        };
    } while (jogo.snake.some(segmento => segmento.x === jogo.food.x && segmento.y === jogo.food.y));
}

// Função para mover a cobra
function moverCobra() {
    if (jogo.gameOver || jogo.paused) return;
    
    // Atualizar direção
    jogo.direction = jogo.nextDirection;
    
    // Calcular nova cabeça
    let newHead = { ...jogo.snake[0] };
    
    switch (jogo.direction) {
        case 'RIGHT': newHead.x++; break;
        case 'LEFT': newHead.x--; break;
        case 'UP': newHead.y--; break;
        case 'DOWN': newHead.y++; break;
    }
    
    // Verificar colisão com comida
    const comeu = (newHead.x === jogo.food.x && newHead.y === jogo.food.y);
    
    // Adicionar nova cabeça
    jogo.snake.unshift(newHead);
    
    if (!comeu) {
        jogo.snake.pop();
    } else {
        jogo.score += 10;
        if (jogo.score > jogo.highScore) {
            jogo.highScore = jogo.score;
            salvarHighScore();
        }
        gerarComida();
        
        // Aumentar velocidade a cada 50 pontos
        if (jogo.score % 50 === 0 && jogo.speed > 60) {
            jogo.speed = Math.max(60, jogo.speed - 10);
        }
    }
    
    // Verificar colisões
    if (newHead.x < 1 || newHead.x > 20 || newHead.y < 1 || newHead.y > 20) {
        jogo.gameOver = true;
        return;
    }
    
    // Verificar colisão com o próprio corpo
    if (jogo.snake.slice(1).some(segmento => segmento.x === newHead.x && segmento.y === newHead.y)) {
        jogo.gameOver = true;
        return;
    }
}

// Página principal
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Snake Game - Jogo da Cobrinha</title>
        <meta charset="utf-8">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                font-family: 'Segoe UI', Arial, sans-serif;
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            }
            
            .container {
                background: #0f3460;
                border-radius: 30px;
                padding: 30px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.4);
            }
            
            .game-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                gap: 20px;
                flex-wrap: wrap;
            }
            
            .score-board {
                background: #16213e;
                padding: 15px 25px;
                border-radius: 15px;
                color: #e94560;
                font-weight: bold;
            }
            
            .score-label {
                font-size: 12px;
                color: #999;
                margin-bottom: 5px;
            }
            
            .score-value {
                font-size: 28px;
                font-weight: bold;
            }
            
            canvas {
                background: #16213e;
                border-radius: 15px;
                display: block;
                margin: 0 auto;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            
            .controls {
                margin-top: 20px;
                text-align: center;
            }
            
            .btn {
                padding: 12px 25px;
                margin: 5px;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                font-size: 14px;
                font-weight: bold;
                transition: transform 0.2s;
            }
            
            .btn:hover {
                transform: scale(1.02);
            }
            
            .btn-start {
                background: #4CAF50;
                color: white;
            }
            
            .btn-pause {
                background: #ff9800;
                color: white;
            }
            
            .btn-reset {
                background: #f44336;
                color: white;
            }
            
            .directions {
                margin-top: 20px;
                display: flex;
                justify-content: center;
                gap: 15px;
                flex-wrap: wrap;
            }
            
            .direction-btn {
                background: #16213e;
                color: #e94560;
                border: 2px solid #e94560;
                padding: 12px 20px;
                font-size: 20px;
                min-width: 70px;
            }
            
            .direction-btn:hover {
                background: #e94560;
                color: white;
            }
            
            .info {
                margin-top: 20px;
                text-align: center;
                color: #999;
                font-size: 12px;
            }
            
            .game-status {
                text-align: center;
                margin-top: 15px;
                font-size: 18px;
                font-weight: bold;
            }
            
            .status-playing { color: #4CAF50; }
            .status-gameover { color: #f44336; }
            .status-paused { color: #ff9800; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="game-header">
                <div class="score-board">
                    <div class="score-label">🐍 Pontuação</div>
                    <div class="score-value" id="score">0</div>
                </div>
                <div class="score-board">
                    <div class="score-label">🏆 Recorde</div>
                    <div class="score-value" id="highScore">0</div>
                </div>
            </div>
            
            <canvas id="gameCanvas" width="420" height="420"></canvas>
            
            <div class="controls">
                <button class="btn btn-start" onclick="iniciarJogo()">▶ Iniciar</button>
                <button class="btn btn-pause" onclick="pausarJogo()">⏸ Pausar</button>
                <button class="btn btn-reset" onclick="resetarJogo()">🔄 Resetar</button>
            </div>
            
            <div class="directions">
                <button class="btn direction-btn" onclick="mudarDirecao('LEFT')">◀</button>
                <button class="btn direction-btn" onclick="mudarDirecao('UP')">▲</button>
                <button class="btn direction-btn" onclick="mudarDirecao('DOWN')">▼</button>
                <button class="btn direction-btn" onclick="mudarDirecao('RIGHT')">▶</button>
            </div>
            
            <div class="game-status" id="gameStatus">
                <span class="status-paused">⏸ Pressione "Iniciar" para começar</span>
            </div>
            
            <div class="info">
                💡 Use as setas do teclado ou clique nos botões | Coma a comida vermelha para crescer
            </div>
        </div>
        
        <script>
            let jogoAtivo = false;
            let intervalo = null;
            
            const canvas = document.getElementById('gameCanvas');
            const ctx = canvas.getContext('2d');
            
            function desenhar() {
                ctx.clearRect(0, 0, 420, 420);
                
                // Desenhar grade
                ctx.strokeStyle = '#0f3460';
                ctx.lineWidth = 0.5;
                for (let i = 0; i <= 20; i++) {
                    ctx.beginPath();
                    ctx.moveTo(i * 21, 0);
                    ctx.lineTo(i * 21, 420);
                    ctx.stroke();
                    ctx.moveTo(0, i * 21);
                    ctx.lineTo(420, i * 21);
                    ctx.stroke();
                }
                
                // Buscar estado do jogo
                fetch('/estado')
                    .then(res => res.json())
                    .then(data => {
                        // Desenhar comida
                        ctx.fillStyle = '#f44336';
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = '#f44336';
                        ctx.fillRect((data.food.x - 1) * 21 + 2, (data.food.y - 1) * 21 + 2, 17, 17);
                        ctx.shadowBlur = 0;
                        
                        // Desenhar cobra
                        data.snake.forEach((segmento, index) => {
                            const gradiente = ctx.createLinearGradient(
                                (segmento.x - 1) * 21, (segmento.y - 1) * 21,
                                (segmento.x - 1) * 21 + 21, (segmento.y - 1) * 21 + 21
                            );
                            
                            if (index === 0) {
                                gradiente.addColorStop(0, '#4CAF50');
                                gradiente.addColorStop(1, '#45a049');
                                ctx.fillStyle = gradiente;
                            } else {
                                gradiente.addColorStop(0, '#66BB6A');
                                gradiente.addColorStop(1, '#4CAF50');
                                ctx.fillStyle = gradiente;
                            }
                            
                            ctx.fillRect((segmento.x - 1) * 21 + 2, (segmento.y - 1) * 21 + 2, 17, 17);
                            
                            // Desenhar olhos na cabeça
                            if (index === 0) {
                                ctx.fillStyle = 'white';
                                ctx.fillRect((segmento.x - 1) * 21 + 5, (segmento.y - 1) * 21 + 5, 4, 4);
                                ctx.fillRect((segmento.x - 1) * 21 + 12, (segmento.y - 1) * 21 + 5, 4, 4);
                                ctx.fillStyle = 'black';
                                ctx.fillRect((segmento.x - 1) * 21 + 6, (segmento.y - 1) * 21 + 6, 2, 2);
                                ctx.fillRect((segmento.x - 1) * 21 + 13, (segmento.y - 1) * 21 + 6, 2, 2);
                            }
                        });
                        
                        // Atualizar pontuação
                        document.getElementById('score').textContent = data.score;
                        document.getElementById('highScore').textContent = data.highScore;
                        
                        // Atualizar status
                        const statusDiv = document.getElementById('gameStatus');
                        if (data.gameOver) {
                            statusDiv.innerHTML = '<span class="status-gameover">💀 GAME OVER! Clique em "Resetar" para jogar novamente 💀</span>';
                            if (jogoAtivo) {
                                clearInterval(intervalo);
                                jogoAtivo = false;
                                intervalo = null;
                            }
                        } else if (data.paused) {
                            statusDiv.innerHTML = '<span class="status-paused">⏸ JOGO PAUSADO</span>';
                        } else if (jogoAtivo) {
                            statusDiv.innerHTML = '<span class="status-playing">🎮 JOGANDO...</span>';
                        }
                    });
            }
            
            function iniciarJogo() {
                fetch('/iniciar', { method: 'POST' })
                    .then(() => {
                        if (intervalo) clearInterval(intervalo);
                        jogoAtivo = true;
                        intervalo = setInterval(() => {
                            fetch('/mover', { method: 'POST' })
                                .then(() => desenhar());
                        }, 150);
                        desenhar();
                    });
            }
            
            function pausarJogo() {
                fetch('/pausar', { method: 'POST' })
                    .then(() => desenhar());
            }
            
            function resetarJogo() {
                fetch('/resetar', { method: 'POST' })
                    .then(() => {
                        if (intervalo) {
                            clearInterval(intervalo);
                            intervalo = null;
                        }
                        jogoAtivo = false;
                        desenhar();
                    });
            }
            
            function mudarDirecao(direcao) {
                fetch('/direcao', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ direction: direcao })
                });
            }
            
            // Controles do teclado
            document.addEventListener('keydown', (e) => {
                const key = e.key;
                if (key === 'ArrowUp') mudarDirecao('UP');
                else if (key === 'ArrowDown') mudarDirecao('DOWN');
                else if (key === 'ArrowLeft') mudarDirecao('LEFT');
                else if (key === 'ArrowRight') mudarDirecao('RIGHT');
                else if (key === ' ') pausarJogo();
                else if (key === 'Enter') iniciarJogo();
            });
            
            // Desenhar estado inicial
            desenhar();
        </script>
    </body>
    </html>
    `);
});

// API Endpoints
app.get('/estado', (req, res) => {
    res.json({
        snake: jogo.snake,
        food: jogo.food,
        score: jogo.score,
        gameOver: jogo.gameOver,
        paused: jogo.paused,
        highScore: jogo.highScore
    });
});

app.post('/iniciar', (req, res) => {
    if (jogo.gameOver) {
        jogo.snake = [
            { x: 10, y: 10 },
            { x: 9, y: 10 },
            { x: 8, y: 10 },
            { x: 7, y: 10 }
        ];
        jogo.direction = 'RIGHT';
        jogo.nextDirection = 'RIGHT';
        jogo.score = 0;
        jogo.gameOver = false;
        jogo.speed = 150;
        gerarComida();
    }
    jogo.paused = false;
    res.json({ success: true });
});

app.post('/pausar', (req, res) => {
    if (!jogo.gameOver) {
        jogo.paused = !jogo.paused;
    }
    res.json({ success: true });
});

app.post('/resetar', (req, res) => {
    jogo.snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
        { x: 7, y: 10 }
    ];
    jogo.direction = 'RIGHT';
    jogo.nextDirection = 'RIGHT';
    jogo.score = 0;
    jogo.gameOver = false;
    jogo.paused = false;
    jogo.speed = 150;
    gerarComida();
    res.json({ success: true });
});

app.post('/mover', (req, res) => {
    moverCobra();
    res.json({ success: true });
});

app.post('/direcao', (req, res) => {
    const { direction } = req.body;
    const opposites = {
        'UP': 'DOWN', 'DOWN': 'UP', 'LEFT': 'RIGHT', 'RIGHT': 'LEFT'
    };
    if (jogo.direction !== opposites[direction]) {
        jogo.nextDirection = direction;
    }
    res.json({ success: true });
});

// Funções auxiliares
function gerarComida() {
    const maxX = 20;
    const maxY = 20;
    
    do {
        jogo.food = {
            x: Math.floor(Math.random() * maxX) + 1,
            y: Math.floor(Math.random() * maxY) + 1
        };
    } while (jogo.snake.some(segmento => segmento.x === jogo.food.x && segmento.y === jogo.food.y));
}

function moverCobra() {
    if (jogo.gameOver || jogo.paused) return;
    
    jogo.direction = jogo.nextDirection;
    
    let newHead = { ...jogo.snake[0] };
    
    switch (jogo.direction) {
        case 'RIGHT': newHead.x++; break;
        case 'LEFT': newHead.x--; break;
        case 'UP': newHead.y--; break;
        case 'DOWN': newHead.y++; break;
    }
    
    const comeu = (newHead.x === jogo.food.x && newHead.y === jogo.food.y);
    
    jogo.snake.unshift(newHead);
    
    if (!comeu) {
        jogo.snake.pop();
    } else {
        jogo.score += 10;
        if (jogo.score > jogo.highScore) {
            jogo.highScore = jogo.score;
            salvarHighScore();
        }
        gerarComida();
        
        if (jogo.score % 50 === 0 && jogo.speed > 60) {
            jogo.speed = Math.max(60, jogo.speed - 10);
        }
    }
    
    if (newHead.x < 1 || newHead.x > 20 || newHead.y < 1 || newHead.y > 20) {
        jogo.gameOver = true;
        return;
    }
    
    if (jogo.snake.slice(1).some(segmento => segmento.x === newHead.x && segmento.y === newHead.y)) {
        jogo.gameOver = true;
        return;
    }
}

function salvarHighScore() {
    try {
        const fs = require('fs');
        const path = require('path');
        const ARQUIVO_SCORE = path.join(__dirname, '..', 'dados', 'snake-score.json');
        fs.writeFileSync(ARQUIVO_SCORE, JSON.stringify({ highScore: jogo.highScore }, null, 2));
    } catch (erro) {
        console.error('Erro ao salvar recorde:', erro);
    }
}

// Iniciar servidor
const PORTA = 3009;
app.listen(PORTA, () => {
    console.log('========================================');
    console.log('🐍 SNAKE GAME - JOGO DA COBRINHA');
    console.log(`👉 http://localhost:${PORTA}`);
    console.log('========================================');
    console.log('');
    console.log('Como jogar:');
    console.log('✓ Use as SETAS do teclado para mover');
    console.log('✓ Espaço para pausar');
    console.log('✓ Enter para iniciar');
    console.log('✓ Coma a comida vermelha para crescer');
    console.log('✓ Não bata na parede ou no próprio corpo');
    console.log('========================================');
});