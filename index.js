const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const ARQUIVO_PROGRAMAS = path.join(__dirname, 'dados', 'programas.json');
const processos = {};

function carregarProgramas() {
    try {
        if (fs.existsSync(ARQUIVO_PROGRAMAS)) {
            const dados = fs.readFileSync(ARQUIVO_PROGRAMAS, 'utf8');
            return JSON.parse(dados);
        }
        return [];
    } catch (erro) {
        console.error('Erro ao carregar:', erro);
        return [];
    }
}

function salvarProgramas(programas) {
    try {
        fs.writeFileSync(ARQUIVO_PROGRAMAS, JSON.stringify(programas, null, 2));
        return true;
    } catch (erro) {
        console.error('Erro ao salvar:', erro);
        return false;
    }
}

function iniciarPrograma(arquivo, porta, nome) {
    if (processos[porta]) {
        console.log(`${nome} já está rodando na porta ${porta}`);
        return true;
    }
    
    const caminho = path.join(__dirname, 'programas', arquivo);
    
    if (!fs.existsSync(caminho)) {
        console.error(`❌ Arquivo não encontrado: ${caminho}`);
        return false;
    }
    
    console.log(`🚀 Iniciando ${nome} na porta ${porta}...`);
    
    const processo = spawn('node', [caminho], {
        stdio: 'pipe',
        detached: false
    });
    
    processo.stdout.on('data', (data) => {
        console.log(`[${nome}] ${data.toString().trim()}`);
    });
    
    processo.stderr.on('data', (data) => {
        console.error(`[${nome}] ERRO: ${data.toString().trim()}`);
    });
    
    processo.on('close', (code) => {
        console.log(`🛑 ${nome} finalizado (código ${code})`);
        delete processos[porta];
    });
    
    processos[porta] = processo;
    return true;
}

function pararPrograma(porta, nome) {
    if (processos[porta]) {
        console.log(`🛑 Parando ${nome} na porta ${porta}...`);
        processos[porta].kill();
        delete processos[porta];
        return true;
    }
    return false;
}

