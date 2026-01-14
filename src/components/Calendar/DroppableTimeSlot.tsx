import { useDroppable } from '@dnd-kit/core'
import { ReactNode } from 'react'

interface DroppableTimeSlotProps {
    hour: number
    dateStr: string
    children: ReactNode
    className?: string
    onClick?: () => void
    onDoubleClick?: () => void
}

export function DroppableTimeSlot({ hour, dateStr, children, className, onClick, onDoubleClick }: DroppableTimeSlotProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: `time-slot-${dateStr}-${hour}`,
        data: {
            type: 'time-slot',
            dateStr: dateStr,
            hour: hour
        }
    })

    return (
        <div
            ref={setNodeRef}
            className={`${className} ${isOver ? 'drag-over' : ''}`}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            style={{
                backgroundColor: isOver ? 'var(--bg-hover)' : undefined,
                transition: 'background-color 0.2s ease'
            }}
        >
            {children}
        </div>
    )
}
