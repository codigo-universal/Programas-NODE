const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Relógio Digital</title>
            <style>
                body {
                    background: #1a1a2e;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    font-family: 'Courier New', monospace;
                }
                
                .relogio {
                    background: #16213e;
                    color: #0f3460;
                    padding: 50px;
                    border-radius: 20px;
                    text-align: center;
                    box-shadow: 0 0 20px rgba(0,0,0,0.3);
                }
                
                .horas {
                    font-size: 80px;
                    font-weight: bold;
                    color: #e94560;
                    letter-spacing: 5px;
                }
                
                .data {
                    font-size: 20px;
                    color: #533483;
                    margin-top: 20px;
                }
                
                button {
                    margin-top: 30px;
                    padding: 10px 20px;
                    font-size: 16px;
                    background: #e94560;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                }
                
                button:hover {
                    background: #533483;
                }
            </style>
        </head>
        <body>
            <div class="relogio">
                <div class="horas" id="horario">--:--:--</div>
                <div class="data" id="data">--/--/----</div>
                <button onclick="atualizarHorario()">Atualizar Agora</button>
            </div>
            
            <script>
                function atualizarHorario() {
                    const agora = new Date();
                    
                    // Horas
                    const horas = agora.getHours().toString().padStart(2, '0');
                    const minutos = agora.getMinutes().toString().padStart(2, '0');
                    const segundos = agora.getSeconds().toString().padStart(2, '0');
                    
                    document.getElementById('horario').textContent = 
                        horas + ':' + minutos + ':' + segundos;
                    
                    // Data
                    const dia = agora.getDate().toString().padStart(2, '0');
                    const mes = (agora.getMonth() + 1).toString().padStart(2, '0');
                    const ano = agora.getFullYear();
                    
                    document.getElementById('data').textContent = 
                        dia + '/' + mes + '/' + ano;
                }
                
                // Atualiza automático a cada 1 segundo
                setInterval(atualizarHorario, 1000);
                
                // Primeira execução
                atualizarHorario();
            </script>
        </body>
        </html>
    `);
});

app.listen(3002, () => {
    console.log('✅ Servidor rodando!');
    console.log('👉 http://localhost:3002');
    console.log('');
    console.log('⏰ RELÓGIO DIGITAL FUNCIONANDO!');
    console.log('Veja as horas mudando sozinhas a cada segundo');
});