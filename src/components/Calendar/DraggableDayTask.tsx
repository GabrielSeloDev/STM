import { useDraggable } from '@dnd-kit/core'
import { Task } from '../../types'
import { CSS } from '@dnd-kit/utilities'

interface DraggableDayTaskProps {
    task: Task
    groupColor: string | null
    onToggle: (id: string) => void
    onEdit: (task: Task) => void
    onDelete: (id: string) => void
    className?: string // Para permitir classes extras como 'all-day'
}

export function DraggableDayTask({ task, groupColor, onToggle, onEdit, onDelete, className = '' }: DraggableDayTaskProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: {
            task,
            type: 'task'
        }
    })

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        borderLeftColor: groupColor || 'var(--accent-primary)',
        backgroundColor: groupColor ? `${groupColor}15` : 'var(--bg-secondary)',
        zIndex: isDragging ? 1000 : 'auto'
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`day-task-card ${className} ${task.isCompleted ? 'completed' : ''}`}
        >
            <input
                type="checkbox"
                checked={task.isCompleted}
                onChange={(e) => {
                    e.stopPropagation() // Previne trigger do drag se clicar no checkbox
                    onToggle(task.id)
                }}
                className="day-task-checkbox"
                onPointerDown={(e) => e.stopPropagation()} // Importante para permitir clique no checkbox sem iniciar drag
            />
            <div className="day-task-content">
                {task.dueTime && !className.includes('all-day') && (
                    <span className="task-time-badge">{task.dueTime}</span>
                )}
                <span className="day-task-title" onClick={(e) => {
                    e.stopPropagation()
                    onEdit(task)
                }}>
                    {task.isRecurring && (
                        <span title="Tarefa Recorrente" style={{ marginRight: '4px', fontWeight: 'bold' }}>↻</span>
                    )}
                    {task.title}
                </span>
            </div>
            <button
                className="btn-delete-task"
                onClick={(e) => {
                    e.stopPropagation()
                    onDelete(task.id)
                }}
                onPointerDown={(e) => e.stopPropagation()}
                title="Excluir tarefa"
            >
                ×
            </button>
        </div>
    )
}
