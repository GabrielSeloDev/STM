import { Task, Group, Holiday } from '../../types'
import { formatDateToISO, isCurrentMonth } from '../../utils/dateUtils'
import { DroppableDay } from './DroppableDay'
import './CalendarGrid.css'

interface CalendarGridProps {
    days: Date[]
    currentYear: number
    currentMonth: number
    tasks: Task[]
    groups: Group[]
    holidays: Holiday[]
    onDayClick: (date: Date) => void
    onAddTask?: (initialData: Partial<Task>) => void
    selectedDate: Date | null
}

export function CalendarGrid({
    days,
    currentYear,
    currentMonth,
    tasks,
    groups,
    holidays,
    onDayClick,
    onAddTask,
    selectedDate
}: CalendarGridProps) {

    // Debug: log uma vez quando o componente renderiza
    console.log('🎨 [CalendarGrid] Renderizando com', tasks.length, 'tarefas')
    console.log('📅 Tarefas recebidas:', tasks.map(t => ({
        title: t.title,
        scope: t.scope,
        dueDate: t.dueDate
    })))

    // Obter grupos únicos que têm tarefas em um dia específico
    const getGroupDotsForDay = (date: Date): Group[] => {
        const dateStr = formatDateToISO(date)

        // Filtrar tarefas que aparecem neste dia
        const dayTasks = tasks.filter(task => {
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

        // Debug temporário
        if (dateStr === formatDateToISO(new Date())) {
            console.log('🔍 [CalendarGrid] DEBUG HOJE:', dateStr)
            console.log('📋 Total de tarefas:', tasks.length)
            console.log('📅 Tarefas com dueDate:', tasks.filter(t => t.dueDate).map(t => ({
                title: t.title,
                dueDate: t.dueDate,
                scope: t.scope
            })))
            console.log('✅ Tarefas encontradas para hoje:', dayTasks.length)
        }

        // Obter IDs únicos de grupos (incluindo null para tarefas sem grupo)
        const uniqueGroupIds = Array.from(new Set(dayTasks.map(t => t.groupId)))

        // Retornar objetos de grupo (incluindo um "grupo virtual" para tarefas sem grupo)
        return uniqueGroupIds
            .map(id => {
                if (id === null || id === undefined) {
                    // Criar um "grupo virtual" para tarefas sem grupo
                    return {
                        id: 'no-group',
                        name: 'Sem grupo',
                        color: '#707070' // Cor cinza para tarefas sem grupo
                    } as Group
                }
                return groups.find(g => g.id === id)
            })
            .filter(Boolean) as Group[]
    }

    return (
        <div className="calendar-grid">
            {/* Cabeçalho com dias da semana */}
            <div className="calendar-weekdays">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="weekday-label">{day}</div>
                ))}
            </div>

            {/* Grid de dias */}
            <div className="calendar-days">
                {days.map((date, index) => {
                    const isToday = formatDateToISO(date) === formatDateToISO(new Date())
                    const isSelected = selectedDate && formatDateToISO(date) === formatDateToISO(selectedDate)
                    const isOtherMonth = !isCurrentMonth(date, currentYear, currentMonth)
                    const groupDots = getGroupDotsForDay(date)
                    const holiday = holidays.find(h => h.date === formatDateToISO(date))

                    const handleDoubleClick = () => {
                        if (onAddTask) {
                            onAddTask({
                                scope: 'date',
                                dueDate: formatDateToISO(date)
                            })
                        }
                    }

                    return (
                        <DroppableDay
                            key={index}
                            date={date}
                            className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isOtherMonth ? 'other-month' : ''} ${holiday ? 'has-holiday' : ''}`}
                            onClick={() => onDayClick(date)}
                            onDoubleClick={handleDoubleClick}
                        >
                            <span className="day-number">{date.getDate()}</span>
                            {holiday && (
                                <span className="holiday-label" title={holiday.name}>
                                    {holiday.name}
                                </span>
                            )}
                            {groupDots.length > 0 && (
                                <div className="group-dots">
                                    {groupDots.slice(0, 3).map(group => (
                                        <span
                                            key={group.id}
                                            className="group-dot"
                                            style={{ backgroundColor: group.color }}
                                            title={group.name}
                                        />
                                    ))}
                                    {groupDots.length > 3 && (
                                        <span className="group-dot-more">+{groupDots.length - 3}</span>
                                    )}
                                </div>
                            )}
                        </DroppableDay>
                    )
                })}
            </div>
        </div>
    )
}
