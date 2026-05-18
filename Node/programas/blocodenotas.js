const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Arquivo para salvar as notas
const ARQUIVO_NOTAS = path.join(__dirname, '..', 'dados', 'notas.json');

// ========== FUNÇÕES ==========
function carregarNotas() {
    try {
        if (fs.existsSync(ARQUIVO_NOTAS)) {
            const dados = fs.readFileSync(ARQUIVO_NOTAS, 'utf8');
            return JSON.parse(dados);
        }
    } catch (erro) {
        console.error('Erro ao carregar notas:', erro);
    }
    return [];
}

function salvarNotas(notas) {
    try {
        fs.writeFileSync(ARQUIVO_NOTAS, JSON.stringify(notas, null, 2));
        return true;
    } catch (erro) {
        console.error('Erro ao salvar notas:', erro);
        return false;
    }
}

function getDataHora() {
    var agora = new Date();
    var dia = agora.getDate().toString().padStart(2, '0');
    var mes = (agora.getMonth() + 1).toString().padStart(2, '0');
    var ano = agora.getFullYear();
    var horas = agora.getHours().toString().padStart(2, '0');
    var minutos = agora.getMinutes().toString().padStart(2, '0');
    return dia + '/' + mes + '/' + ano + ' ' + horas + ':' + minutos;
}

var notas = carregarNotas();

