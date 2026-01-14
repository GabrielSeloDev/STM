import { Task, Group } from '../../types'
import './ImportantGoals.css'

interface ImportantGoalsProps {
    tasks: Task[]
    groups: Group[]
    onToggle: (id: string) => void
    onToggleImportant: (id: string) => void
    onEdit: (task: Task) => void
    onDelete: (id: string) => void
}

export function ImportantGoals({ tasks, groups, onToggle, onToggleImportant, onEdit, onDelete }: ImportantGoalsProps) {
    const importantTasks = tasks.filter(t => t.isImportant && !t.isCompleted)

    const getGroupColor = (groupId: string | null) => {
        if (!groupId) return '#9ca3af'
        const group = groups.find(g => g.id === groupId)
        return group?.color || '#9ca3af'
    }

    const getGroupName = (groupId: string | null) => {
        if (!groupId) return 'Sem grupo'
        const group = groups.find(g => g.id === groupId)
        return group?.name || 'Sem grupo'
    }

    return (
        <div className="important-goals">
            <div className="important-header">
                <h2>⭐ Metas Importantes</h2>
                <span className="important-count">{importantTasks.length}</span>
            </div>

            {importantTasks.length === 0 ? (
                <div className="empty-state">
                    <p>Nenhuma meta importante no momento</p>
                    <span className="empty-hint">Marque tarefas como importantes para vê-las aqui</span>
                </div>
            ) : (
                <div className="important-list">
                    {importantTasks.map(task => (
                        <div key={task.id} className="important-task-item">
                            <div className="task-content">
                                <button
                                    className="task-checkbox"
                                    onClick={() => onToggle(task.id)}
                                    aria-label="Marcar como concluída"
                                >
                                    <div className="checkbox-inner"></div>
                                </button>

                                <div className="task-info">
                                    <div className="task-title-row">
                                        <span className="task-title">{task.title}</span>
                                        <button
                                            className="star-button active"
                                            onClick={() => onToggleImportant(task.id)}
                                            aria-label="Remover de importantes"
                                        >
                                            ⭐
                                        </button>
                                    </div>
                                    <div className="task-meta">
                                        <span
                                            className="task-group-badge"
                                            style={{ backgroundColor: `${getGroupColor(task.groupId)}20`, color: getGroupColor(task.groupId) }}
                                        >
                                            {getGroupName(task.groupId)}
                                        </span>
                                        {task.dueDate && (
                                            <span className="task-date">📅 {new Date(task.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="task-actions">
                                <button
                                    className="action-button edit"
                                    onClick={() => onEdit(task)}
                                    aria-label="Editar"
                                >
                                    ✏️
                                </button>
                                <button
                                    className="action-button delete"
                                    onClick={() => onDelete(task.id)}
                                    aria-label="Excluir"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
