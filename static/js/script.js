document.addEventListener('DOMContentLoaded', () => {
    const chatToggle = document.getElementById('chatToggle');
    const chatBox = document.getElementById('chatBox');
    const closeChat = document.getElementById('closeChat');
    const sendBtn = document.getElementById('sendBtn');
    const userInput = document.getElementById('userInput');
    const chatMessages = document.getElementById('chatMessages');
    const newChatBtn = document.getElementById('newChatBtn');

    // Generate random conversation ID on load
    let conversationId = 'conv-' + Math.random().toString(36).substr(2, 9);

    const initialGreetingText = 'Hello. I can help with grades, shapes, packaging, export terms, and sample questions.';

    // Toggle Chatbox
    chatToggle.addEventListener('click', () => {
        chatBox.classList.toggle('active');
        if (chatBox.classList.contains('active')) {
            userInput.focus();
        }
    });

    closeChat.addEventListener('click', () => {
        chatBox.classList.remove('active');
    });

    // New Chat Button
    newChatBtn.addEventListener('click', () => {
        chatMessages.innerHTML = '';
        appendMessage('bot', initialGreetingText);
        conversationId = 'conv-' + Math.random().toString(36).substr(2, 9);
    });

    // Send Message
    const sendMessage = async () => {
        const text = userInput.value.trim();
        if (!text) return;

        // Add user message to UI
        appendMessage('user', text);
        userInput.value = '';

        // Add loading indicator
        const loadingId = 'loading-' + Date.now();
        appendLoading(loadingId);

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    conversation_id: conversationId,
                    message: text 
                })
            });
            
            const data = await response.json();
            
            // Remove loading indicator
            removeLoading(loadingId);
            
            // Add bot message
            appendMessage('bot', data.response);
        } catch (error) {
            removeLoading(loadingId);
            appendMessage('bot', 'Sorry, there was an error connecting to the server.');
            console.error('Error:', error);
        }
    };

    sendBtn.addEventListener('click', sendMessage);

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function appendMessage(sender, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}-message`;
        
        if (sender === 'bot') {
            const escapedText = escapeHtml(text);
            msgDiv.innerHTML = escapedText
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
        } else {
            msgDiv.textContent = text;
        }

        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function appendLoading(id) {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = id;
        loadingDiv.className = 'typing-indicator';
        loadingDiv.textContent = 'TunasCoal AI is typing...';
        chatMessages.appendChild(loadingDiv);
    }

    function removeLoading(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});
