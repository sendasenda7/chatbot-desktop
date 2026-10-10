let currentMode = 'chat'

// ── Init ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  loadTheme()
  loadHistory()
})

// ── Theme ────────────────────────────────────────────────
function toggleTheme() {
  const body = document.body
  const isDark = body.getAttribute('data-theme') === 'dark'
  const newTheme = isDark ? 'light' : 'dark'
  body.setAttribute('data-theme', newTheme)
  document.getElementById('theme-toggle').textContent = isDark ? '☀️' : '🌙'
  localStorage.setItem('theme', newTheme)
}

function loadTheme() {
  const saved = localStorage.getItem('theme') || 'dark'
  document.body.setAttribute('data-theme', saved)
  document.getElementById('theme-toggle').textContent = saved === 'dark' ? '🌙' : '☀️'
}

// ── Switch mode ──────────────────────────────────────────
function switchMode(mode) {
  currentMode = mode

  document.getElementById('panel-chat').classList.toggle('hidden', mode !== 'chat')
  document.getElementById('panel-terminal').classList.toggle('hidden', mode !== 'terminal')

  document.getElementById('btn-chat').classList.toggle('active', mode === 'chat')
  document.getElementById('btn-terminal').classList.toggle('active', mode === 'terminal')
}

// ── Chat ─────────────────────────────────────────────────
function handleChatKey(e) {
  if (e.key === 'Enter') sendChatMessage()
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input')
  const message = input.value.trim()
  if (!message) return

  appendMessage('user', message)
  saveMessage('user', message)
  input.value = ''

  const typing = appendTyping()

  const result = await window.electronAPI.sendMessage(message)

  typing.remove()
  const reply = result.message
  appendMessage('bot', reply)
  saveMessage('bot', reply)
}

function appendMessage(role, text) {
  const messages = document.getElementById('chat-messages')
  const div = document.createElement('div')
  div.className = `message ${role}`

  div.innerHTML = `
    <div class="avatar">${role === 'bot' ? '🤖' : '👤'}</div>
    <div class="bubble">${escapeHtml(text).replace(/\n/g, '<br>')}</div>
  `

  div.querySelector('.bubble').addEventListener('click', () => {
    navigator.clipboard.writeText(text)
  })

  messages.appendChild(div)
  messages.scrollTop = messages.scrollHeight
  return div
}

function appendTyping() {
  const messages = document.getElementById('chat-messages')
  const div = document.createElement('div')
  div.className = 'message bot'
  div.innerHTML = `
    <div class="avatar">🤖</div>
    <div class="bubble">
      <div class="typing-indicator"><span></span><span></span><span></span></div>
    </div>
  `
  messages.appendChild(div)
  messages.scrollTop = messages.scrollHeight
  return div
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// ── Persistence ──────────────────────────────────────────
function saveMessage(role, text) {
  const history = JSON.parse(localStorage.getItem('chatHistory') || '[]')
  history.push({ role, text })
  localStorage.setItem('chatHistory', JSON.stringify(history))
}

function loadHistory() {
  const history = JSON.parse(localStorage.getItem('chatHistory') || '[]')
  if (history.length === 0) {
    appendMessage('bot', "Bonjour ! Je suis votre assistant IA. Comment puis-je vous aider aujourd'hui ?")
    return
  }
  history.forEach(msg => appendMessage(msg.role, msg.text))
}

// ── Terminal ──────────────────────────────────────────────
function handleTerminalKey(e) {
  if (e.key === 'Enter') runTerminalCommand()
}

async function runTerminalCommand() {
  const input = document.getElementById('terminal-input')
  const command = input.value.trim()
  if (!command) return

  appendTerminalLine(`C:\\> ${command}`, 'command')
  input.value = ''

  if (command.startsWith('ai ')) {
    const query = command.slice(3)
    appendTerminalLine('IA en train de réfléchir...', 'system')
    const result = await window.electronAPI.sendMessage(
      `Suggère-moi une commande Windows pour : ${query}. Donne uniquement la commande, rien d'autre.`
    )
    appendTerminalLine(result.message, 'output')
    return
  }

  const result = await window.electronAPI.runCommand(command)

  if (result.success) {
    const lines = result.output.split('\n').filter(l => l.trim())
    lines.forEach(line => appendTerminalLine(line, 'output'))
  } else {
    appendTerminalLine(result.output, 'error')
  }
}

function appendTerminalLine(text, type) {
  const output = document.getElementById('terminal-output')
  const div = document.createElement('div')
  div.className = `terminal-line ${type}`
  div.textContent = text
  output.appendChild(div)
  output.scrollTop = output.scrollHeight
}

// ── Clear ─────────────────────────────────────────────────
function clearConversation() {
  if (currentMode === 'chat') {
    localStorage.removeItem('chatHistory')
    const messages = document.getElementById('chat-messages')
    messages.innerHTML = ''
    appendMessage('bot', 'Conversation effacée. Comment puis-je vous aider ?')
  } else {
    const output = document.getElementById('terminal-output')
    output.innerHTML = `
      <div class="terminal-line system">Terminal effacé — ChatBot Desktop</div>
      <div class="terminal-line system">─────────────────────────────────</div>`
  }
}