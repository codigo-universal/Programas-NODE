const express = require('express');
const app = express();

// Variável para contar as visitas
let visitas = 0;

// Rota principal
app.get('/', (req, res) => {
    visitas = visitas + 1;  // aumenta o contador
    
    res.send(`
        <h1>Contador de Visitas</h1>
        <p>Esta página foi visitada <strong style="font-size: 30px; color: red;">${visitas}</strong> vezes!</p>
        <a href="/">Atualizar página</a>
    `);
});

app.listen(3003, () => {
    console.log('Servidor rodando em http://localhost:3000');
    console.log('Atualize a página para ver o contador aumentar!');
});