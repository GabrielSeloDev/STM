import { useState, useEffect } from 'react'
import { Sidebar } from './components/Layout/Sidebar'
import { TaskList } from './components/Tasks/TaskList'
import { CalendarView } from './components/Calendar/CalendarView'
import { Dashboard } from './components/Dashboard/Dashboard'
import { TaskFormModal } from './components/Tasks/TaskFormModal'
import { Task, Group, TaskInput } from './types'
import './styles/index.css'
import './App.css'

function App() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [groups, setGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState(true)

    // Carregar dados iniciais
    useEffect(() => {
        const loadData = async () => {
            try {
                const [loadedTasks, loadedGroups] = await Promise.all([
                    window.electronAPI.getTasks(),
                    window.electronAPI.getGroups()
                ])
                setTasks(loadedTasks)
                setGroups(loadedGroups)
            } catch (error) {
                console.error('Erro ao carregar dados:', error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])



    // Handlers
    const addTask = async (taskData: TaskInput) => {
        try {
            const newTask = await window.electronAPI.addTask(taskData)
            setTasks(prev => [...prev, newTask])
        } catch (error) {
            console.error('Erro ao adicionar tarefa:', error)
        }
    }

    const updateTask = async (id: string, updates: TaskInput) => {
        try {
            const updatedTask = await window.electronAPI.updateTask(id, updates)
            setTasks(prev => prev.map(t => t.id === id ? updatedTask : t))
        } catch (error) {
            console.error('Erro ao atualizar tarefa:', error)
        }
    }

    const deleteTask = async (id: string) => {
        try {
            await window.electronAPI.deleteTask(id)
            setTasks(prev => prev.filter(t => t.id !== id))
        } catch (error) {
            console.error('Erro ao deletar tarefa:', error)
        }
    }

    const toggleTaskComplete = async (id: string) => {
        const task = tasks.find(t => t.id === id)
        if (task) {
            await updateTask(id, { isCompleted: !task.isCompleted })
        }
    }

    const toggleTaskImportant = async (id: string) => {
        const task = tasks.find(t => t.id === id)
        if (task) {
            await updateTask(id, { isImportant: !task.isImportant })
        }
    }

    const toggleSubtask = async (taskId: string, subtaskId: string) => {
        try {
            // Buscar a tarefa e subtarefa atuais
            const task = tasks.find(t => t.id === taskId)
            if (!task || !task.subtasks) return

            const subtask = task.subtasks.find(s => s.id === subtaskId)
            if (!subtask) return

            // Alternar isCompleted
            await window.electronAPI.updateSubtask(subtaskId, {
                isCompleted: !subtask.isCompleted
            })

            // Recarregar tarefas
            const updatedTasks = await window.electronAPI.getTasks()
            setTasks(updatedTasks)
        } catch (error) {
            console.error('Erro ao atualizar subtarefa:', error)
        }
    }

    const addGroup = async (groupData: Partial<Group>) => {
        try {
            const newGroup = await window.electronAPI.addGroup(groupData)
            setGroups(prev => [...prev, newGroup])
        } catch (error) {
            console.error('Erro ao adicionar grupo:', error)
        }
    }

    const deleteGroup = async (id: string) => {
        try {
            await window.electronAPI.deleteGroup(id)
            setGroups(prev => prev.filter(g => g.id !== id))
        } catch (error) {
            console.error('Erro ao deletar grupo:', error)
        }
    }

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [initialTaskData, setInitialTaskData] = useState<Partial<Task> | null>(null)
    const [currentView, setCurrentView] = useState<'dashboard' | 'list' | 'calendar'>('dashboard')

    const handleAddTask = (initialData?: Partial<Task>) => {
        setEditingTask(null)
        setInitialTaskData(initialData || null)
        setIsModalOpen(true)
    }

    const handleEditTask = (task: Task) => {
        setEditingTask(task)
        setInitialTaskData(null)
        setIsModalOpen(true)
    }

    const handleSubmitTask = async (data: TaskInput) => {
        if (editingTask) {
            await updateTask(editingTask.id, data)
        } else {
            await addTask(data)
        }
    }

    // Calcula contadores de tarefas por grupo
    const taskCounts = tasks.reduce((acc, task) => {
        const key = task.groupId || 'ungrouped'
        acc[key] = (acc[key] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner" />
                <p>Carregando...</p>
            </div>
        )
    }

    return (
        <div className="app">
            <Sidebar
                groups={groups}
                selectedGroupId={null}
                currentView={currentView}
                onSelectGroup={() => { }}
                onViewChange={setCurrentView}
                onAddGroup={addGroup}
                onDeleteGroup={deleteGroup}
                taskCounts={taskCounts}
            />

            <main className="main-content">
                {currentView === 'dashboard' ? (
                    <Dashboard
                        tasks={tasks}
                        groups={groups}
                        onToggle={toggleTaskComplete}
                        onToggleImportant={toggleTaskImportant}
                        onEdit={handleEditTask}
                        onDelete={deleteTask}
                    />
                ) : currentView === 'list' ? (
                    <TaskList
                        tasks={tasks}
                        groups={groups}
                        onToggle={toggleTaskComplete}
                        onToggleImportant={toggleTaskImportant}
                        onEdit={handleEditTask}
                        onDelete={deleteTask}
                        onAddTask={handleAddTask}
                    />
                ) : (
                    <CalendarView
                        tasks={tasks}
                        groups={groups}
                        onToggle={toggleTaskComplete}
                        onToggleSubtask={toggleSubtask}
                        onEdit={handleEditTask}
                        onDelete={deleteTask}
                        onAddTask={handleAddTask}
                        onUpdateTask={updateTask}
                    />
                )}
            </main>

            <TaskFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false)
                    setEditingTask(null)
                    setInitialTaskData(null)
                }}
                onSubmit={handleSubmitTask}
                onDelete={deleteTask}
                groups={groups}
                editingTask={editingTask}
                initialTaskData={initialTaskData}
            />
        </div>
    )
}

export default App
