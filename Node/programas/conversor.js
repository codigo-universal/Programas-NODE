const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const htmlPdf = require('html-pdf-node');

const app = express();
const upload = multer({ dest: 'uploads/' });

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Conversor JPG para PDF</title>
    <style>
        body {
            font-family: Arial;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 50px;
        }
        .container {
            max-width: 500px;
            margin: auto;
            background: white;
            padding: 30px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }
        h1 {
            color: #667eea;
        }
        input {
            margin: 20px 0;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 10px;
            width: 80%;
        }
        button {
            background: #667eea;
            color: white;
            padding: 12px 40px;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background: #764ba2;
        }
        .resultado {
            margin-top: 20px;
            padding: 15px;
            border-radius: 10px;
            display: none;
        }
        .sucesso {
            background: #d4edda;
            color: #155724;
        }
        .erro {
            background: #f8d7da;
            color: #721c24;
        }
        .info {
            margin-top: 20px;
            font-size: 12px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🖼️ JPG para PDF</h1>
        <p>Selecione uma imagem e converta para PDF</p>
        <input type="file" id="arquivo" accept="image/jpeg,image/jpg,image/png">
        <br>
        <button onclick="converter()">📄 Converter para PDF</button>
        <div id="resultado" class="resultado"></div>
        <div class="info">
            💡 A imagem será inserida em uma página A4
        </div>
    </div>

    <script>
        async function converter() {
            const arquivo = document.getElementById('arquivo').files[0];
            const resultado = document.getElementById('resultado');
            
            if (!arquivo) {
                resultado.style.display = 'block';
                resultado.className = 'resultado erro';
                resultado.innerHTML = '❌ Selecione um arquivo primeiro!';
                return;
            }
            
            resultado.style.display = 'block';
            resultado.className = 'resultado';
            resultado.innerHTML = '🔄 Convertendo... Aguarde';
            
            const formData = new FormData();
            formData.append('imagem', arquivo);
            
            try {
                const response = await fetch('/converter', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'convertido.pdf';
                    a.click();
                    URL.revokeObjectURL(url);
                    
                    resultado.className = 'resultado sucesso';
                    resultado.innerHTML = '✅ PDF gerado com sucesso! O download foi iniciado.';
                } else {
                    const erro = await response.text();
                    resultado.className = 'resultado erro';
                    resultado.innerHTML = '❌ Erro: ' + erro;
                }
            } catch (erro) {
                resultado.className = 'resultado erro';
                resultado.innerHTML = '❌ Erro de conexão: ' + erro.message;
            }
        }
    </script>
</body>
</html>
    `);
});

// Rota para converter
app.post('/converter', upload.single('imagem'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('Nenhum arquivo enviado');
        }
        
        console.log('📸 Convertendo:', req.file.originalname);
        
        // Ler a imagem e converter para base64
        const imagemBuffer = fs.readFileSync(req.file.path);
        const imagemBase64 = imagemBuffer.toString('base64');
        
        // Detectar o tipo da imagem
        const mimetype = req.file.mimetype;
        
        // Criar HTML com a imagem
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background: white;
                    }
                    .container {
                        text-align: center;
                        width: 100%;
                    }
                    img {
                        max-width: 100%;
                        height: auto;
                        display: block;
                        margin: 0 auto;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <img src="data:${mimetype};base64,${imagemBase64}" />
                </div>
            </body>
            </html>
        `;
        
        // Configuração do PDF (tamanho A4)
        const options = {
            format: 'A4',
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
        };
        
        // Gerar PDF
        const pdfBuffer = await htmlPdf.generatePdf({ content: html }, options);
        
        // Enviar o PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="convertido.pdf"');
        res.send(pdfBuffer);
        
        // Limpar arquivo temporário
        fs.unlinkSync(req.file.path);
        
        console.log('✅ PDF gerado com sucesso!');
        
    } catch (erro) {
        console.error('❌ Erro detalhado:', erro);
        res.status(500).send('Erro ao converter: ' + erro.message);
    }
});

app.listen(3001, () => {
    console.log('========================================');
    console.log('✅ SERViDOR RODANDO!');
    console.log('👉 http://localhost:3001');
    console.log('========================================');
    console.log('📸 CONVERSOR JPG PARA PDF');
    console.log('');
    console.log('COMO USAR:');
    console.log('1. Acesse http://localhost:3000');
    console.log('2. Clique em "Escolher arquivo"');
    console.log('3. Selecione uma imagem JPG ou PNG');
    console.log('4. Clique em "Converter para PDF"');
    console.log('5. O PDF será baixado automaticamente!');
    console.log('========================================');
});