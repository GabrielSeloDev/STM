import { useState } from 'react'
import { Task, Group } from '../../types'
import { TaskItem } from './TaskItem'
import './TaskList.css'

interface TaskListProps {
    tasks: Task[]
    groups: Group[]
    onToggle: (id: string) => void
    onToggleImportant?: (id: string) => void
    onEdit: (task: Task) => void
    onDelete: (id: string) => void
    onAddTask: () => void
}

export function TaskList({ tasks, groups, onToggle, onToggleImportant, onEdit, onDelete, onAddTask }: TaskListProps) {
    const [selectedFilter, setSelectedFilter] = useState<string>('all')

    // Filtra as tarefas baseado no filtro selecionado
    const filteredTasks = (() => {
        if (selectedFilter === 'all') return tasks
        if (selectedFilter === 'ungrouped') return tasks.filter(task => !task.groupId)
        return tasks.filter(task => task.groupId === selectedFilter)
    })()

    const completedCount = filteredTasks.filter(t => t.isCompleted).length
    const totalCount = filteredTasks.length

    // Função para obter a cor do grupo
    const getGroupColor = (groupId: string | null) => {
        if (!groupId) return null
        const group = groups.find(g => g.id === groupId)
        return group?.color || null
    }

    // Calcula a contagem de tarefas por grupo
    const taskCounts = tasks.reduce((acc, task) => {
        const key = task.groupId || 'ungrouped'
        acc[key] = (acc[key] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    return (
        <div className="task-list-container">
            <div className="task-list-header">
                <div className="task-stats">
                    <h1>Tarefas</h1>
                    <span className="task-count">
                        {completedCount} de {totalCount} concluídas
                    </span>
                </div>
                <button className="btn-add-task" onClick={onAddTask}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Nova Tarefa
                </button>
            </div>

            {/* Filtros */}
            <div className="task-filters">
                <button
                    className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setSelectedFilter('all')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                    </svg>
                    Todas
                    <span className="filter-count">{tasks.length}</span>
                </button>

                <button
                    className={`filter-btn ${selectedFilter === 'ungrouped' ? 'active' : ''}`}
                    onClick={() => setSelectedFilter('ungrouped')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="8" y1="6" x2="21" y2="6" />
                        <line x1="8" y1="12" x2="21" y2="12" />
                        <line x1="8" y1="18" x2="21" y2="18" />
                        <line x1="3" y1="6" x2="3.01" y2="6" />
                        <line x1="3" y1="12" x2="3.01" y2="12" />
                        <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                    Sem Grupo
                    <span className="filter-count">{taskCounts['ungrouped'] || 0}</span>
                </button>

                {groups.map(group => (
                    <button
                        key={group.id}
                        className={`filter-btn ${selectedFilter === group.id ? 'active' : ''}`}
                        onClick={() => setSelectedFilter(group.id)}
                    >
                        <span className="filter-color" style={{ backgroundColor: group.color }} />
                        {group.name}
                        <span className="filter-count">{taskCounts[group.id] || 0}</span>
                    </button>
                ))}
            </div>

            <div className="task-list">
                {filteredTasks.length === 0 ? (
                    <div className="empty-state">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M9 11l3 3L22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                        <h3>Nenhuma tarefa{selectedFilter !== 'all' ? ' neste filtro' : ''}</h3>
                        <p>{selectedFilter === 'all' ? 'Crie sua primeira tarefa para começar' : 'Selecione outro filtro ou crie uma nova tarefa'}</p>
                    </div>
                ) : (
                    filteredTasks.map((task) => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            groupColor={getGroupColor(task.groupId)}
                            onToggle={onToggle}
                            onToggleImportant={onToggleImportant}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
