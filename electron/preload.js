const { contextBridge, ipcRenderer } = require('electron')

// Expõe APIs seguras para o renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Tarefas
    getTasks: () => ipcRenderer.invoke('get-tasks'),
    addTask: (task) => ipcRenderer.invoke('add-task', task),
    updateTask: (id, updates) => ipcRenderer.invoke('update-task', id, updates),
    deleteTask: (id) => ipcRenderer.invoke('delete-task', id),

    // Grupos
    getGroups: () => ipcRenderer.invoke('get-groups'),
    addGroup: (group) => ipcRenderer.invoke('add-group', group),
    updateGroup: (id, updates) => ipcRenderer.invoke('update-group', id, updates),
    deleteGroup: (id) => ipcRenderer.invoke('delete-group', id),

    // Subtarefas
    getSubtasks: (taskId) => ipcRenderer.invoke('get-subtasks', taskId),
    addSubtask: (taskId, title, position) => ipcRenderer.invoke('add-subtask', taskId, title, position),
    updateSubtask: (id, updates) => ipcRenderer.invoke('update-subtask', id, updates),
    deleteSubtask: (id) => ipcRenderer.invoke('delete-subtask', id),
})

console.log('[Preload] electronAPI exposta com sucesso')
