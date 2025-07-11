// Criando as variáveis para os elementos do DOM
const apiKeyInput = document.getElementById('apiKey');
const gameSelect = document.getElementById('gameSelect');
const questionInput = document.getElementById('questionInput');
const askButton = document.getElementById('askButton');
const form = document.querySelector('form');
const aiResponse = document.getElementById('aiResponse');

const markdownConverter = (text) => {
    try {
        if (typeof showdown !== 'undefined') {
            const converter = new showdown.Converter();
            return converter.makeHtml(text);
        } else {
            // Fallback se showdown não carregar
            return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/\n/g, '<br>');
        }
    } catch (error) {
        console.error('Erro ao converter markdown:', error);
        return text.replace(/\n/g, '<br>');
    }
} // Variável para converter Markdown em HTML

// apiKey: AIzaSyCSBe3yv4_fBIE94bMJm0300p0_PrOq33c
// criando a função para perguntar à IA
// A função recebe a pergunta, o jogo e a chave da API como parâmetros
const questionIa = async (question, game, apiKey) => {
    const model = "gemini-2.0-flash";
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const pergunta = `
        ## Especialista em jogos
        Você é um especialista de metas no jogo ${game}. 
        
        ## Tarefa
        Responda a pergunta do usuário: com base no seu conhecimentos forma clara e objetiva.

        ## Regras
        Se você não souber a resposta, responda que não sabe. Não invente respostas.
        Se a pergunta for sobre um jogo que não é ${game}, responda: "essa pergunta não está relacionada ao jogo ${game}."
        - Considere a data atual ${new Date().toLocaleDateString('pt-BR')}.
        - Faça pesquisas atualizadas sobre o patch atual baseado na data atual na internet para responder a pergunta.
        - Nunca responda itens que você não tenha certeza que não existe no partch atual do jogo ${game}.
        - Não precisa dizer a data do patch, apenas responda a pergunta do usuário.


        ## Resposta
        - Economize na resposta, seja direto e objetivo. responda no máximo 500 caracteres. Responda em markdown.
        - Não precisa usar saudações ou despedidas.
        - Responda apenas a pergunta do usuário.

        ## Exemplo de resposta
        pergunta: "Qual é o melhor item para o campeão X no patch atual?"
        resposta: "O melhor item para o campeão X no patch atual é: \n\n **Item Y** \n\n pois ele oferece aumento de dano e resistência, ideal para o estilo de jogo do campeão. \n\n **Observação:** Sempre use isso para que você se movimente melhor."

        ---
        Aqui está a pergunta do usuário:
        ${question}
        ---
    `;

    // Estrutura de dados para a requisição
    // A estrutura é baseada no modelo de chat da API Gemini
    const contents = [{
        role: "user",
        parts: [{
            text: pergunta
        }]
    }];

    const tools = [
        {
            google_search: {}
        }
    ]

    //Chamada para a API Gemini
    const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents,
            tools
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro da API:', response.status, errorText);
        throw new Error(`Erro da API (${response.status}): Verifique sua API Key`);
    }

    const data = await response.json();
    console.log('Resposta da API:', data);
    
    // Verificar se a resposta tem a estrutura esperada
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('Resposta inválida:', data);
        throw new Error('Resposta inválida da API. Tente novamente.');
    }
    
    return data.candidates[0].content.parts[0].text;

}

const sendForm = async (event) =>{
    event.preventDefault();
    const apiKey = apiKeyInput.value;
    const game   = gameSelect.value;
    const question = questionInput.value;

    
    if(apiKey == "" || game == "" || question == ""){
        alert("Preencha todos os campos.");
        return;
    }
    askButton.disabled = true;
    askButton.textContent = "Perguntando....";
    askButton.classList.add("loading");

    try {
        //Perguntar para a API da IA
        const text = await questionIa(question, game, apiKey);
        //Exibir a resposta da IA
        const responseElement = aiResponse.querySelector(".responseContent");
        if (responseElement) {
            responseElement.innerHTML = markdownConverter(text);
            aiResponse.classList.remove("hidden");
        } else {
            throw new Error('Elemento de resposta não encontrado');
        }
    } catch (error){
        console.error(`Erro ao enviar a pergunta:`, error);
        
        // Mostrar erro na interface
        const responseElement = aiResponse.querySelector(".responseContent");
        if (responseElement) {
            responseElement.innerHTML = `<div class="error">❌ ${error.message}</div>`;
            aiResponse.classList.remove("hidden");
        } else {
            alert(`Erro: ${error.message}`);
        }
    } finally {
        askButton.disabled = false;
        askButton.textContent = "Perguntar";
        askButton.classList.remove("loading");
    }
}

form.addEventListener("submit", sendForm);

// Debug para mobile - adicionar logs visíveis
const addDebugLog = (message) => {
    console.log(message);
    // Opcional: mostrar logs na interface para debug no mobile
    if (window.location.search.includes('debug=true')) {
        const debugDiv = document.getElementById('debug') || (() => {
            const div = document.createElement('div');
            div.id = 'debug';
            div.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#000;color:#0f0;padding:10px;font-size:12px;max-height:200px;overflow-y:auto;z-index:9999;';
            document.body.appendChild(div);
            return div;
        })();
        debugDiv.innerHTML += `<div>${new Date().toLocaleTimeString()}: ${message}</div>`;
    }
};

// Capturar erros não tratados
window.addEventListener('error', (e) => {
    addDebugLog(`Erro JS: ${e.message} em ${e.filename}:${e.lineno}`);
});

window.addEventListener('unhandledrejection', (e) => {
    addDebugLog(`Promise rejeitada: ${e.reason}`);
});