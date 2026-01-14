import { useDroppable } from '@dnd-kit/core'
import { ReactNode } from 'react'

interface DroppableAllDayZoneProps {
    dateStr: string
    children: ReactNode
    className?: string
}

export function DroppableAllDayZone({ dateStr, children, className }: DroppableAllDayZoneProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: `all-day-${dateStr}`,
        data: {
            type: 'all-day',
            dateStr: dateStr
        }
    })

    return (
        <div
            ref={setNodeRef}
            className={`${className} ${isOver ? 'drag-over' : ''}`}
            style={{
                transition: 'background-color 0.2s ease',
                backgroundColor: isOver ? 'var(--bg-hover)' : undefined,
                minHeight: '60px' // Garante altura mínima para drop mesmo sem tarefas
            }}
        >
            {children}
        </div>
    )
}
