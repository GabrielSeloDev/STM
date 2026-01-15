import { useDraggable } from '@dnd-kit/core'
import { Task } from '../../types'
import { TaskItem } from './TaskItem'

interface DraggableTaskProps {
    task: Task
    groupColor?: string | null
    onToggle: (id: string) => void
    onToggleImportant?: (id: string) => void
    onEdit: (task: Task) => void
    onDelete: (id: string) => void
}

export function DraggableTask({ task, groupColor, onToggle, onToggleImportant, onEdit, onDelete }: DraggableTaskProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: {
            task,
            type: 'task'
        },
        disabled: task.isVirtual // Desabilita arrastar para tarefas virtuais
    })

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : (task.isVirtual ? 0.6 : 1),
        cursor: isDragging ? 'grabbing' : 'grab',
        filter: task.isVirtual ? 'grayscale(0.8)' : 'none'
    } : {
        // Estilo para tarefas virtuais estáticas (não arrastando)
        opacity: task.isVirtual ? 0.6 : 1,
        filter: task.isVirtual ? 'grayscale(0.8)' : 'none'
    }

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            <TaskItem
                task={task}
                groupColor={groupColor}
                onToggle={onToggle}
                onToggleImportant={onToggleImportant}
                onEdit={onEdit}
                onDelete={onDelete}
            />
        </div>
    )
}
