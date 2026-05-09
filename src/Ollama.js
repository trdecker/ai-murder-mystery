import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

class OllamaAPI {
    constructor() {
        this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        this.model = process.env.OLLAMA_MODEL || 'llama2';
    }

    async sendMessage(message, systemPrompt = null) {
        try {
            let prompt = message;
            if (systemPrompt) {
                prompt = `${systemPrompt}\n\nUser: ${message}`;
            }

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Error sending message to Ollama:', error.message);
            throw error;
        }
    }

    async sendConversation(messages, systemPrompt = null) {
        try {
            // Convert messages to a single prompt format for Ollama
            let prompt = '';

            if (systemPrompt) {
                prompt += `${systemPrompt}\n\n`;
            }

            // Convert conversation format to text
            messages.forEach(msg => {
                if (msg.role === 'user') {
                    prompt += `User: ${msg.content}\n`;
                } else if (msg.role === 'assistant') {
                    prompt += `Assistant: ${msg.content}\n`;
                }
            });

            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Error sending conversation to Ollama:', error.message);
            throw error;
        }
    }
}

export default OllamaAPI;