// Página principal
app.get('/', (req, res) => {
    const programas = carregarProgramas();
    const categoriasUnicas = ['Todas', ...new Set(programas.map(p => p.categoria || 'Geral'))];
    
    let cards = '';
    programas.forEach(p => {
        const rodando = processos[p.porta] ? true : false;
        cards += `
        <div class="card" data-categoria="${p.categoria || 'Geral'}" data-id="${p.id}">
            <div class="icone">${p.icone || '📦'}</div>
            <div class="info">
                <h3>${p.nome}</h3>
                <p>${p.descricao || 'Sem descrição'}</p>
                <div class="detalhes">
                    <span>📁 ${p.arquivo}</span>
                    <span>🌐 Porta ${p.porta}</span>
                    <span class="categoria-badge">📂 ${p.categoria || 'Geral'}</span>
                    <span class="status ${rodando ? 'online' : 'offline'}">${rodando ? '🟢 Online' : '🔴 Offline'}</span>
                </div>
            </div>
            <div class="botoes">
                ${rodando ? `
                    <button onclick="pararPrograma(${p.id}, ${p.porta}, '${p.nome}')" class="btn parar">
                        ⏹ Parar
                    </button>
                ` : `
                    <button onclick="abrirPrograma(${p.id}, '${p.arquivo}', ${p.porta}, '${p.nome}')" class="btn abrir">
                        ▶ Abrir
                    </button>
                `}
                <button onclick="editar(${p.id})" class="btn editar">✏ Editar</button>
                <button onclick="excluir(${p.id})" class="btn excluir">🗑 Excluir</button>
            </div>
        </div>
        `;
    });
    
    // Gerar botões de categoria
    let botoesCategoria = '';
    categoriasUnicas.forEach(cat => {
        const icon = cat === 'Jogos' ? '🎮' : cat === 'Utilidades' ? '🔧' : cat === 'Estudos' ? '📚' : cat === 'Inteligência Artificial' ? '🤖' : cat === 'Todas' ? '📋' : '📦';
        botoesCategoria += `<button class="filtro-btn" onclick="filtrarCategoria('${cat}')">${icon} ${cat}</button>`;
    });
    
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Meus Programas</title>
        <meta charset="utf-8">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                font-family: 'Segoe UI', Arial, sans-serif;
                padding: 20px;
                min-height: 100vh;
            }
            .container { max-width: 1000px; margin: 0 auto; }
            .header {
                background: white;
                border-radius: 20px;
                padding: 30px;
                margin-bottom: 20px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            .header h1 { color: #764ba2; font-size: 2.5em; margin-bottom: 10px; }
            .header p { color: #666; }
            .stats {
                background: white;
                border-radius: 15px;
                padding: 15px;
                margin-bottom: 20px;
                text-align: center;
                font-weight: bold;
                color: #764ba2;
            }
            .filtros {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                margin-bottom: 20px;
                justify-content: center;
            }
            .filtro-btn {
                padding: 8px 20px;
                background: white;
                border: none;
                border-radius: 20px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
            }
            .filtro-btn:hover {
                background: #764ba2;
                color: white;
                transform: scale(1.02);
            }
            .filtro-btn.active {
                background: #764ba2;
                color: white;
            }
            .btn-add {
                background: #4CAF50;
                color: white;
                padding: 12px 30px;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                font-size: 16px;
                margin-bottom: 20px;
                transition: transform 0.2s;
            }
            .btn-add:hover { transform: scale(1.02); }
            .card {
                background: white;
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 15px;
                display: flex;
                gap: 20px;
                align-items: center;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                transition: transform 0.2s;
            }
            .card:hover { transform: translateY(-2px); }
            .card.escondido { display: none; }
            .icone { font-size: 50px; min-width: 60px; text-align: center; }
            .info { flex: 1; }
            .info h3 { color: #764ba2; margin-bottom: 5px; }
            .info p { color: #666; font-size: 14px; margin-bottom: 8px; }
            .detalhes { display: flex; gap: 15px; font-size: 12px; color: #999; flex-wrap: wrap; }
            .categoria-badge {
                background: #e8eaf6;
                padding: 2px 8px;
                border-radius: 12px;
                color: #3949ab;
                font-size: 11px;
            }
            .status { font-weight: bold; }
            .online { color: #4CAF50; }
            .offline { color: #f44336; }
            .botoes { display: flex; gap: 8px; flex-wrap: wrap; }
            .btn {
                padding: 8px 15px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                text-decoration: none;
                font-size: 12px;
                transition: opacity 0.2s;
            }
            .btn:hover { opacity: 0.8; }
            .abrir { background: #2196F3; color: white; }
            .parar { background: #ff9800; color: white; }
            .editar { background: #607D8B; color: white; }
            .excluir { background: #f44336; color: white; }
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
            .modal-content h2 { color: #764ba2; margin-bottom: 20px; }
            .modal-content input, .modal-content textarea, .modal-content select {
                width: 100%;
                padding: 10px;
                margin: 10px 0;
                border: 1px solid #ddd;
                border-radius: 5px;
                font-family: inherit;
            }
            .modal-content button {
                padding: 10px 20px;
                margin-top: 10px;
                margin-right: 10px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            }
            .modal-content button[type="submit"] { background: #4CAF50; color: white; }
            .modal-content button[type="button"] { background: #999; color: white; }
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
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚀 Meus Programas</h1>
                <p>Organize seus programas por categoria</p>
            </div>
            
            <div class="stats" id="stats">Carregando...</div>
            
            <div class="filtros" id="filtros">
                ${botoesCategoria}
            </div>
            
            <button class="btn-add" onclick="abrirModal()">➕ Adicionar Novo Programa</button>
            
            <div id="cards">${cards}</div>
        </div>
        
        <div id="modal" class="modal">
            <div class="modal-content">
                <h2 id="modalTitulo">Adicionar Programa</h2>
                <form id="formPrograma">
                    <input type="hidden" id="id">
                    <input type="text" id="nome" placeholder="Nome do Programa" required>
                    <input type="text" id="arquivo" placeholder="Arquivo (ex: meu-programa.js)" required>
                    <textarea id="descricao" placeholder="Descrição do programa" rows="3"></textarea>
                    <input type="text" id="icone" placeholder="Ícone (emoji)" value="📦">
                    <select id="categoria">
                        <option value="Geral">📦 Geral</option>
                        <option value="Jogos">🎮 Jogos</option>
                        <option value="Utilidades">🔧 Utilidades</option>
                        <option value="Estudos">📚 Estudos</option>
                        <option value="Produtividade">⚡ Produtividade</option>
                        <option value="Entretenimento">🎬 Entretenimento</option>
                        <option value="Inteligência Artificial">🤖 Inteligência Artificial</option>
                    </select>
                    <input type="number" id="porta" placeholder="Porta (ex: 3001, 3002...)" required>
                    <button type="submit">💾 Salvar</button>
                    <button type="button" onclick="fecharModal()">❌ Cancelar</button>
                </form>
            </div>
        </div>
        
        <div id="toast" class="toast"></div>
        
        <script>
            let categoriaAtual = 'Todas';
            
            function filtrarCategoria(categoria) {
                categoriaAtual = categoria;
                
                // Atualizar botões ativos
                document.querySelectorAll('.filtro-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.innerText.includes(categoria)) {
                        btn.classList.add('active');
                    }
                });
                
                // Filtrar cards
                const cards = document.querySelectorAll('.card');
                cards.forEach(card => {
                    const cardCategoria = card.getAttribute('data-categoria');
                    if (categoria === 'Todas' || cardCategoria === categoria) {
                        card.classList.remove('escondido');
                    } else {
                        card.classList.add('escondido');
                    }
                });
            }
            
            async function abrirPrograma(id, arquivo, porta, nome) {
                const toast = document.getElementById('toast');
                toast.style.display = 'block';
                toast.innerHTML = '🚀 Iniciando ' + nome + '...';
                
                try {
                    const response = await fetch('/abrir', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, arquivo, porta, nome })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        toast.innerHTML = '✅ ' + nome + ' iniciado! Abrindo...';
                        setTimeout(() => {
                            window.open('http://localhost:' + porta, '_blank');
                        }, 1000);
                        setTimeout(() => {
                            location.reload();
                        }, 1500);
                    } else {
                        toast.innerHTML = '❌ Erro: ' + data.error;
                    }
                } catch (erro) {
                    toast.innerHTML = '❌ Erro ao iniciar: ' + erro.message;
                }
                
                setTimeout(() => {
                    toast.style.display = 'none';
                }, 3000);
            }
            
            async function pararPrograma(id, porta, nome) {
                if (confirm('Tem certeza que deseja parar o programa "' + nome + '"?')) {
                    const toast = document.getElementById('toast');
                    toast.style.display = 'block';
                    toast.innerHTML = '⏹ Parando ' + nome + '...';
                    
                    try {
                        const response = await fetch('/parar', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ porta, nome })
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            toast.innerHTML = '✅ ' + nome + ' parado com sucesso!';
                            setTimeout(() => {
                                location.reload();
                            }, 1000);
                        } else {
                            toast.innerHTML = '❌ Erro ao parar: ' + data.error;
                        }
                    } catch (erro) {
                        toast.innerHTML = '❌ Erro ao parar: ' + erro.message;
                    }
                    
                    setTimeout(() => {
                        toast.style.display = 'none';
                    }, 3000);
                }
            }
            
            async function editar(id) {
                const response = await fetch('/programas/' + id);
                const p = await response.json();
                document.getElementById('id').value = p.id;
                document.getElementById('nome').value = p.nome;
                document.getElementById('arquivo').value = p.arquivo;
                document.getElementById('descricao').value = p.descricao || '';
                document.getElementById('icone').value = p.icone || '📦';
                document.getElementById('categoria').value = p.categoria || 'Geral';
                document.getElementById('porta').value = p.porta;
                document.getElementById('modalTitulo').innerText = 'Editar Programa';
                document.getElementById('modal').style.display = 'flex';
            }
            
            async function excluir(id) {
                if (confirm('Tem certeza que deseja excluir este programa?')) {
                    await fetch('/programas/' + id, { method: 'DELETE' });
                    location.reload();
                }
            }
            
            function abrirModal() {
                document.getElementById('formPrograma').reset();
                document.getElementById('id').value = '';
                document.getElementById('modalTitulo').innerText = 'Adicionar Programa';
                document.getElementById('modal').style.display = 'flex';
            }
            
            function fecharModal() {
                document.getElementById('modal').style.display = 'none';
            }
            
            document.getElementById('formPrograma').onsubmit = async (e) => {
                e.preventDefault();
                const id = document.getElementById('id').value;
                const dados = {
                    nome: document.getElementById('nome').value,
                    arquivo: document.getElementById('arquivo').value,
                    descricao: document.getElementById('descricao').value,
                    icone: document.getElementById('icone').value,
                    categoria: document.getElementById('categoria').value,
                    porta: parseInt(document.getElementById('porta').value)
                };
                
                const url = id ? '/programas/' + id : '/programas';
                const method = id ? 'PUT' : 'POST';
                
                await fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dados)
                });
                
                fecharModal();
                location.reload();
            };
            
            async function atualizarStats() {
                const response = await fetch('/stats');
                const stats = await response.json();
                document.getElementById('stats').innerHTML = '📊 Total de programas: ' + stats.total + ' | 🟢 Rodando: ' + stats.rodando + ' | 🔴 Parados: ' + stats.parados;
            }
            
            atualizarStats();
            setInterval(atualizarStats, 5000);
        </script>
    </body>
    </html>
    `);
});

// API: Pegar um programa
app.get('/programas/:id', (req, res) => {
    const programas = carregarProgramas();
    const programa = programas.find(p => p.id == req.params.id);
    res.json(programa || {});
});

// API: Listar todos programas
app.get('/programas', (req, res) => {
    const programas = carregarProgramas();
    res.json(programas);
});

// API: Criar programa
app.post('/programas', (req, res) => {
    const programas = carregarProgramas();
    const novoId = programas.length > 0 ? Math.max(...programas.map(p => p.id)) + 1 : 1;
    const novoPrograma = { id: novoId, ...req.body };
    programas.push(novoPrograma);
    salvarProgramas(programas);
    res.json({ success: true });
});

// API: Atualizar programa
app.put('/programas/:id', (req, res) => {
    let programas = carregarProgramas();
    const id = parseInt(req.params.id);
    programas = programas.map(p => p.id === id ? { ...p, ...req.body } : p);
    salvarProgramas(programas);
    res.json({ success: true });
});

// API: Deletar programa
app.delete('/programas/:id', (req, res) => {
    let programas = carregarProgramas();
    const id = parseInt(req.params.id);
    const programa = programas.find(p => p.id === id);
    if (programa && processos[programa.porta]) {
        processos[programa.porta].kill();
        delete processos[programa.porta];
    }
    programas = programas.filter(p => p.id !== id);
    salvarProgramas(programas);
    res.json({ success: true });
});

// API: Abrir programa (inicia se não estiver rodando)
app.post('/abrir', async (req, res) => {
    const { id, arquivo, porta, nome } = req.body;
    
    if (!processos[porta]) {
        const iniciou = iniciarPrograma(arquivo, porta, nome);
        if (!iniciou) {
            return res.json({ success: false, error: 'Não foi possível iniciar o programa' });
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    res.json({ success: true, porta: porta });
});

// API: Parar programa
app.post('/parar', (req, res) => {
    const { porta, nome } = req.body;
    const parou = pararPrograma(porta, nome);
    res.json({ success: parou, error: parou ? null : 'Programa não estava rodando' });
});

// API: Estatísticas
app.get('/stats', (req, res) => {
    const programas = carregarProgramas();
    const rodando = programas.filter(p => processos[p.porta]).length;
    res.json({
        total: programas.length,
        rodando: rodando,
        parados: programas.length - rodando
    });
});

// Iniciar servidor do launcher
app.listen(3000, () => {
    console.log('========================================');
    console.log('🚀 LAUNCHER COM CATEGORIAS RODANDO!');
    console.log('👉 http://localhost:3000');
    console.log('========================================');
    console.log('');
    console.log('COMO FUNCIONA:');
    console.log('1. Cadastre seus programas com categoria');
    console.log('2. Clique nos botões para filtrar por categoria');
    console.log('3. Clique em "Abrir" para iniciar o programa');
    console.log('4. Clique em "Parar" para finalizar o programa');
    console.log('========================================');
    console.log('');
    console.log('CATEGORIAS DISPONÍVEIS:');
    console.log('   📦 Geral');
    console.log('   🎮 Jogos');
    console.log('   🔧 Utilidades');
    console.log('   📚 Estudos');
    console.log('   ⚡ Produtividade');
    console.log('   🎬 Entretenimento');
    console.log('   🤖 Inteligência Artificial');
    console.log('========================================');
});