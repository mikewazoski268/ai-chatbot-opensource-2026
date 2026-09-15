// Referencias al DOM
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const messagesDiv = document.getElementById('messages');
const statusElement = document.getElementById('status');

let isLoading = false;

// Verificar estado del servidor al cargar
document.addEventListener('DOMContentLoaded', () => {
    checkServerStatus();
    setInterval(checkServerStatus, 30000); // Verificar cada 30 segundos
    
    // Permitir enviar con Enter
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !isLoading) {
            sendMessage();
        }
    });
});

// Verificar estado del servidor
async function checkServerStatus() {
    try {
        const response = await fetch('/api/status');
        const data = await response.json();
        
        if (data.status === 'online') {
            statusElement.textContent = `✅ Online - Modelo: ${data.current_model}`;
            statusElement.className = 'status online';
            sendBtn.disabled = false;
        } else {
            statusElement.textContent = '⚠️ Error de conexión';
            statusElement.className = 'status offline';
            sendBtn.disabled = true;
        }
    } catch (error) {
        statusElement.textContent = '❌ Offline - Ollama no disponible';
        statusElement.className = 'status offline';
        sendBtn.disabled = true;
    }
}

// Enviar mensaje
async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message || isLoading) return;
    
    // Agregar mensaje del usuario
    addMessage(message, 'user');
    messageInput.value = '';
    
    // Mostrar indicador de carga
    isLoading = true;
    sendBtn.disabled = true;
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot-message';
    loadingDiv.innerHTML = '<div class="loading"><span></span><span></span><span></span></div>';
    messagesDiv.appendChild(loadingDiv);
    scrollToBottom();
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        // Remover indicador de carga
        loadingDiv.remove();
        
        if (!response.ok) {
            const error = await response.json();
            addMessage(`Error: ${error.error || 'Error desconocido'}`, 'bot');
        } else {
            const data = await response.json();
            addMessage(data.response, 'bot');
        }
    } catch (error) {
        loadingDiv.remove();
        addMessage(`Error de conexión: ${error.message}`, 'bot');
    } finally {
        isLoading = false;
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

// Agregar mensaje al chat
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    
    messageDiv.appendChild(paragraph);
    messagesDiv.appendChild(messageDiv);
    
    scrollToBottom();
}

// Scroll automático al final
function scrollToBottom() {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
