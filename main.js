const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const { execSync } = require('child_process')
const { chatWithGemini } = require('./bot/gemini')

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'default',
    title: 'ChatBot Desktop',
    icon: path.join(__dirname, 'renderer/icon.png')
  })

  win.loadFile('renderer/index.html')
}

// Gérer les messages du chatbot
ipcMain.handle('send-message', async (event, userMessage) => {
  try {
    const response = await chatWithGemini(userMessage)
    return { success: true, message: response }
  } catch (error) {
    return { success: false, message: 'Erreur: ' + error.message }
  }
})

// Gérer les commandes système (mode terminal)
ipcMain.handle('run-command', async (event, command) => {
  try {
const output = execSync(command, { encoding: 'buffer', timeout: 10000 }).toString('latin1')
    return { success: true, output }
  } catch (error) {
    return { success: false, output: error.message }
  }
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})