// ========== PÁGINA PRINCIPAL ==========
app.get('/', function(req, res) {
    // Ordenar notas por data (mais recentes primeiro)
    var notasOrdenadas = [...notas].reverse();
    
    var notasHTML = '';
    for (var i = 0; i < notasOrdenadas.length; i++) {
        var nota = notasOrdenadas[i];
        var dataFormatada = nota.data || nota.criada_em;
        var favoritoIcon = nota.favorito ? '⭐' : '☆';
        var conteudoPreview = nota.conteudo ? nota.conteudo.substring(0, 150) + (nota.conteudo.length > 150 ? '...' : '') : 'Clique para adicionar conteúdo...';
        var tituloDisplay = nota.titulo || 'Sem título';
        
        notasHTML += `
            <div class="nota-card" data-id="${nota.id}">
                <div class="nota-header">
                    <div class="nota-titulo" onclick="editarNota(${nota.id})">
                        ${tituloDisplay}
                    </div>
                    <div class="nota-acoes">
                        <button class="btn-favorito" onclick="toggleFavorito(${nota.id})" title="Favorito">${favoritoIcon}</button>
                        <button class="btn-editar" onclick="editarNota(${nota.id})" title="Editar">✏️</button>
                        <button class="btn-excluir" onclick="excluirNota(${nota.id})" title="Excluir">🗑️</button>
                    </div>
                </div>
                <div class="nota-conteudo" onclick="editarNota(${nota.id})">
                    ${conteudoPreview}
                </div>
                <div class="nota-footer">
                    <span class="nota-data">📅 ${dataFormatada}</span>
                    ${nota.categoria ? '<span class="nota-categoria">📁 ' + nota.categoria + '</span>' : ''}
                </div>
            </div>
        `;
    }
    
    if (notas.length === 0) {
        notasHTML = '<div class="sem-notas">📝 Nenhuma nota ainda. Clique em "Nova Nota" para começar!</div>';
    }
    
    var totalFavoritos = 0;
    for (var i = 0; i < notas.length; i++) {
        if (notas[i].favorito) totalFavoritos++;
    }
    
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Bloco de Notas Online</title>
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
            
            .container {
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .header {
                background: white;
                border-radius: 20px;
                padding: 25px;
                margin-bottom: 20px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            
            .header h1 {
                color: #764ba2;
                font-size: 2em;
                margin-bottom: 10px;
            }
            
            .header p {
                color: #666;
            }
            
            .stats {
                background: white;
                border-radius: 15px;
                padding: 15px;
                margin-bottom: 20px;
                text-align: center;
                font-weight: bold;
                color: #764ba2;
                display: flex;
                justify-content: space-around;
                flex-wrap: wrap;
            }
            
            .stats span {
                padding: 5px 15px;
                border-radius: 10px;
            }
            
            .barra-ferramentas {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                flex-wrap: wrap;
                justify-content: center;
            }
            
            .btn {
                padding: 12px 24px;
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
            
            .btn-novo {
                background: #4CAF50;
                color: white;
            }
            
            .btn-pesquisar {
                background: #2196F3;
                color: white;
            }
            
            .btn-favoritos {
                background: #ff9800;
                color: white;
            }
            
            .pesquisa-box {
                display: flex;
                gap: 10px;
                background: white;
                padding: 10px;
                border-radius: 50px;
                margin-bottom: 20px;
                display: none;
            }
            
            .pesquisa-box input {
                flex: 1;
                padding: 10px 20px;
                border: 2px solid #ddd;
                border-radius: 25px;
                outline: none;
            }
            
            .notas-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                gap: 20px;
            }
            
            .nota-card {
                background: white;
                border-radius: 15px;
                padding: 20px;
                transition: transform 0.2s, box-shadow 0.2s;
                cursor: pointer;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            
            .nota-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            
            .nota-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 2px solid #f0f0f0;
            }
            
            .nota-titulo {
                font-size: 1.2em;
                font-weight: bold;
                color: #764ba2;
                flex: 1;
                cursor: pointer;
            }
            
            .nota-acoes {
                display: flex;
                gap: 5px;
            }
            
            .nota-acoes button {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 1.1em;
                padding: 5px;
                border-radius: 5px;
                transition: background 0.2s;
            }
            
            .nota-acoes button:hover {
                background: #f0f0f0;
            }
            
            .btn-favorito {
                color: #ffc107;
            }
            
            .nota-conteudo {
                color: #666;
                font-size: 0.9em;
                line-height: 1.4;
                margin-bottom: 15px;
                min-height: 60px;
                cursor: pointer;
            }
            
            .nota-footer {
                display: flex;
                justify-content: space-between;
                font-size: 0.75em;
                color: #999;
                padding-top: 10px;
                border-top: 1px solid #f0f0f0;
            }
            
            .sem-notas {
                text-align: center;
                padding: 50px;
                background: white;
                border-radius: 15px;
                color: #999;
            }
            
            /* Modal */
            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .modal-content {
                background: white;
                border-radius: 20px;
                width: 600px;
                max-width: 90%;
                padding: 30px;
            }
            
            .modal-content h2 {
                color: #764ba2;
                margin-bottom: 20px;
            }
            
            .modal-content input, .modal-content textarea, .modal-content select {
                width: 100%;
                padding: 12px;
                margin: 10px 0;
                border: 2px solid #ddd;
                border-radius: 10px;
                font-family: inherit;
                outline: none;
            }
            
            .modal-content textarea {
                min-height: 150px;
                resize: vertical;
            }
            
            .modal-content input:focus, .modal-content textarea:focus {
                border-color: #764ba2;
            }
            
            .modal-botoes {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
            }
            
            .modal-botoes button {
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
            }
            
            .btn-salvar {
                background: #4CAF50;
                color: white;
            }
            
            .btn-cancelar {
                background: #999;
                color: white;
            }
            
            .toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #333;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                display: none;
                z-index: 1000;
            }
            
            @media (max-width: 600px) {
                .notas-grid {
                    grid-template-columns: 1fr;
                }
                .header h1 {
                    font-size: 1.5em;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📝 Bloco de Notas Online</h1>
                <p>Suas notas sempre com você, em qualquer lugar</p>
            </div>
            
            <div class="stats" id="stats">
                <span>📊 Total: ${notas.length} notas</span>
                <span>⭐ Favoritos: ${totalFavoritos}</span>
            </div>
            
            <div class="barra-ferramentas">
                <button class="btn btn-novo" onclick="abrirModalNovaNota()">➕ Nova Nota</button>
                <button class="btn btn-pesquisar" onclick="togglePesquisa()">🔍 Pesquisar</button>
                <button class="btn btn-favoritos" onclick="filtrarFavoritos()">⭐ Favoritos</button>
                <button class="btn" onclick="carregarTodas()">📋 Todas Notas</button>
            </div>
            
            <div class="pesquisa-box" id="pesquisaBox">
                <input type="text" id="pesquisaInput" placeholder="Pesquisar notas...">
                <button class="btn" onclick="pesquisarNotas()">Buscar</button>
                <button class="btn" onclick="fecharPesquisa()">Fechar</button>
            </div>
            
            <div class="notas-grid" id="notasGrid">
                ${notasHTML}
            </div>
        </div>
        
        <div id="modal" class="modal">
            <div class="modal-content">
                <h2 id="modalTitulo">Nova Nota</h2>
                <input type="text" id="notaId" style="display:none;">
                <input type="text" id="notaTitulo" placeholder="Título da nota">
                <textarea id="notaConteudo" placeholder="Conteúdo da nota..."></textarea>
                <select id="notaCategoria">
                    <option value="">Sem categoria</option>
                    <option value="Pessoal">👤 Pessoal</option>
                    <option value="Trabalho">💼 Trabalho</option>
                    <option value="Estudos">📚 Estudos</option>
                    <option value="Ideias">💡 Ideias</option>
                    <option value="Tarefas">✓ Tarefas</option>
                </select>
                <div class="modal-botoes">
                    <button class="btn-salvar" onclick="salvarNota()">💾 Salvar</button>
                    <button class="btn-cancelar" onclick="fecharModal()">❌ Cancelar</button>
                </div>
            </div>
        </div>
        
        <div id="toast" class="toast"></div>
        
        <script>
            var modoFavoritos = false;
            var notasAtuais = [];
            
            function mostrarToast(mensagem, sucesso) {
                if (sucesso === undefined) sucesso = true;
                var toast = document.getElementById('toast');
                toast.textContent = mensagem;
                toast.style.background = sucesso ? '#4CAF50' : '#f44336';
                toast.style.display = 'block';
                setTimeout(function() {
                    toast.style.display = 'none';
                }, 2000);
            }
            
            function abrirModalNovaNota() {
                document.getElementById('modalTitulo').textContent = 'Nova Nota';
                document.getElementById('notaId').value = '';
                document.getElementById('notaTitulo').value = '';
                document.getElementById('notaConteudo').value = '';
                document.getElementById('notaCategoria').value = '';
                document.getElementById('modal').style.display = 'flex';
            }
            
            function editarNota(id) {
                fetch('/nota/' + id)
                    .then(function(res) { return res.json(); })
                    .then(function(nota) {
                        document.getElementById('modalTitulo').textContent = 'Editar Nota';
                        document.getElementById('notaId').value = nota.id;
                        document.getElementById('notaTitulo').value = nota.titulo || '';
                        document.getElementById('notaConteudo').value = nota.conteudo || '';
                        document.getElementById('notaCategoria').value = nota.categoria || '';
                        document.getElementById('modal').style.display = 'flex';
                    });
            }
            
            function salvarNota() {
                var id = document.getElementById('notaId').value;
                var dados = {
                    titulo: document.getElementById('notaTitulo').value,
                    conteudo: document.getElementById('notaConteudo').value,
                    categoria: document.getElementById('notaCategoria').value
                };
                
                var url = id ? '/nota/' + id : '/nota';
                var method = id ? 'PUT' : 'POST';
                
                fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                })
                .then(function(res) { return res.json(); })
                .then(function(data) {
                    if (data.success) {
                        mostrarToast(id ? 'Nota atualizada!' : 'Nota criada!');
                        fecharModal();
                        location.reload();
                    } else {
                        mostrarToast('Erro: ' + data.error, false);
                    }
                });
            }
            
            function excluirNota(id) {
                if (confirm('Tem certeza que deseja excluir esta nota?')) {
                    fetch('/nota/' + id, { method: 'DELETE' })
                        .then(function(res) { return res.json(); })
                        .then(function(data) {
                            if (data.success) {
                                mostrarToast('Nota excluída!');
                                location.reload();
                            } else {
                                mostrarToast('Erro ao excluir', false);
                            }
                        });
                }
            }
            
            function toggleFavorito(id) {
                fetch('/nota/' + id + '/favorito', { method: 'POST' })
                    .then(function(res) { return res.json(); })
                    .then(function(data) {
                        if (data.success) {
                            location.reload();
                        }
                    });
            }
            
            function togglePesquisa() {
                var box = document.getElementById('pesquisaBox');
                box.style.display = box.style.display === 'none' ? 'flex' : 'none';
                if (box.style.display === 'flex') {
                    document.getElementById('pesquisaInput').focus();
                }
            }
            
            function fecharPesquisa() {
                document.getElementById('pesquisaBox').style.display = 'none';
                document.getElementById('pesquisaInput').value = '';
                carregarTodas();
            }
            
            function pesquisarNotas() {
                var termo = document.getElementById('pesquisaInput').value;
                if (!termo) {
                    carregarTodas();
                    return;
                }
                
                fetch('/pesquisar?q=' + encodeURIComponent(termo))
                    .then(function(res) { return res.json(); })
                    .then(function(notas) {
                        atualizarGrid(notas);
                        mostrarToast('🔍 ' + notas.length + ' notas encontradas');
                    });
            }
            
            function filtrarFavoritos() {
                modoFavoritos = true;
                fetch('/favoritos')
                    .then(function(res) { return res.json(); })
                    .then(function(notas) {
                        atualizarGrid(notas);
                        mostrarToast('⭐ ' + notas.length + ' notas favoritas');
                    });
            }
            
            function carregarTodas() {
                modoFavoritos = false;
                location.reload();
            }
            
            function atualizarGrid(notas) {
                var grid = document.getElementById('notasGrid');
                
                if (notas.length === 0) {
                    grid.innerHTML = '<div class="sem-notas">📝 Nenhuma nota encontrada</div>';
                    return;
                }
                
                var html = '';
                for (var i = 0; i < notas.length; i++) {
                    var nota = notas[i];
                    var favoritoIcon = nota.favorito ? '⭐' : '☆';
                    var conteudoPreview = nota.conteudo ? nota.conteudo.substring(0, 150) + (nota.conteudo.length > 150 ? '...' : '') : 'Clique para adicionar conteúdo...';
                    var tituloDisplay = nota.titulo || 'Sem título';
                    
                    html += '<div class="nota-card">' +
                        '<div class="nota-header">' +
                            '<div class="nota-titulo" onclick="editarNota(' + nota.id + ')">' + tituloDisplay + '</div>' +
                            '<div class="nota-acoes">' +
                                '<button class="btn-favorito" onclick="toggleFavorito(' + nota.id + ')">' + favoritoIcon + '</button>' +
                                '<button onclick="editarNota(' + nota.id + ')">✏️</button>' +
                                '<button onclick="excluirNota(' + nota.id + ')">🗑️</button>' +
                            '</div>' +
                        '</div>' +
                        '<div class="nota-conteudo" onclick="editarNota(' + nota.id + ')">' + conteudoPreview + '</div>' +
                        '<div class="nota-footer">' +
                            '<span>📅 ' + nota.data + '</span>' +
                            (nota.categoria ? '<span>📁 ' + nota.categoria + '</span>' : '') +
                        '</div>' +
                    '</div>';
                }
                grid.innerHTML = html;
            }
            
            function fecharModal() {
                document.getElementById('modal').style.display = 'none';
            }
            
            window.onclick = function(event) {
                if (event.target === document.getElementById('modal')) {
                    fecharModal();
                }
            }
            
            document.getElementById('pesquisaInput').onkeypress = function(e) {
                if (e.key === 'Enter') {
                    pesquisarNotas();
                }
            }
        </script>
    </body>
    </html>
    `);
});

// ========== API ROTAS ==========

// Criar nota
app.post('/nota', function(req, res) {
    var titulo = req.body.titulo;
    var conteudo = req.body.conteudo;
    var categoria = req.body.categoria;
    
    var novaNota = {
        id: Date.now(),
        titulo: titulo || '',
        conteudo: conteudo || '',
        categoria: categoria || '',
        favorito: false,
        data: getDataHora()
    };
    notas.push(novaNota);
    salvarNotas(notas);
    res.json({ success: true });
});

// Buscar nota por ID
app.get('/nota/:id', function(req, res) {
    var id = parseInt(req.params.id);
    var nota = null;
    for (var i = 0; i < notas.length; i++) {
        if (notas[i].id === id) {
            nota = notas[i];
            break;
        }
    }
    res.json(nota || {});
});

// Atualizar nota
app.put('/nota/:id', function(req, res) {
    var id = parseInt(req.params.id);
    var titulo = req.body.titulo;
    var conteudo = req.body.conteudo;
    var categoria = req.body.categoria;
    
    var encontrou = false;
    for (var i = 0; i < notas.length; i++) {
        if (notas[i].id === id) {
            notas[i].titulo = titulo || '';
            notas[i].conteudo = conteudo || '';
            notas[i].categoria = categoria || '';
            notas[i].editada_em = getDataHora();
            encontrou = true;
            break;
        }
    }
    
    if (encontrou) {
        salvarNotas(notas);
        res.json({ success: true });
    } else {
        res.json({ success: false, error: 'Nota não encontrada' });
    }
});

// Deletar nota
app.delete('/nota/:id', function(req, res) {
    var id = parseInt(req.params.id);
    var novasNotas = [];
    for (var i = 0; i < notas.length; i++) {
        if (notas[i].id !== id) {
            novasNotas.push(notas[i]);
        }
    }
    notas = novasNotas;
    salvarNotas(notas);
    res.json({ success: true });
});

// Marcar como favorito
app.post('/nota/:id/favorito', function(req, res) {
    var id = parseInt(req.params.id);
    for (var i = 0; i < notas.length; i++) {
        if (notas[i].id === id) {
            notas[i].favorito = !notas[i].favorito;
            break;
        }
    }
    salvarNotas(notas);
    res.json({ success: true });
});

// Pesquisar notas
app.get('/pesquisar', function(req, res) {
    var termo = req.query.q.toLowerCase();
    var resultados = [];
    for (var i = 0; i < notas.length; i++) {
        var titulo = notas[i].titulo || '';
        var conteudo = notas[i].conteudo || '';
        if (titulo.toLowerCase().indexOf(termo) !== -1 || conteudo.toLowerCase().indexOf(termo) !== -1) {
            resultados.push(notas[i]);
        }
    }
    res.json(resultados);
});

// Listar favoritos
app.get('/favoritos', function(req, res) {
    var favoritos = [];
    for (var i = 0; i < notas.length; i++) {
        if (notas[i].favorito) {
            favoritos.push(notas[i]);
        }
    }
    res.json(favoritos);
});

// Iniciar servidor
var PORTA = 3016;
app.listen(PORTA, function() {
    console.log('========================================');
    console.log('📝 BLOCO DE NOTAS ONLINE');
    console.log('👉 http://localhost:' + PORTA);
    console.log('========================================');
    console.log('');
    console.log('✅ FUNCIONALIDADES:');
    console.log('  ✓ Criar notas com título e conteúdo');
    console.log('  ✓ Editar notas existentes');
    console.log('  ✓ Excluir notas');
    console.log('  ✓ Marcar notas como favoritas');
    console.log('  ✓ Pesquisar notas');
    console.log('  ✓ Filtrar por favoritos');
    console.log('  ✓ Categorias');
    console.log('========================================');
});