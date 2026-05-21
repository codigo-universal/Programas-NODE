import sys
import json
import random

def gerar_numero(dificuldade):
    if dificuldade == 'facil':
        return random.randint(1, 50)
    elif dificuldade == 'medio':
        return random.randint(1, 100)
    elif dificuldade == 'dificil':
        return random.randint(1, 200)
    else:
        return random.randint(1, 100)

def processar_palpite(numero_secreto, palpite, tentativas):
    if palpite < numero_secreto:
        return {"acertou": False, "mensagem": "📈 Muito baixo! Tente um número MAIOR.", "tentativas": tentativas + 1}
    elif palpite > numero_secreto:
        return {"acertou": False, "mensagem": "📉 Muito alto! Tente um número MENOR.", "tentativas": tentativas + 1}
    else:
        return {"acertou": True, "mensagem": f"🎉 PARABÉNS! Você acertou em {tentativas + 1} tentativas!", "tentativas": tentativas + 1}

def calcular_pontuacao(tentativas, dificuldade):
    if dificuldade == 'facil':
        pontos = max(0, 100 - (tentativas * 2))
    elif dificuldade == 'medio':
        pontos = max(0, 200 - (tentativas * 3))
    else:
        pontos = max(0, 300 - (tentativas * 5))
    return pontos

def avaliar_dica(numero_secreto, palpite):
    diferenca = abs(numero_secreto - palpite)
    if diferenca <= 3:
        return "🔥 Você está MUITO perto! 🔥"
    elif diferenca <= 10:
        return "👍 Você está perto!"
    elif diferenca <= 20:
        return "👀 Você está chegando perto..."
    else:
        return "📡 Está longe ainda..."

# Ler dados do Node.js
dados = sys.stdin.read()

if dados:
    try:
        dados_json = json.loads(dados)
        acao = dados_json.get('acao', '')
        
        if acao == 'iniciar':
            dificuldade = dados_json.get('dificuldade', 'medio')
            numero_secreto = gerar_numero(dificuldade)
            
            resultado = {
                'acao': 'iniciado',
                'numero_secreto': numero_secreto,
                'dificuldade': dificuldade,
                'tentativas': 0,
                'mensagem': f"🎮 Jogo iniciado! Dificuldade: {dificuldade.upper()}\n💡 Digite um número para começar!"
            }
            print(json.dumps(resultado))
            
        elif acao == 'palpite':
            numero_secreto = dados_json.get('numero_secreto')
            palpite = dados_json.get('palpite')
            tentativas = dados_json.get('tentativas', 0)
            dificuldade = dados_json.get('dificuldade', 'medio')
            
            resultado_palpite = processar_palpite(numero_secreto, palpite, tentativas)
            dica = avaliar_dica(numero_secreto, palpite) if not resultado_palpite['acertou'] else None
            
            resultado = {
                'acao': 'palpite',
                'acertou': resultado_palpite['acertou'],
                'mensagem': resultado_palpite['mensagem'],
                'tentativas': resultado_palpite['tentativas'],
                'dica': dica
            }
            
            if resultado_palpite['acertou']:
                resultado['pontuacao'] = calcular_pontuacao(resultado_palpite['tentativas'], dificuldade)
                resultado['numero_secreto'] = numero_secreto
            
            print(json.dumps(resultado))
            
        elif acao == 'dica':
            numero_secreto = dados_json.get('numero_secreto')
            ultimo_palpite = dados_json.get('ultimo_palpite')
            if ultimo_palpite:
                dica = avaliar_dica(numero_secreto, ultimo_palpite)
                resultado = {'acao': 'dica', 'mensagem': dica}
            else:
                resultado = {'acao': 'dica', 'mensagem': "Faça um palpite primeiro para receber dicas!"}
            print(json.dumps(resultado))
            
    except Exception as e:
        print(json.dumps({'erro': str(e)}))
else:
    print(json.dumps({'erro': 'Nenhum dado recebido'}))