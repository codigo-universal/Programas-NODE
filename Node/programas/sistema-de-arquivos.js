const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Criar pasta temporária para upload se não existir
const TEMP_DIR = path.join(__dirname, '..', 'uploads-temp');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const upload = multer({ dest: TEMP_DIR });

// Diretório base (a pasta Node)
const DIRETORIO_BASE = path.resolve(__dirname, '..');

console.log('========================================');
console.log('📁 DIRETÓRIO BASE:', DIRETORIO_BASE);
console.log('========================================');

// ========== FUNÇÕES ==========
function getTamanhoArquivo(caminho) {
    try {
        const stats = fs.statSync(caminho);
        if (stats.isFile()) {
            const bytes = stats.size;
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        }
        return '';
    } catch {
        return '';
    }
}

function getIconeArquivo(nome, isDir) {
    if (isDir) return '📁';
    const ext = path.extname(nome).toLowerCase();
    const icones = {
        '.js': '📜', '.json': '🔧', '.html': '🌐', '.css': '🎨',
        '.jpg': '🖼️', '.jpeg': '🖼️', '.png': '🖼️', '.gif': '🖼️',
        '.pdf': '📄', '.txt': '📝', '.md': '📝', '.exe': '⚙️',
        '.zip': '📦', '.rar': '📦', '.mp3': '🎵', '.mp4': '🎬'
    };
    return icones[ext] || '📄';
}

function lerDiretorio(caminho) {
    try {
        const itens = fs.readdirSync(caminho);
        const arquivos = [];
        const pastas = [];
        
        itens.forEach(item => {
            // Pular pastas temporárias
            if (item === 'uploads-temp') return;
            
            const caminhoCompleto = path.join(caminho, item);
            try {
                const stats = fs.statSync(caminhoCompleto);
                if (stats.isDirectory()) {
                    pastas.push({
                        nome: item,
                        caminho: caminhoCompleto,
                        isDir: true,
                        icone: '📁',
                        tamanho: '',
                        modificado: stats.mtime.toLocaleString('pt-BR')
                    });
                } else {
                    arquivos.push({
                        nome: item,
                        caminho: caminhoCompleto,
                        isDir: false,
                        icone: getIconeArquivo(item, false),
                        tamanho: getTamanhoArquivo(caminhoCompleto),
                        modificado: stats.mtime.toLocaleString('pt-BR')
                    });
                }
            } catch (err) {
                console.error(`Erro ao ler ${item}:`, err.message);
            }
        });
        
        // Ordenar: pastas primeiro, depois arquivos
        pastas.sort((a, b) => a.nome.localeCompare(b.nome));
        arquivos.sort((a, b) => a.nome.localeCompare(b.nome));
        
        return [...pastas, ...arquivos];
    } catch (erro) {
        console.error('Erro ao ler diretório:', erro);
        return [];
    }
}

