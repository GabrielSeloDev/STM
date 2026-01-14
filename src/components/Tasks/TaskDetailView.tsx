import { Task } from '../../types'
import './TaskDetailView.css'

interface TaskDetailViewProps {
    task: Task
    groupColor?: string | null
    onToggle: (id: string) => void
    onToggleSubtask?: (taskId: string, subtaskId: string) => void
    onEdit: (task: Task) => void
    onDelete: (id: string) => void
}

export function TaskDetailView({
    task,
    groupColor,
    onToggle,
    onToggleSubtask,
    onEdit,
    onDelete
}: TaskDetailViewProps) {
    const barColor = groupColor || '#e5e7eb'
    const completedSubtasks = task.subtasks?.filter(s => s.isCompleted).length || 0
    const totalSubtasks = task.subtasks?.length || 0

    return (
        <div className={`task-detail-view ${task.isCompleted ? 'completed' : ''}`}>
            <div className="task-detail-color-bar" style={{ backgroundColor: barColor }} />

            {/* Cabeçalho */}
            <div className="task-detail-header">
                <div className="task-detail-checkbox-wrapper">
                    <input
                        type="checkbox"
                        checked={task.isCompleted}
                        onChange={() => onToggle(task.id)}
                        className="task-detail-checkbox"
                    />
                </div>
                <h3 className="task-detail-title">{task.title}</h3>
            </div>

            {/* Meta Info */}
            {(task.dueDate || task.dueTime) && (
                <div className="task-detail-meta">
                    {task.dueDate && (
                        <span className="task-detail-date">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            {new Date(task.dueDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </span>
                    )}
                    {task.dueTime && (
                        <span className="task-detail-time">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {task.dueTime}
                        </span>
                    )}
                </div>
            )}

            {/* Descrição */}
            {task.description && task.description.trim() && (
                <div className="task-detail-description">
                    <div className="task-detail-section-header">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        <span>Descrição</span>
                    </div>
                    <p className="task-detail-description-text">{task.description}</p>
                </div>
            )}

            {/* Checklist */}
            {task.subtasks && task.subtasks.length > 0 && (
                <div className="task-detail-checklist">
                    <div className="task-detail-section-header">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 11l3 3L22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                        <span>Checklist</span>
                        <span className="checklist-progress">
                            {completedSubtasks}/{totalSubtasks}
                        </span>
                    </div>

                    {/* Barra de progresso */}
                    {totalSubtasks > 0 && (
                        <div className="checklist-progress-bar">
                            <div
                                className="checklist-progress-fill"
                                style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                            />
                        </div>
                    )}

                    <div className="checklist-items">
                        {task.subtasks.map((subtask) => (
                            <div key={subtask.id} className={`checklist-item ${subtask.isCompleted ? 'completed' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={subtask.isCompleted}
                                    onChange={() => onToggleSubtask?.(task.id, subtask.id)}
                                    className="checklist-checkbox"
                                />
                                <span className="checklist-item-text">{subtask.title}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Ações */}
            <div className="task-detail-actions">
                <button
                    className="task-detail-btn task-detail-btn-edit"
                    onClick={() => onEdit(task)}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Editar
                </button>
                <button
                    className="task-detail-btn task-detail-btn-delete"
                    onClick={() => {
                        if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
                            onDelete(task.id)
                        }
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Excluir
                </button>
            </div>
        </div>
    )
}
