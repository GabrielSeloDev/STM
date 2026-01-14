import { Task, Group } from '../../types'
import { formatDateToISO } from '../../utils/dateUtils'
import './DayGrid.css'

interface DayGridProps {
    selectedDate: Date
    tasks: Task[]
    groups: Group[]
    onToggle: (id: string) => void
    onEdit: (task: Task) => void
    onDelete: (id: string) => void
    onAddTask?: (initialData: Partial<Task>) => void
    onDayClick?: (date: Date) => void
}

import { DroppableTimeSlot } from './DroppableTimeSlot'
import { DroppableAllDayZone } from './DroppableAllDayZone'
import { DraggableDayTask } from './DraggableDayTask'

export function DayGrid({ selectedDate, tasks, groups, onToggle, onEdit, onDelete, onAddTask, onDayClick }: DayGridProps) {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const dateStr = formatDateToISO(selectedDate)

    // Filtrar tarefas do dia
    const dayTasks = tasks.filter(task => {
        // ... lógica de filtro mantida ...
        if (task.scope === 'date' && task.dueDate === dateStr) {
            return true
        }
        if (!task.scope && task.dueDate === dateStr) {
            return true
        }
        return false
    })

    // Separar tarefas com horário e sem horário
    const tasksWithTime = dayTasks.filter(t => t.dueTime)
    const tasksWithoutTime = dayTasks.filter(t => !t.dueTime)

    // Obter a cor do grupo
    const getGroupColor = (groupId: string | null) => {
        if (!groupId) return null
        const group = groups.find(g => g.id === groupId)
        return group?.color || null
    }

    // Obter tarefas de uma hora específica
    const getTasksAtHour = (hour: number) => {
        return tasksWithTime.filter(task => {
            if (!task.dueTime) return false
            const taskHour = parseInt(task.dueTime.split(':')[0])
            return taskHour === hour
        })
    }

    const handleTimeSlotClick = (hour: number) => {
        if (onAddTask) {
            const timeStr = `${String(hour).padStart(2, '0')}:00`
            onAddTask({
                scope: 'date',
                dueDate: dateStr,
                dueTime: timeStr
            })
        }
    }

    // Obter hora atual para destacar
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinutes = now.getMinutes()
    const isToday = dateStr === formatDateToISO(now)

    return (
        <div className="day-grid">
            {/* Tarefas sem horário (dia todo) */}
            {/* Tarefas sem horário (dia todo) */}
            <div className="all-day-tasks">
                <div className="all-day-header">
                    <span className="all-day-label">Dia inteiro</span>
                    <span className="all-day-count">{tasksWithoutTime.length}</span>
                </div>
                <DroppableAllDayZone
                    dateStr={dateStr}
                    className="all-day-task-list"
                >
                    {tasksWithoutTime.length > 0 ? (
                        tasksWithoutTime.map(task => (
                            <DraggableDayTask
                                key={task.id}
                                task={task}
                                groupColor={getGroupColor(task.groupId)}
                                onToggle={onToggle}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                className="all-day"
                            />
                        ))
                    ) : (
                        <div className="drag-hint" style={{ padding: '8px', opacity: 0.5, fontSize: '13px', fontStyle: 'italic', textAlign: 'center' }}>
                            Arraste tarefas para cá para definir como dia inteiro
                        </div>
                    )}
                </DroppableAllDayZone>
            </div>

            {/* Grade de horários com linha do tempo */}
            <div className="time-grid-container">
                {/* Linha do tempo atual */}
                {isToday && (
                    <div
                        className="current-time-line"
                        style={{
                            top: `${(currentHour + currentMinutes / 60) * 80}px` // 80px = altura de cada time-slot
                        }}
                    >
                        <div className="time-indicator">
                            <div className="time-dot"></div>
                            <div className="time-label">
                                {String(currentHour).padStart(2, '0')}:{String(currentMinutes).padStart(2, '0')}
                            </div>
                        </div>
                    </div>
                )}

                <div className="day-time-grid-single-column">
                    {hours.map(hour => {
                        const hourTasks = getTasksAtHour(hour)
                        const isPastHour = isToday && hour < currentHour
                        const isCurrentHour = isToday && hour === currentHour

                        return (
                            <div key={hour} className={`time-slot ${isPastHour ? 'past' : ''} ${isCurrentHour ? 'current' : ''}`}>
                                <div
                                    className="time-label-column"
                                    onClick={() => onDayClick?.(selectedDate)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <span className="hour-label">{String(hour).padStart(2, '0')}:00</span>
                                </div>
                                <DroppableTimeSlot
                                    hour={hour}
                                    dateStr={dateStr}
                                    className="time-content-column"
                                    onClick={() => onDayClick?.(selectedDate)}
                                    onDoubleClick={() => handleTimeSlotClick(hour)}
                                >
                                    {hourTasks.length > 0 ? (
                                        <div className="hour-tasks">
                                            {hourTasks.map(task => (
                                                <DraggableDayTask
                                                    key={task.id}
                                                    task={task}
                                                    groupColor={getGroupColor(task.groupId)}
                                                    onToggle={onToggle}
                                                    onEdit={onEdit}
                                                    onDelete={onDelete}
                                                />
                                            ))}
                                        </div>
                                    ) : null}
                                </DroppableTimeSlot>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
