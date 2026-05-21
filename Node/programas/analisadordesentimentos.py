import sys
import json
import re

# Configurar UTF-8 para Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Dicionário de palavras e seus pesos
palavras_positivas = {
    'bom': 2, 'ótimo': 3, 'excelente': 3, 'maravilhoso': 3, 'fantástico': 3,
    'legal': 2, 'gostei': 2, 'adoro': 2, 'amo': 3, 'feliz': 2, 'alegre': 2,
    'incrível': 3, 'perfeito': 3, 'sensacional': 3, 'top': 2, 'show': 2,
    'bacana': 1, 'massa': 1, 'beleza': 1, 'obrigado': 1, 'valeu': 1,
    'saude': 1, 'sucesso': 2, 'vitoria': 2, 'conquista': 2, 'presente': 1
}

palavras_negativas = {
    'ruim': -2, 'pessimo': -3, 'horrivel': -3, 'terrivel': -3, 'detestei': -3,
    'odeio': -3, 'chato': -2, 'triste': -2, 'aborrecido': -2, 'cansado': -1,
    'frustrado': -2, 'raiva': -2, 'odio': -3, 'mentira': -2, 'bobo': -1,
    'burro': -2, 'errado': -1, 'falhou': -2, 'problema': -1, 'dificil': -1,
    'lixo': -2, 'pior': -2, 'fracasso': -2, 'perdi': -1
}

def analisar_sentimento(texto):
    texto_lower = texto.lower()
    palavras = re.findall(r'\w+', texto_lower)
    
    pontuacao = 0
    palavras_encontradas_pos = []
    palavras_encontradas_neg = []
    
    for palavra in palavras:
        if palavra in palavras_positivas:
            pontuacao += palavras_positivas[palavra]
            palavras_encontradas_pos.append(palavra)
        elif palavra in palavras_negativas:
            pontuacao += palavras_negativas[palavra]
            palavras_encontradas_neg.append(palavra)
    
    # Determinar sentimento
    if pontuacao > 0:
        sentimento = 'positivo'
        emoji = ':)'
        cor = 'verde'
    elif pontuacao < 0:
        sentimento = 'negativo'
        emoji = ':('
        cor = 'vermelho'
    else:
        sentimento = 'neutro'
        emoji = ':|'
        cor = 'cinza'
    
    intensidade = min(abs(pontuacao) / 5 * 100, 100)
    
    return {
        'texto': texto,
        'sentimento': sentimento,
        'emoji': emoji,
        'cor': cor,
        'pontuacao': pontuacao,
        'intensidade': round(intensidade),
        'palavras_positivas': palavras_encontradas_pos,
        'palavras_negativas': palavras_encontradas_neg,
        'total_palavras': len(palavras)
    }

def obter_frase_motivacional():
    frases = [
        "Continue assim!",
        "Voce esta no caminho certo!",
        "Que bom que esta se sentindo bem!",
        "Dias melhores virao!",
        "Tudo passa, ate a tempestade!",
        "Acredite em voce mesmo!",
        "Voce e capaz de coisas incriveis!"
    ]
    import random
    return random.choice(frases)

# Ler dados do Node.js
dados = sys.stdin.read()

if dados:
    try:
        dados_json = json.loads(dados)
        texto = dados_json.get('texto', '')
        
        if texto:
            resultado = analisar_sentimento(texto)
            
            # Adicionar frase motivacional se for negativo
            if resultado['sentimento'] == 'negativo':
                resultado['frase_motivacional'] = obter_frase_motivacional()
            
            # Garantir que a saída seja UTF-8
            output = json.dumps(resultado, ensure_ascii=False)
            sys.stdout.buffer.write(output.encode('utf-8'))
        else:
            sys.stdout.buffer.write(json.dumps({'erro': 'Nenhum texto fornecido'}).encode('utf-8'))
    except Exception as e:
        sys.stdout.buffer.write(json.dumps({'erro': f'Erro: {str(e)}'}).encode('utf-8'))
else:
    sys.stdout.buffer.write(json.dumps({'erro': 'Nenhum dado recebido'}).encode('utf-8'))