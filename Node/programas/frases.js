const express = require('express');
const app = express();

// Lista de frases por categoria
const frases = {
    motivacao: [
        "Você é mais forte do que pensa! 💪",
        "Acredite nos seus sonhos! 🌟",
        "Cada dia é uma nova oportunidade! 🌈",
        "Você está aprendendo Node.js! 🚀",
        "Continue assim, está indo muito bem! 👍",
        "O sucesso é a soma de pequenos esforços! 📚",
        "Você consegue tudo que deseja! ✨",
        "Não pare até se orgulhar de si mesmo! 🎯"
    ],
    sabedoria: [
        "A única maneira de fazer um ótimo trabalho é amar o que você faz. ❤️",
        "A jornada de mil milhas começa com um único passo. 👣",
        "Aprender é a única coisa que a mente nunca se cansa. 📖",
        "A paciência é amarga, mas seus frutos são doces. 🍎",
        "A gratidão transforma o que temos em suficiente. 🙏"
    ]
};

// Rota principal - mostra as frases
app.get('/', (req, res) => {
    // Junta todas as frases em uma lista só
    const todasFrases = [...frases.motivacao, ...frases.sabedoria];
    const fraseAleatoria = todasFrases[Math.floor(Math.random() * todasFrases.length)];
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Frases Inspiradoras</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    font-family: 'Segoe UI', Arial, sans-serif;
                    padding: 20px;
                }
                
                .container {
                    background: white;
                    padding: 50px;
                    border-radius: 30px;
                    text-align: center;
                    max-width: 700px;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.3);
                    animation: fadeIn 0.5s;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                
                .emoji {
                    font-size: 70px;
                    margin-bottom: 20px;
                }
                
                h1 {
                    color: #764ba2;
                    font-size: 32px;
                    margin-bottom: 30px;
                }
                
                .frase {
                    font-size: 28px;
                    color: #333;
                    margin: 40px 0;
                    line-height: 1.4;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 20px;
                    font-style: italic;
                }
                
                .autor {
                    color: #764ba2;
                    font-size: 18px;
                    margin-top: 10px;
                    font-style: normal;
                }
                
                button {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 15px 35px;
                    font-size: 18px;
                    border-radius: 50px;
                    cursor: pointer;
                    margin: 10px;
                    transition: transform 0.3s;
                }
                
                button:hover {
                    transform: translateY(-3px);
                }
                
                .categorias {
                    margin-top: 30px;
                }
                
                .cat-btn {
                    background: #e9ecef;
                    color: #764ba2;
                    padding: 8px 20px;
                    font-size: 14px;
                }
                
                .cat-btn:hover {
                    background: #764ba2;
                    color: white;
                }
                
                small {
                    display: block;
                    margin-top: 30px;
                    color: #999;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="emoji">💭</div>
                <h1>✨ Frase Inspiradora ✨</h1>
                
                <div class="frase">
                    "${fraseAleatoria}"
                    <div class="autor">— Inspiração do dia</div>
                </div>
                
                <button onclick="location.reload()">🔄 Nova Frase Aleatória</button>
                
                <div class="categorias">
                    <a href="/categoria/motivacao">
                        <button class="cat-btn">💪 Motivação</button>
                    </a>
                    <a href="/categoria/sabedoria">
                        <button class="cat-btn">📚 Sabedoria</button>
                    </a>
                    <a href="/">
                        <button class="cat-btn">🎲 Todas</button>
                    </a>
                </div>
                
                <small>⭐ Clique nas categorias para filtrar as frases</small>
            </div>
        </body>
        </html>
    `);
});

// Rota para categorias específicas
app.get('/categoria/:tipo', (req, res) => {
    const tipo = req.params.tipo;
    
    // Verifica se a categoria existe
    if (!frases[tipo]) {
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>Categoria não encontrada</title></head>
            <body style="text-align:center; padding:50px; font-family:Arial">
                <h1>❌ Categoria "${tipo}" não existe!</h1>
                <a href="/">Voltar para página inicial</a>
            </body>
            </html>
        `);
    }
    
    // Pega uma frase da categoria escolhida
    const listaFrases = frases[tipo];
    const fraseAleatoria = listaFrases[Math.floor(Math.random() * listaFrases.length)];
    
    // Define o título e emoji da categoria
    let titulo = tipo === 'motivacao' ? '💪 Motivação' : '📚 Sabedoria';
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${titulo}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    font-family: 'Segoe UI', Arial, sans-serif;
                    padding: 20px;
                }
                .container {
                    background: white;
                    padding: 50px;
                    border-radius: 30px;
                    text-align: center;
                    max-width: 700px;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.3);
                }
                .emoji { font-size: 70px; margin-bottom: 20px; }
                h1 { color: #764ba2; margin-bottom: 30px; }
                .frase {
                    font-size: 28px;
                    color: #333;
                    margin: 40px 0;
                    line-height: 1.4;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 20px;
                    font-style: italic;
                }
                button {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 15px 35px;
                    font-size: 18px;
                    border-radius: 50px;
                    cursor: pointer;
                    margin: 10px;
                }
                .back-btn {
                    background: #e9ecef;
                    color: #764ba2;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="emoji">${tipo === 'motivacao' ? '💪' : '📚'}</div>
                <h1>${titulo}</h1>
                <div class="frase">"${fraseAleatoria}"</div>
                <button onclick="location.reload()">🔄 Nova Frase</button>
                <br>
                <a href="/"><button class="back-btn">← Voltar para todas</button></a>
            </div>
        </body>
        </html>
    `);
});

app.listen(3005, () => {
    console.log('✅ Servidor rodando!');
    console.log('👉 http://localhost:3005');
    console.log('');
    console.log('💪 GERADOR DE FRASES MOTIVACIONAIS');
    console.log('Clique nas categorias para filtrar as frases!');
});