import sys
import json

# Ler os dados enviados pelo Node.js
dados = sys.stdin.read()

if dados:
    try:
        dados_json = json.loads(dados)
        num1 = float(dados_json.get('num1', 0))
        num2 = float(dados_json.get('num2', 0))
        operacao = dados_json.get('operacao', 'soma')
        
        if operacao == 'soma':
            resultado = num1 + num2
            simbolo = '+'
        elif operacao == 'subtracao':
            resultado = num1 - num2
            simbolo = '-'
        elif operacao == 'multiplicacao':
            resultado = num1 * num2
            simbolo = '*'
        elif operacao == 'divisao':
            if num2 == 0:
                resultado = 'Erro: Divisão por zero!'
            else:
                resultado = num1 / num2
            simbolo = '/'
        else:
            resultado = 'Operação inválida'
        
        print(f"{num1} {simbolo} {num2} = {resultado}")
    except:
        print("Erro ao processar os dados")
else:
    print("Nenhum dado recebido")