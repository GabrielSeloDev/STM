import { Task, Group } from '../../types'
import { TaskItem } from '../Tasks/TaskItem'
import { getDaysOfWeek, formatDateToISO, WeekInfo } from '../../utils/dateUtils'
import { DroppableDay } from '../Calendar/DroppableDay'
import './WeekGrid.css'

interface WeekGridProps {
    weekInfo: WeekInfo
    tasks: Task[]
    groups: Group[]
    onToggle: (id: string) => void
    onEdit: (task: Task) => void
    onDelete: (id: string) => void
    onDayClick?: (date: Date) => void
    onAddTask?: (initialData: Partial<Task>) => void
    selectedDate?: Date | null
}

export function WeekGrid({ weekInfo, tasks, groups, onToggle, onEdit, onDelete, onDayClick, onAddTask, selectedDate }: WeekGridProps) {
    const days = getDaysOfWeek(weekInfo)
    const weekDayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

    // Função para obter a cor do grupo
    const getGroupColor = (groupId: string | null) => {
        if (!groupId) return null
        const group = groups.find(g => g.id === groupId)
        return group?.color || null
    }

    // Obter tarefas de um dia específico
    const getTasksForDay = (date: Date) => {
        const dateStr = formatDateToISO(date)
        return tasks.filter(task => {
            // Aceitar tarefas com scope='date' OU tarefas sem scope mas com dueDate válido
            if (task.scope === 'date' && task.dueDate === dateStr) {
                return true
            }
            // Fallback: tarefas antigas sem scope mas com dueDate
            if (!task.scope && task.dueDate === dateStr) {
                return true
            }
            return false
        })
    }

    // Obter grupos únicos que têm tarefas em um dia específico
    const getGroupDotsForDay = (date: Date): Group[] => {
        const dayTasks = getTasksForDay(date)
        const uniqueGroupIds = Array.from(new Set(dayTasks.map(t => t.groupId).filter(Boolean)))
        return uniqueGroupIds
            .map(id => groups.find(g => g.id === id))
            .filter(Boolean) as Group[]
    }

    return (
        <div className="week-grid">
            {days.map((day, index) => {
                const dayTasks = getTasksForDay(day)
                const isToday = formatDateToISO(day) === formatDateToISO(new Date())
                const isSelected = selectedDate && formatDateToISO(day) === formatDateToISO(selectedDate)
                const groupDots = getGroupDotsForDay(day)

                return (
                    <div key={index} className={`week-day-column ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}>
                        <div
                            className="week-day-header"
                            onClick={() => onDayClick?.(day)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="week-day-info">
                                <span className="day-name">{weekDayNames[day.getDay()]}</span>
                                <span className="day-number">{day.getDate()}/{day.getMonth() + 1}</span>
                            </div>
                            {groupDots.length > 0 && (
                                <div className="week-header-dots">
                                    {groupDots.slice(0, 3).map(group => (
                                        <span
                                            key={group.id}
                                            className="week-group-dot"
                                            style={{ backgroundColor: group.color }}
                                            title={group.name}
                                        />
                                    ))}
                                    {groupDots.length > 3 && (
                                        <span className="week-dot-more">+{groupDots.length - 3}</span>
                                    )}
                                </div>
                            )}
                        </div>

                        <DroppableDay
                            date={day}
                            className="week-day-tasks"
                            onClick={() => onDayClick?.(day)}
                            onDoubleClick={() => {
                                if (onAddTask) {
                                    onAddTask({
                                        scope: 'date',
                                        dueDate: formatDateToISO(day)
                                    })
                                }
                            }}
                        >
                            {dayTasks.length === 0 ? (
                                <p className="no-tasks">Sem tarefas</p>
                            ) : (
                                dayTasks.map(task => (
                                    <TaskItem
                                        key={task.id}
                                        task={task}
                                        groupColor={getGroupColor(task.groupId)}
                                        onToggle={onToggle}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                    />
                                ))
                            )}
                        </DroppableDay>
                    </div>
                )
            })}
        </div>
    )
}
