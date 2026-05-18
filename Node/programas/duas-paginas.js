const express = require('express');
const app = express();

// Página 1
app.get('/', (req, res) => {
    res.send(`
        <h1>📄 Página 1</h1>
        <p>Você está na primeira página</p>
        <a href="/pagina2">Ir para página 2</a>
    `);
});

// Página 2
app.get('/pagina2', (req, res) => {
    res.send(`
        <h1>📄 Página 2</h1>
        <p>Você está na segunda página</p>
        <a href="/">Voltar para página 1</a>
    `);
});

app.listen(3004, () => {
    console.log('http://localhost:3000');
});