import { useDroppable } from '@dnd-kit/core'
import { ReactNode } from 'react'

interface DroppableDayProps {
    date: Date
    children: ReactNode
    className?: string
    onClick?: () => void
    onDoubleClick?: () => void
}

export function DroppableDay({ date, children, className = '', onClick, onDoubleClick }: DroppableDayProps) {
    // Criar ID único baseado na data (YYYY-MM-DD)
    const dateId = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    const { setNodeRef, isOver } = useDroppable({
        id: `day-${dateId}`,
        data: {
            date,
            type: 'day'
        }
    })

    const dropIndicatorClass = isOver ? 'drop-target-active' : ''

    return (
        <div
            ref={setNodeRef}
            className={`${className} ${dropIndicatorClass}`}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
        >
            {children}
        </div>
    )
}
