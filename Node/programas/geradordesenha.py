import sys
import json
import random
import string

def gerar_senha(tamanho=12, usar_maiusculas=True, usar_minusculas=True, usar_numeros=True, usar_simbolos=True):
    caracteres = ''
    
    if usar_maiusculas:
        caracteres += string.ascii_uppercase
    if usar_minusculas:
        caracteres += string.ascii_lowercase
    if usar_numeros:
        caracteres += string.digits
    if usar_simbolos:
        caracteres += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    if not caracteres:
        return "Selecione pelo menos uma opcao!"
    
    senha = ''.join(random.choice(caracteres) for _ in range(tamanho))
    
    # Garantir que tenha pelo menos um de cada tipo selecionado
    if usar_maiusculas and not any(c.isupper() for c in senha):
        pos = random.randint(0, tamanho-1)
        senha = senha[:pos] + random.choice(string.ascii_uppercase) + senha[pos+1:]
    if usar_minusculas and not any(c.islower() for c in senha):
        pos = random.randint(0, tamanho-1)
        senha = senha[:pos] + random.choice(string.ascii_lowercase) + senha[pos+1:]
    if usar_numeros and not any(c.isdigit() for c in senha):
        pos = random.randint(0, tamanho-1)
        senha = senha[:pos] + random.choice(string.digits) + senha[pos+1:]
    if usar_simbolos and not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in senha):
        pos = random.randint(0, tamanho-1)
        senha = senha[:pos] + random.choice('!@#$%^&*()_+-=[]{}|;:,.<>?') + senha[pos+1:]
    
    return senha

def calcular_forca(senha):
    pontuacao = 0
    
    if len(senha) >= 12:
        pontuacao += 2
    elif len(senha) >= 8:
        pontuacao += 1
    
    if any(c.isupper() for c in senha):
        pontuacao += 1
    if any(c.islower() for c in senha):
        pontuacao += 1
    if any(c.isdigit() for c in senha):
        pontuacao += 1
    if any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in senha):
        pontuacao += 2
    if len(set(senha)) == len(senha):
        pontuacao += 1
    
    if pontuacao >= 7:
        return {"nivel": "MUITO FORTE", "cor": "#2e7d32", "bg": "#e8f5e9", "mensagem": "Excelente! Senha muito segura."}
    elif pontuacao >= 5:
        return {"nivel": "FORTE", "cor": "#1976d2", "bg": "#e3f2fd", "mensagem": "Boa senha! Segura para uso diario."}
    elif pontuacao >= 3:
        return {"nivel": "MEDIA", "cor": "#ed6c02", "bg": "#fff3e0", "mensagem": "Pode ser melhorada. Adicione simbolos e numeros."}
    else:
        return {"nivel": "FRACA", "cor": "#d32f2f", "bg": "#ffebee", "mensagem": "Senha fraca! Aumente o tamanho e use simbolos."}

# Ler dados do Node.js
dados = sys.stdin.read()

if dados:
    try:
        dados_json = json.loads(dados)
        tamanho = dados_json.get('tamanho', 12)
        maiusculas = dados_json.get('maiusculas', True)
        minusculas = dados_json.get('minusculas', True)
        numeros = dados_json.get('numeros', True)
        simbolos = dados_json.get('simbolos', True)
        
        senha = gerar_senha(tamanho, maiusculas, minusculas, numeros, simbolos)
        forca = calcular_forca(senha)
        
        resultado = {
            'senha': senha,
            'forca': forca,
            'tamanho': len(senha)
        }
        
        print(json.dumps(resultado, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({'erro': str(e)}))
else:
    print(json.dumps({'erro': 'Nenhum dado recebido'}))