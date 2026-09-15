from flask import Flask, render_template, request, jsonify
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Configuración
OLLAMA_API = os.getenv('OLLAMA_API', 'http://localhost:11434')
MODEL = os.getenv('MODEL', 'mistral')

def get_ai_response(user_message):
    """
    Envía un mensaje al LLM local y obtiene respuesta
    """
    try:
        response = requests.post(
            f'{OLLAMA_API}/api/generate',
            json={
                'model': MODEL,
                'prompt': user_message,
                'stream': False,
                'temperature': 0.7
            },
            timeout=300
        )
        
        if response.status_code == 200:
            result = response.json()
            return result.get('response', 'Error al procesar la respuesta')
        else:
            return f'Error del servidor: {response.status_code}'
    
    except requests.exceptions.ConnectionError:
        return f'Error: No se pudo conectar a Ollama. ¿Está ejecutándose en {OLLAMA_API}?'
    except Exception as e:
        return f'Error: {str(e)}'

@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    """API para chat"""
    try:
        data = request.json
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'error': 'Mensaje vacío'}), 400
        
        response = get_ai_response(user_message)
        
        return jsonify({
            'message': user_message,
            'response': response
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/status', methods=['GET'])
def status():
    """Verifica estado del servidor y conexión a Ollama"""
    try:
        response = requests.get(f'{OLLAMA_API}/api/tags', timeout=5)
        if response.status_code == 200:
            models = response.json().get('models', [])
            return jsonify({
                'status': 'online',
                'models': [m.get('name') for m in models],
                'current_model': MODEL
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Ollama respondió con error'
            }), 500
    except:
        return jsonify({
            'status': 'offline',
            'message': f'No se pudo conectar a Ollama en {OLLAMA_API}'
        }), 503

if __name__ == '__main__':
    print(f"🤖 Iniciando AI Assistant")
    print(f"📡 Conectando a Ollama: {OLLAMA_API}")
    print(f"🧠 Modelo: {MODEL}")
    print(f"🌐 Servidor en: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
