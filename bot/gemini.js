const Groq = require('groq-sdk')

require("dotenv").config();
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const groq = new Groq({ apiKey })

const history = []

async function chatWithGemini(userMessage) {
  history.push({
    role: 'user',
    content: userMessage
  })

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `Tu es un assistant intelligent intégré dans une application desktop. 
Tu peux aider l'utilisateur avec des questions générales, de la programmation, 
de l'analyse de texte, et tu peux aussi suggérer des commandes système Windows 
quand l'utilisateur veut interagir avec son PC.
Réponds toujours en français sauf si l'utilisateur parle une autre langue.`
      },
      ...history
    ],
    max_tokens: 1000
  })

  const reply = response.choices[0].message.content

  history.push({
    role: 'assistant',
    content: reply
  })

  return reply
}

module.exports = { chatWithGemini }