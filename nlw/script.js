// Criando as variáveis para os elementos do DOM
const apiKeyInput = document.getElementById('apiKey');
const gameSelect = document.getElementById('gameSelect');
const questionInput = document.getElementById('questionInput');
const askButton = document.getElementById('askButton');
const form = document.querySelector('form');
const aiResponse = document.getElementById('aiResponse');

const markdownConverter = (text) => {
    const converter = new showdown.Converter();
    return converter.makeHtml(text);
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
    })

    const data = await response.json();
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
        const text = await questionIa(question, game, apiKey );
        //Exibir a resposta da IA
        aiResponse.querySelector(".responseContent").innerHTML = markdownConverter(text);
        aiResponse.classList.remove("hidden");
    } catch (error){
        console.error(`Erro ao enviar a pergunta: ${error}`);
        aiResponse.textContent = "Ocorreu um erro ao enviar a pergunta. Tente novamente. Se o problema persistir, tente novamente mais tarde.";
        return;
    } finally {
        askButton.disabled = false;
        askButton.textContent = "Perguntar";
        askButton.classList.remove("loading");
    }
}

form.addEventListener("submit", sendForm);