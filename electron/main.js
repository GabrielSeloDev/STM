import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { DatabaseManager } from './database/db.js'
import { migrateFromJSON } from './database/migration.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Função para configurar o nome do app no macOS antes do ready
if (process.platform === 'darwin') {
    app.setName('Selo TaskManager')
}

let mainWindow
let dbManager

function createWindow() {
    // Define o caminho do preload baseado no ambiente
    const preloadPath = app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../dist-electron/preload.js')

    console.log('[Main] Caminho do preload:', preloadPath)

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        title: 'Selo TaskManager',
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false,
        },
        titleBarStyle: 'hiddenInset',
        backgroundColor: '#1a1a1a',
        icon: path.join(__dirname, '../assets/icon.png')
    })

    // Configura ícone no Dock do macOS
    if (process.platform === 'darwin') {
        const iconPath = path.join(__dirname, '../assets/icon.png')
        app.dock.setIcon(iconPath)
    }

    // Filtrar mensagens de erro irrelevantes do DevTools
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        // Ignora erros do próprio DevTools
        if (sourceId.startsWith('devtools://')) {
            return
        }
        // Log apenas erros reais da aplicação
        if (level === 3) { // 3 = error
            console.error(`[Renderer Error] ${message} (${sourceId}:${line})`)
        }
    })

    // Em desenvolvimento, carrega do servidor Vite
    if (!app.isPackaged) {
        mainWindow.loadURL('http://localhost:5173')
        mainWindow.webContents.openDevTools()
    } else {
        // Em produção, carrega o arquivo build
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    }
}

// Inicializa o app
app.whenReady().then(() => {
    // Inicializa o banco de dados
    dbManager = new DatabaseManager()

    // Executa migração se necessário
    try {
        migrateFromJSON(dbManager)
    } catch (error) {
        console.error('[Main] Erro na migração:', error)
    }

    // Configura os handlers IPC
    setupIpcHandlers()

    createWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// Configuração dos handlers IPC
function setupIpcHandlers() {
    // ============ TAREFAS ============

    // Obter todas as tarefas
    ipcMain.handle('get-tasks', async () => {
        return dbManager.getTasks()
    })

    // Adicionar tarefa
    ipcMain.handle('add-task', async (event, task) => {
        return dbManager.addTask(task)
    })

    // Atualizar tarefa
    ipcMain.handle('update-task', async (event, id, updates) => {
        return dbManager.updateTask(id, updates)
    })

    // Deletar tarefa
    ipcMain.handle('delete-task', async (event, id) => {
        return dbManager.deleteTask(id)
    })

    // ============ GRUPOS ============

    // Obter todos os grupos
    ipcMain.handle('get-groups', async () => {
        return dbManager.getGroups()
    })

    // Adicionar grupo
    ipcMain.handle('add-group', async (event, group) => {
        return dbManager.addGroup(group)
    })

    // Atualizar grupo
    ipcMain.handle('update-group', async (event, id, updates) => {
        return dbManager.updateGroup(id, updates)
    })

    // Deletar grupo
    ipcMain.handle('delete-group', async (event, id) => {
        return dbManager.deleteGroup(id)
    })

    // ============ SUBTAREFAS ============

    // Obter subtarefas de uma tarefa
    ipcMain.handle('get-subtasks', async (event, taskId) => {
        return dbManager.getSubtasks(taskId)
    })

    // Adicionar subtarefa
    ipcMain.handle('add-subtask', async (event, taskId, title, position) => {
        return dbManager.addSubtask(taskId, title, position)
    })

    // Atualizar subtarefa
    ipcMain.handle('update-subtask', async (event, id, updates) => {
        return dbManager.updateSubtask(id, updates)
    })

    // Deletar subtarefa
    ipcMain.handle('delete-subtask', async (event, id) => {
        return dbManager.deleteSubtask(id)
    })
}