// ========== PÁGINA PRINCIPAL ==========
app.get('/', (req, res) => {
    let diretorioAtual = req.query.path || DIRETORIO_BASE;
    // Garantir que o caminho é absoluto e resolve as barras
    diretorioAtual = path.resolve(diretorioAtual);
    
    // Segurança: não permitir sair do diretório base
    if (!diretorioAtual.startsWith(DIRETORIO_BASE)) {
        diretorioAtual = DIRETORIO_BASE;
    }
    
    const itens = lerDiretorio(diretorioAtual);
    const pai = path.dirname(diretorioAtual);
    const mostraPai = diretorioAtual !== DIRETORIO_BASE;
    
    // Breadcrumb
    const breadcrumb = [];
    const relativo = path.relative(DIRETORIO_BASE, diretorioAtual);
    const partes = relativo === '' ? [] : relativo.split(path.sep);
    
    breadcrumb.push({ nome: '📁 Raiz', caminho: DIRETORIO_BASE });
    
    let acumulado = DIRETORIO_BASE;
    for (let i = 0; i < partes.length; i++) {
        if (partes[i]) {
            acumulado = path.join(acumulado, partes[i]);
            breadcrumb.push({ nome: partes[i], caminho: acumulado });
        }
    }
    
    let itensHTML = '';
    itens.forEach(item => {
        // Escapar aspas para evitar erro no JavaScript
        const caminhoEscapado = encodeURIComponent(item.caminho);
        const nomeEscapado = item.nome.replace(/'/g, "\\'");
        
        if (item.isDir) {
            itensHTML += `
            <div class="item">
                <div class="item-icone">${item.icone}</div>
                <a href="/?path=${caminhoEscapado}" class="item-nome-link">${item.nome}</a>
                <div class="item-tamanho">${item.tamanho}</div>
                <div class="item-data">${item.modificado}</div>
                <div class="item-acoes">
                    <button class="btn-renomear" onclick="renomear('${item.caminho.replace(/\\/g, '\\\\')}', '${nomeEscapado}')">✏️</button>
                    <button class="btn-excluir" onclick="excluir('${item.caminho.replace(/\\/g, '\\\\')}', '${nomeEscapado}')">🗑️</button>
                </div>
            </div>
            `;
        } else {
            itensHTML += `
            <div class="item">
                <div class="item-icone">${item.icone}</div>
                <div class="item-nome-arquivo">${item.nome}</div>
                <div class="item-tamanho">${item.tamanho}</div>
                <div class="item-data">${item.modificado}</div>
                <div class="item-acoes">
                    <button class="btn-ver" onclick="verArquivo('${item.caminho.replace(/\\/g, '\\\\')}')">👁️ Ver</button>
                    <button class="btn-renomear" onclick="renomear('${item.caminho.replace(/\\/g, '\\\\')}', '${nomeEscapado}')">✏️</button>
                    <button class="btn-excluir" onclick="excluir('${item.caminho.replace(/\\/g, '\\\\')}', '${nomeEscapado}')">🗑️</button>
                </div>
            </div>
            `;
        }
    });
    
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>File Manager - Gerenciador de Arquivos</title>
        <meta charset="utf-8">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                font-family: 'Segoe UI', Arial, sans-serif;
                min-height: 100vh;
                padding: 20px;
            }
            
            .container {
                max-width: 1400px;
                margin: 0 auto;
            }
            
            .header {
                background: white;
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            }
            
            .header h1 {
                color: #764ba2;
                margin-bottom: 10px;
            }
            
            .breadcrumb {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                margin: 15px 0;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 10px;
            }
            
            .breadcrumb-item {
                cursor: pointer;
                color: #764ba2;
                text-decoration: none;
            }
            
            .breadcrumb-item:hover {
                text-decoration: underline;
            }
            
            .actions {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }
            
            .btn {
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
                transition: transform 0.2s;
            }
            
            .btn:hover {
                transform: scale(1.02);
            }
            
            .btn-criar-pasta {
                background: #4CAF50;
                color: white;
            }
            
            .btn-criar-arquivo {
                background: #2196F3;
                color: white;
            }
            
            .btn-upload {
                background: #ff9800;
                color: white;
            }
            
            .items-header {
                display: grid;
                grid-template-columns: 60px 3fr 100px 150px 120px;
                background: #764ba2;
                color: white;
                padding: 10px;
                border-radius: 10px 10px 0 0;
                font-weight: bold;
            }
            
            .items-list {
                background: white;
                border-radius: 0 0 10px 10px;
                max-height: 500px;
                overflow-y: auto;
            }
            
            .item {
                display: grid;
                grid-template-columns: 60px 3fr 100px 150px 120px;
                padding: 10px;
                border-bottom: 1px solid #eee;
                align-items: center;
                transition: background 0.2s;
            }
            
            .item:hover {
                background: #f8f9fa;
            }
            
            .item-icone {
                font-size: 24px;
                text-align: center;
            }
            
            .item-nome-link {
                color: #764ba2;
                text-decoration: none;
                font-weight: 500;
                cursor: pointer;
            }
            
            .item-nome-link:hover {
                text-decoration: underline;
            }
            
            .item-nome-arquivo {
                color: #333;
                word-break: break-word;
            }
            
            .item-tamanho, .item-data {
                font-size: 12px;
                color: #666;
            }
            
            .item-acoes {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            
            .btn-ver, .btn-renomear, .btn-excluir {
                padding: 5px 10px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .btn-ver {
                background: #2196F3;
                color: white;
            }
            
            .btn-renomear {
                background: #ff9800;
                color: white;
            }
            
            .btn-excluir {
                background: #f44336;
                color: white;
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
                padding: 25px;
                border-radius: 15px;
                width: 500px;
                max-width: 90%;
            }
            
            .modal-content h3 {
                color: #764ba2;
                margin-bottom: 15px;
            }
            
            .modal-content input, .modal-content textarea {
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
            
            .modal-content button:first-of-type {
                background: #4CAF50;
                color: white;
            }
            
            .modal-content button:last-of-type {
                background: #999;
                color: white;
            }
            
            .file-content {
                background: #2d2d2d;
                color: #f8f8f2;
                padding: 15px;
                border-radius: 8px;
                font-family: monospace;
                white-space: pre-wrap;
                word-wrap: break-word;
                max-height: 400px;
                overflow: auto;
            }
            
            .vazio {
                text-align: center;
                padding: 40px;
                color: #999;
            }
            
            footer {
                text-align: center;
                margin-top: 20px;
                color: white;
                opacity: 0.7;
                font-size: 12px;
            }
            
            .status {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #333;
                color: white;
                padding: 10px 20px;
                border-radius: 8px;
                display: none;
                z-index: 1000;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📁 File Manager - Gerenciador de Arquivos</h1>
                <p>Navegue, crie, edite e gerencie seus arquivos</p>
                
                <div class="breadcrumb">
                    ${breadcrumb.map((b, i) => `
                        <span>
                            ${i > 0 ? ' / ' : ''}
                            <a href="/?path=${encodeURIComponent(b.caminho)}" class="breadcrumb-item">${b.nome}</a>
                        </span>
                    `).join('')}
                </div>
                
                <div class="actions">
                    <button class="btn btn-criar-pasta" onclick="criarPasta()">📁 Criar Pasta</button>
                    <button class="btn btn-criar-arquivo" onclick="criarArquivo()">📄 Criar Arquivo</button>
                    <button class="btn btn-upload" onclick="abrirUpload()">📤 Upload Arquivo</button>
                </div>
            </div>
            
            <div class="items-header">
                <div>📦</div>
                <div>Nome</div>
                <div>Tamanho</div>
                <div>Modificado</div>
                <div>Ações</div>
            </div>
            
            <div class="items-list">
                ${mostraPai ? `
                <div class="item">
                    <div class="item-icone">📂</div>
                    <a href="/?path=${encodeURIComponent(pai)}" class="item-nome-link">.. (Pasta anterior)</a>
                    <div class="item-tamanho"></div>
                    <div class="item-data"></div>
                    <div class="item-acoes"></div>
                </div>
                ` : ''}
                ${itensHTML || '<div class="vazio">📂 Pasta vazia</div>'}
            </div>
            
            <footer>
                💡 Dica: Clique no nome da pasta para entrar | Clique em "Ver" para visualizar arquivos
            </footer>
        </div>
        
        <div id="status" class="status"></div>
        
        <!-- Modal Criar Pasta -->
        <div id="modalPasta" class="modal">
            <div class="modal-content">
                <h3>📁 Criar Nova Pasta</h3>
                <input type="text" id="pastaNome" placeholder="Nome da pasta">
                <button onclick="confirmarCriarPasta()">Criar</button>
                <button onclick="fecharModal('modalPasta')">Cancelar</button>
            </div>
        </div>
        
        <!-- Modal Criar Arquivo -->
        <div id="modalArquivo" class="modal">
            <div class="modal-content">
                <h3>📄 Criar Novo Arquivo</h3>
                <input type="text" id="arquivoNome" placeholder="Nome do arquivo (ex: teste.txt)">
                <textarea id="arquivoConteudo" rows="10" placeholder="Conteúdo do arquivo..."></textarea>
                <button onclick="confirmarCriarArquivo()">Criar</button>
                <button onclick="fecharModal('modalArquivo')">Cancelar</button>
            </div>
        </div>
        
        <!-- Modal Upload -->
        <div id="modalUpload" class="modal">
            <div class="modal-content">
                <h3>📤 Upload de Arquivo</h3>
                <input type="file" id="uploadArquivo">
                <button onclick="confirmarUpload()">Enviar</button>
                <button onclick="fecharModal('modalUpload')">Cancelar</button>
            </div>
        </div>
        
        <!-- Modal Ver Arquivo -->
        <div id="modalVer" class="modal">
            <div class="modal-content" style="width: 700px;">
                <h3 id="verTitulo">Conteúdo do Arquivo</h3>
                <div id="verConteudo" class="file-content"></div>
                <button onclick="fecharModal('modalVer')">Fechar</button>
            </div>
        </div>
        
        <script>
            let caminhoAtual = '${diretorioAtual.replace(/\\/g, '\\\\')}';
            
            function mostrarStatus(msg, isErro) {
                const statusDiv = document.getElementById('status');
                statusDiv.textContent = msg;
                statusDiv.style.background = isErro ? '#f44336' : '#4CAF50';
                statusDiv.style.display = 'block';
                setTimeout(() => {
                    statusDiv.style.display = 'none';
                }, 3000);
            }
            
            function criarPasta() {
                document.getElementById('modalPasta').style.display = 'flex';
            }
            
            function confirmarCriarPasta() {
                const nome = document.getElementById('pastaNome').value;
                if (!nome) {
                    alert('Digite um nome para a pasta');
                    return;
                }
                
                fetch('/criar-pasta', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ caminho: caminhoAtual, nome: nome })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        mostrarStatus('✅ Pasta criada com sucesso!', false);
                        setTimeout(() => location.reload(), 1000);
                    } else {
                        mostrarStatus('❌ Erro: ' + data.error, true);
                    }
                });
            }
            
            function criarArquivo() {
                document.getElementById('modalArquivo').style.display = 'flex';
            }
            
            function confirmarCriarArquivo() {
                const nome = document.getElementById('arquivoNome').value;
                const conteudo = document.getElementById('arquivoConteudo').value;
                
                if (!nome) {
                    alert('Digite um nome para o arquivo');
                    return;
                }
                
                fetch('/criar-arquivo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ caminho: caminhoAtual, nome: nome, conteudo: conteudo })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        mostrarStatus('✅ Arquivo criado com sucesso!', false);
                        setTimeout(() => location.reload(), 1000);
                    } else {
                        mostrarStatus('❌ Erro: ' + data.error, true);
                    }
                });
            }
            
            function abrirUpload() {
                document.getElementById('modalUpload').style.display = 'flex';
            }
            
            function confirmarUpload() {
                const fileInput = document.getElementById('uploadArquivo');
                const file = fileInput.files[0];
                
                if (!file) {
                    alert('Selecione um arquivo');
                    return;
                }
                
                const formData = new FormData();
                formData.append('arquivo', file);
                formData.append('caminho', caminhoAtual);
                
                fetch('/upload', {
                    method: 'POST',
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        mostrarStatus('✅ Arquivo enviado com sucesso!', false);
                        setTimeout(() => location.reload(), 1000);
                    } else {
                        mostrarStatus('❌ Erro: ' + data.error, true);
                    }
                });
            }
            
            function verArquivo(caminho) {
                fetch('/ler-arquivo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ caminho: caminho })
                })
                .then(res => res.json())
                .then(data => {
                    const nomeArquivo = caminho.split(/[\\\\/]/).pop();
                    document.getElementById('verTitulo').textContent = '📄 ' + nomeArquivo;
                    document.getElementById('verConteudo').textContent = data.conteudo || 'Arquivo vazio ou não é texto';
                    document.getElementById('modalVer').style.display = 'flex';
                });
            }
            
            function renomear(caminho, nomeAtual) {
                const novoNome = prompt('Digite o novo nome:', nomeAtual);
                if (novoNome && novoNome !== nomeAtual) {
                    fetch('/renomear', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ caminho: caminho, novoNome: novoNome })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            mostrarStatus('✅ Renomeado com sucesso!', false);
                            setTimeout(() => location.reload(), 1000);
                        } else {
                            mostrarStatus('❌ Erro: ' + data.error, true);
                        }
                    });
                }
            }
            
            function excluir(caminho, nome) {
                if (confirm('Tem certeza que deseja excluir "' + nome + '"?')) {
                    fetch('/excluir', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ caminho: caminho })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            mostrarStatus('✅ Excluído com sucesso!', false);
                            setTimeout(() => location.reload(), 1000);
                        } else {
                            mostrarStatus('❌ Erro: ' + data.error, true);
                        }
                    });
                }
            }
            
            function fecharModal(id) {
                document.getElementById(id).style.display = 'none';
                if (id === 'modalArquivo') {
                    document.getElementById('arquivoNome').value = '';
                    document.getElementById('arquivoConteudo').value = '';
                }
                if (id === 'modalPasta') {
                    document.getElementById('pastaNome').value = '';
                }
                if (id === 'modalUpload') {
                    document.getElementById('uploadArquivo').value = '';
                }
            }
            
            // Fechar modal clicando fora
            window.onclick = function(event) {
                if (event.target.classList.contains('modal')) {
                    event.target.style.display = 'none';
                }
            }
        </script>
    </body>
    </html>
    `);
});

// ========== API ROTAS ==========

// Criar pasta
app.post('/criar-pasta', (req, res) => {
    const { caminho, nome } = req.body;
    const novoCaminho = path.join(caminho, nome);
    
    console.log('📁 Criando pasta:', novoCaminho);
    
    try {
        if (!fs.existsSync(novoCaminho)) {
            fs.mkdirSync(novoCaminho, { recursive: true });
            res.json({ success: true });
        } else {
            res.json({ success: false, error: 'Pasta já existe' });
        }
    } catch (erro) {
        console.error('Erro ao criar pasta:', erro);
        res.json({ success: false, error: erro.message });
    }
});

// Criar arquivo
app.post('/criar-arquivo', (req, res) => {
    const { caminho, nome, conteudo } = req.body;
    const novoCaminho = path.join(caminho, nome);
    
    console.log('📄 Criando arquivo:', novoCaminho);
    
    try {
        fs.writeFileSync(novoCaminho, conteudo || '', 'utf8');
        res.json({ success: true });
    } catch (erro) {
        console.error('Erro ao criar arquivo:', erro);
        res.json({ success: false, error: erro.message });
    }
});

// Upload de arquivo
app.post('/upload', upload.single('arquivo'), (req, res) => {
    const { caminho } = req.body;
    const arquivo = req.file;
    
    if (!arquivo) {
        return res.json({ success: false, error: 'Nenhum arquivo enviado' });
    }
    
    const nomeOriginal = arquivo.originalname;
    const destino = path.join(caminho, nomeOriginal);
    
    console.log('📤 Upload:', nomeOriginal, 'para', destino);
    
    try {
        fs.renameSync(arquivo.path, destino);
        res.json({ success: true });
    } catch (erro) {
        console.error('Erro no upload:', erro);
        res.json({ success: false, error: erro.message });
    }
});

// Ler arquivo
app.post('/ler-arquivo', (req, res) => {
    const { caminho } = req.body;
    
    try {
        const conteudo = fs.readFileSync(caminho, 'utf8');
        res.json({ conteudo: conteudo });
    } catch (erro) {
        res.json({ conteudo: 'Erro ao ler arquivo: ' + erro.message });
    }
});

// Renomear
app.post('/renomear', (req, res) => {
    const { caminho, novoNome } = req.body;
    const dir = path.dirname(caminho);
    const novoCaminho = path.join(dir, novoNome);
    
    console.log('✏️ Renomeando:', caminho, '->', novoCaminho);
    
    try {
        fs.renameSync(caminho, novoCaminho);
        res.json({ success: true });
    } catch (erro) {
        console.error('Erro ao renomear:', erro);
        res.json({ success: false, error: erro.message });
    }
});

// Excluir
app.post('/excluir', (req, res) => {
    const { caminho } = req.body;
    
    console.log('🗑️ Excluindo:', caminho);
    
    try {
        const stats = fs.statSync(caminho);
        if (stats.isDirectory()) {
            fs.rmdirSync(caminho);
        } else {
            fs.unlinkSync(caminho);
        }
        res.json({ success: true });
    } catch (erro) {
        console.error('Erro ao excluir:', erro);
        res.json({ success: false, error: erro.message });
    }
});

// Iniciar servidor na porta 3012
const PORTA = 3012;
app.listen(PORTA, () => {
    console.log('========================================');
    console.log('SISTEMA DE ARQUIVO');
    console.log(`👉 http://localhost:${PORTA}`);
    console.log('========================================');
});