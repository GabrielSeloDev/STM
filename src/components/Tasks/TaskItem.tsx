import { Task } from '../../types'
import './TaskItem.css'

interface TaskItemProps {
    task: Task
    groupColor?: string | null
    onToggle: (id: string) => void
    onToggleImportant?: (id: string) => void
    onEdit: (task: Task) => void
    onDelete: (id: string) => void
}

export function TaskItem({ task, groupColor, onToggle, onToggleImportant, onEdit, onDelete }: TaskItemProps) {
    // Cor padrão para tarefas sem grupo
    const barColor = groupColor || '#e5e7eb'

    return (
        <div className={`task-item ${task.isCompleted ? 'completed' : ''}`}>
            <div className="task-color-bar" style={{ backgroundColor: barColor }} />

            <div className="task-checkbox-wrapper">
                <input
                    type="checkbox"
                    checked={task.isCompleted}
                    onChange={() => onToggle(task.id)}
                    className="task-checkbox"
                />
            </div>

            <div className="task-content" onClick={() => onEdit(task)}>
                <div className="task-header-line">
                    <span className="task-title">
                        {task.isRecurring && (
                            <span title="Tarefa Recorrente" style={{ marginRight: '6px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>↻</span>
                        )}
                        {task.title}
                    </span>
                </div>

                <div className="task-meta-info">
                    {task.dueTime && (
                        <span className="task-time-badge">
                            {task.dueTime}
                        </span>
                    )}
                    {/* Data removida para evitar redundância na visualização de grade */}

                    {task.description && task.description.trim() && (
                        <span className="task-description-indicator" title="Tem descrição">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                        </span>
                    )}
                    {task.subtasks && task.subtasks.length > 0 && (
                        <span className="task-subtasks-badge" title={`${task.subtasks.filter(s => s.isCompleted).length} de ${task.subtasks.length} concluídas`}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 11l3 3L22 4" />
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            </svg>
                            {task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length}
                        </span>
                    )}
                </div>
            </div>

            <div className="task-actions">
                {onToggleImportant && (
                    <button
                        className={`task-btn task-btn-star ${task.isImportant ? 'active' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation()
                            onToggleImportant(task.id)
                        }}
                        title={task.isImportant ? "Remover de importantes" : "Marcar como importante"}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={task.isImportant ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                    </button>
                )}
                <button
                    className="task-btn task-btn-edit"
                    onClick={(e) => {
                        e.stopPropagation()
                        onEdit(task)
                    }}
                    title="Editar"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                </button>
                <button
                    className="task-btn task-btn-delete"
                    onClick={(e) => {
                        e.stopPropagation()
                        onDelete(task.id)
                    }}
                    title="Excluir"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                </button>
            </div>
        </div>
    )
}
