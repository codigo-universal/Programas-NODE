const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const ARQUIVO_TAREFAS = path.join(__dirname, '..', 'dados', 'tarefas.json');

// ========== FUNÇÕES ==========
function carregarTarefas() {
    try {
        if (fs.existsSync(ARQUIVO_TAREFAS)) {
            const dados = fs.readFileSync(ARQUIVO_TAREFAS, 'utf8');
            return JSON.parse(dados);
        }
        return [];
    } catch (erro) {
        console.error('Erro ao carregar:', erro);
        return [];
    }
}

function salvarTarefas(tarefas) {
    try {
        fs.writeFileSync(ARQUIVO_TAREFAS, JSON.stringify(tarefas, null, 2));
        return true;
    } catch (erro) {
        console.error('Erro ao salvar:', erro);
        return false;
    }
}

function getDataHora() {
    const agora = new Date();
    const dia = agora.getDate().toString().padStart(2, '0');
    const mes = (agora.getMonth() + 1).toString().padStart(2, '0');
    const ano = agora.getFullYear();
    const horas = agora.getHours().toString().padStart(2, '0');
    const minutos = agora.getMinutes().toString().padStart(2, '0');
    return `${dia}/${mes}/${ano} ${horas}:${minutos}`;
}

// ========== PÁGINA PRINCIPAL ==========
app.get('/', (req, res) => {
    let tarefas = carregarTarefas();
    
    // Separar tarefas pendentes e concluídas
    const pendentes = tarefas.filter(t => !t.concluida);
    const concluidas = tarefas.filter(t => t.concluida);
    
    // Ordenar pendentes por prioridade
    const prioridadeValor = { 'alta': 1, 'media': 2, 'baixa': 3 };
    pendentes.sort((a, b) => prioridadeValor[a.prioridade] - prioridadeValor[b.prioridade]);
    
    // Montar HTML das tarefas pendentes
    let pendentesHTML = '';
    pendentes.forEach(t => {
        const prioridadeIcon = t.prioridade === 'alta' ? '🔴' : (t.prioridade === 'media' ? '🟠' : '🟢');
        const prioridadeCor = t.prioridade === 'alta' ? '#f44336' : (t.prioridade === 'media' ? '#ff9800' : '#4CAF50');
        
        pendentesHTML += `
            <div class="tarefa-card" data-id="${t.id}">
                <div class="tarefa-status" onclick="toggleTarefa(${t.id})">⭕</div>
                <div class="tarefa-conteudo">
                    <div class="tarefa-titulo">${t.nome}</div>
                    <div class="tarefa-detalhes">
                        <span class="prioridade" style="background: ${prioridadeCor}">${prioridadeIcon} ${t.prioridade.toUpperCase()}</span>
                        <span class="data">📅 ${t.criada_em}</span>
                        ${t.categoria ? `<span class="categoria">📁 ${t.categoria}</span>` : ''}
                    </div>
                </div>
                <div class="tarefa-acoes">
                    <button onclick="editarTarefa(${t.id})" class="btn-editar">✏️</button>
                    <button onclick="excluirTarefa(${t.id})" class="btn-excluir">🗑️</button>
                </div>
            </div>
        `;
    });
    
    // Montar HTML das tarefas concluídas
    let concluidasHTML = '';
    concluidas.forEach(t => {
        concluidasHTML += `
            <div class="tarefa-card concluida" data-id="${t.id}">
                <div class="tarefa-status" onclick="toggleTarefa(${t.id})">✅</div>
                <div class="tarefa-conteudo">
                    <div class="tarefa-titulo" style="text-decoration: line-through; color: #999;">${t.nome}</div>
                    <div class="tarefa-detalhes">
                        <span class="data">✅ Concluída: ${t.concluida_em}</span>
                    </div>
                </div>
                <div class="tarefa-acoes">
                    <button onclick="excluirTarefa(${t.id})" class="btn-excluir">🗑️</button>
                </div>
            </div>
        `;
    });
    
    // Estatísticas
    const total = tarefas.length;
    const pendentesCount = pendentes.length;
    const concluidasCount = concluidas.length;
    const altaPrioridade = pendentes.filter(t => t.prioridade === 'alta').length;
    
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Lista de Tarefas Completa</title>
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
                padding: 20px;
                min-height: 100vh;
            }
            
            .container {
                max-width: 900px;
                margin: 0 auto;
            }
            
            .header {
                background: white;
                border-radius: 20px;
                padding: 30px;
                margin-bottom: 20px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            
            .header h1 {
                color: #764ba2;
                font-size: 2.5em;
                margin-bottom: 10px;
            }
            
            .stats {
                background: white;
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 20px;
                display: flex;
                justify-content: space-around;
                text-align: center;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            
            .stat-item {
                text-align: center;
            }
            
            .stat-numero {
                font-size: 2em;
                font-weight: bold;
                color: #764ba2;
            }
            
            .stat-label {
                font-size: 12px;
                color: #999;
                margin-top: 5px;
            }
            
            .form-container {
                background: white;
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            
            .form-group {
                display: flex;
                gap: 10px;
                margin-bottom: 10px;
                flex-wrap: wrap;
            }
            
            .form-group input, .form-group select {
                flex: 1;
                padding: 12px;
                border: 2px solid #ddd;
                border-radius: 10px;
                font-size: 14px;
            }
            
            .form-group button {
                padding: 12px 30px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                font-size: 14px;
            }
            
            .categorias {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            
            .cat-btn {
                padding: 8px 15px;
                background: #e0e0e0;
                border: none;
                border-radius: 20px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .cat-btn.active {
                background: #764ba2;
                color: white;
            }
            
            .secao {
                background: white;
                border-radius: 15px;
                margin-bottom: 20px;
                overflow: hidden;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            
            .secao-titulo {
                background: #764ba2;
                color: white;
                padding: 15px 20px;
                font-weight: bold;
            }
            
            .tarefa-card {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 15px 20px;
                border-bottom: 1px solid #eee;
                transition: background 0.2s;
            }
            
            .tarefa-card:hover {
                background: #f8f9fa;
            }
            
            .tarefa-card.concluida {
                opacity: 0.7;
            }
            
            .tarefa-status {
                font-size: 24px;
                cursor: pointer;
            }
            
            .tarefa-conteudo {
                flex: 1;
            }
            
            .tarefa-titulo {
                font-size: 16px;
                margin-bottom: 5px;
            }
            
            .tarefa-detalhes {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                font-size: 11px;
            }
            
            .prioridade, .data, .categoria {
                padding: 2px 8px;
                border-radius: 10px;
                color: white;
            }
            
            .prioridade {
                background: #4CAF50;
            }
            
            .data, .categoria {
                background: #e0e0e0;
                color: #666;
            }
            
            .tarefa-acoes {
                display: flex;
                gap: 5px;
            }
            
            .btn-editar, .btn-excluir {
                padding: 5px 10px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .btn-editar {
                background: #2196F3;
                color: white;
            }
            
            .btn-excluir {
                background: #f44336;
                color: white;
            }
            
            .vazio {
                text-align: center;
                padding: 40px;
                color: #999;
            }
            
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
                padding: 30px;
                border-radius: 20px;
                width: 450px;
                max-width: 90%;
            }
            
            .modal-content h2 {
                color: #764ba2;
                margin-bottom: 20px;
            }
            
            .modal-content input, .modal-content select {
                width: 100%;
                padding: 10px;
                margin: 10px 0;
                border: 1px solid #ddd;
                border-radius: 5px;
            }
            
            .modal-content button {
                padding: 10px 20px;
                margin-top: 10px;
                margin-right: 10px;
                border: none;
                border-radius: 5px;
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
            
            .acoes-rapidas {
                display: flex;
                gap: 10px;
                margin-top: 10px;
            }
            
            .btn-acao {
                padding: 8px 15px;
                background: #607D8B;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📝 Lista de Tarefas Completa</h1>
                <p>Organize suas tarefas com prioridades, categorias e datas</p>
            </div>
            
            <div class="stats">
                <div class="stat-item">
                    <div class="stat-numero">${total}</div>
                    <div class="stat-label">Total</div>
                </div>
                <div class="stat-item">
                    <div class="stat-numero">${pendentesCount}</div>
                    <div class="stat-label">Pendentes</div>
                </div>
                <div class="stat-item">
                    <div class="stat-numero">${concluidasCount}</div>
                    <div class="stat-label">Concluídas</div>
                </div>
                <div class="stat-item">
                    <div class="stat-numero">${altaPrioridade}</div>
                    <div class="stat-label">Alta Prioridade</div>
                </div>
            </div>
            
            <div class="form-container">
                <form id="formTarefa">
                    <div class="form-group">
                        <input type="text" id="nome" placeholder="Digite sua tarefa..." required>
                    </div>
                    <div class="form-group">
                        <select id="prioridade">
                            <option value="baixa">🟢 Baixa</option>
                            <option value="media" selected>🟠 Média</option>
                            <option value="alta">🔴 Alta</option>
                        </select>
                        <select id="categoria">
                            <option value="">Sem categoria</option>
                            <option value="Trabalho">💼 Trabalho</option>
                            <option value="Estudos">📚 Estudos</option>
                            <option value="Casa">🏠 Casa</option>
                            <option value="Pessoal">💝 Pessoal</option>
                            <option value="Saúde">🏥 Saúde</option>
                        </select>
                        <button type="submit">➕ Adicionar</button>
                    </div>
                </form>
            </div>
            
            <div class="secao">
                <div class="secao-titulo">📋 Pendentes (${pendentesCount})</div>
                <div id="pendentes">
                    ${pendentesHTML || '<div class="vazio">🎉 Nenhuma tarefa pendente! Parabéns!</div>'}
                </div>
            </div>
            
            ${concluidas.length > 0 ? `
            <div class="secao">
                <div class="secao-titulo">✅ Concluídas (${concluidas.length})</div>
                <div id="concluidas">
                    ${concluidasHTML}
                </div>
            </div>
            ` : ''}
            
            <div class="acoes-rapidas">
                <button onclick="excluirConcluidas()" class="btn-acao">🗑️ Excluir todas concluídas</button>
                <button onclick="location.reload()" class="btn-acao">🔄 Atualizar</button>
            </div>
        </div>
        
        <div id="modal" class="modal">
            <div class="modal-content">
                <h2 id="modalTitulo">Editar Tarefa</h2>
                <form id="modalForm">
                    <input type="hidden" id="editId">
                    <input type="text" id="editNome" placeholder="Nome da tarefa" required>
                    <select id="editPrioridade">
                        <option value="baixa">🟢 Baixa</option>
                        <option value="media">🟠 Média</option>
                        <option value="alta">🔴 Alta</option>
                    </select>
                    <select id="editCategoria">
                        <option value="">Sem categoria</option>
                        <option value="Trabalho">💼 Trabalho</option>
                        <option value="Estudos">📚 Estudos</option>
                        <option value="Casa">🏠 Casa</option>
                        <option value="Pessoal">💝 Pessoal</option>
                        <option value="Saúde">🏥 Saúde</option>
                    </select>
                    <button type="submit" class="btn-salvar">💾 Salvar</button>
                    <button type="button" class="btn-cancelar" onclick="fecharModal()">❌ Cancelar</button>
                </form>
            </div>
        </div>
        
        <script>
            // Adicionar tarefa
            document.getElementById('formTarefa').onsubmit = async (e) => {
                e.preventDefault();
                const nome = document.getElementById('nome').value;
                const prioridade = document.getElementById('prioridade').value;
                const categoria = document.getElementById('categoria').value;
                
                await fetch('/tarefas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, prioridade, categoria })
                });
                
                location.reload();
            };
            
            // Alternar concluída
            async function toggleTarefa(id) {
                await fetch('/tarefas/' + id + '/toggle', { method: 'POST' });
                location.reload();
            }
            
            // Editar tarefa
            async function editarTarefa(id) {
                const response = await fetch('/tarefas/' + id);
                const tarefa = await response.json();
                
                document.getElementById('editId').value = tarefa.id;
                document.getElementById('editNome').value = tarefa.nome;
                document.getElementById('editPrioridade').value = tarefa.prioridade;
                document.getElementById('editCategoria').value = tarefa.categoria || '';
                document.getElementById('modalTitulo').innerText = '✏️ Editar Tarefa';
                document.getElementById('modal').style.display = 'flex';
            }
            
            // Excluir tarefa
            async function excluirTarefa(id) {
                if (confirm('Tem certeza?')) {
                    await fetch('/tarefas/' + id, { method: 'DELETE' });
                    location.reload();
                }
            }
            
            // Excluir todas concluídas
            async function excluirConcluidas() {
                if (confirm('Excluir todas as tarefas concluídas?')) {
                    await fetch('/tarefas/concluidas', { method: 'DELETE' });
                    location.reload();
                }
            }
            
            // Fechar modal
            function fecharModal() {
                document.getElementById('modal').style.display = 'none';
            }
            
            // Salvar edição
            document.getElementById('modalForm').onsubmit = async (e) => {
                e.preventDefault();
                const id = document.getElementById('editId').value;
                const dados = {
                    nome: document.getElementById('editNome').value,
                    prioridade: document.getElementById('editPrioridade').value,
                    categoria: document.getElementById('editCategoria').value
                };
                
                await fetch('/tarefas/' + id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                });
                
                fecharModal();
                location.reload();
            };
        </script>
    </body>
    </html>
    `);
});

// ========== API ==========

// Criar tarefa
app.post('/tarefas', (req, res) => {
    const tarefas = carregarTarefas();
    const novoId = tarefas.length > 0 ? Math.max(...tarefas.map(t => t.id)) + 1 : 1;
    
    const novaTarefa = {
        id: novoId,
        nome: req.body.nome,
        prioridade: req.body.prioridade || 'media',
        categoria: req.body.categoria || '',
        concluida: false,
        criada_em: getDataHora(),
        concluida_em: null
    };
    
    tarefas.push(novaTarefa);
    salvarTarefas(tarefas);
    res.json({ success: true });
});

// Buscar tarefa
app.get('/tarefas/:id', (req, res) => {
    const tarefas = carregarTarefas();
    const tarefa = tarefas.find(t => t.id == req.params.id);
    res.json(tarefa || {});
});

// Atualizar tarefa
app.put('/tarefas/:id', (req, res) => {
    let tarefas = carregarTarefas();
    const id = parseInt(req.params.id);
    
    tarefas = tarefas.map(t => t.id === id ? {
        ...t,
        nome: req.body.nome,
        prioridade: req.body.prioridade,
        categoria: req.body.categoria
    } : t);
    
    salvarTarefas(tarefas);
    res.json({ success: true });
});

// Alternar concluída
app.post('/tarefas/:id/toggle', (req, res) => {
    let tarefas = carregarTarefas();
    const id = parseInt(req.params.id);
    
    tarefas = tarefas.map(t => t.id === id ? {
        ...t,
        concluida: !t.concluida,
        concluida_em: !t.concluida ? getDataHora() : null
    } : t);
    
    salvarTarefas(tarefas);
    res.json({ success: true });
});

// Deletar tarefa
app.delete('/tarefas/:id', (req, res) => {
    let tarefas = carregarTarefas();
    const id = parseInt(req.params.id);
    tarefas = tarefas.filter(t => t.id !== id);
    salvarTarefas(tarefas);
    res.json({ success: true });
});

// Deletar todas concluídas
app.delete('/tarefas/concluidas', (req, res) => {
    let tarefas = carregarTarefas();
    tarefas = tarefas.filter(t => !t.concluida);
    salvarTarefas(tarefas);
    res.json({ success: true });
});

// Iniciar servidor
const PORTA = 3006;
app.listen(PORTA, () => {
    console.log('========================================');
    console.log('📝 LISTA DE TAREFAS COMPLETA');
    console.log(`👉 http://localhost:${PORTA}`);
    console.log('========================================');
    console.log('Funcionalidades:');
    console.log('✓ Prioridades (Alta/Média/Baixa)');
    console.log('✓ Categorias (Trabalho/Estudos/Casa...)');
    console.log('✓ Data de criação e conclusão');
    console.log('✓ Editar tarefas');
    console.log('✓ Excluir tarefas');
    console.log('✓ Excluir todas concluídas');
    console.log('✓ Salvamento automático');
    console.log('========================================');
});