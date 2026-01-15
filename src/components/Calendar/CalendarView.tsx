import { useState, useEffect, useMemo } from 'react'
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, pointerWithin } from '@dnd-kit/core'
import { Task, Group, Holiday, TaskInput } from '../../types'

import { DraggableTask } from '../Tasks/DraggableTask'
import { TaskDetailView } from '../Tasks/TaskDetailView'
import { CalendarGrid } from './CalendarGrid'
import { WeekGrid } from './WeekGrid'
import { DayGrid } from './DayGrid'
import {
    generateCalendarDays,
    getMonthName,
    formatDateToISO,
    getYearMonth,
    getCustomWeekInfo,
    getWeeksOfMonth,
    weekInfoToString,
    generateRecurringDates,
    WeekInfo
} from '../../utils/dateUtils'
import { getHolidays } from '../../utils/holidayUtils'
import './CalendarView.css'

interface CalendarViewProps {
    tasks: Task[]
    groups: Group[]
    onToggle: (id: string) => void
    onToggleSubtask?: (taskId: string, subtaskId: string) => void
    onEdit: (task: Task) => void
    onDelete: (id: string) => void
    onAddTask: (initialData?: Partial<Task>) => void
    onUpdateTask?: (id: string, updates: TaskInput) => Promise<void>
}

type ViewMode = 'month' | 'week' | 'day'

export function CalendarView({ tasks, groups, onToggle, onToggleSubtask, onEdit, onDelete, onAddTask, onUpdateTask }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [sidePanelDate, setSidePanelDate] = useState<Date | null>(null) // Estado separado para o side panel
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set()) // IDs das tarefas expandidas
    const [viewMode, setViewMode] = useState<ViewMode>('month')
    const [currentWeek, setCurrentWeek] = useState<WeekInfo | null>(getCustomWeekInfo(new Date()))
    const [holidays, setHolidays] = useState<Holiday[]>([])

    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()
    const calendarDays = generateCalendarDays(currentYear, currentMonth)

    // Configurar sensores para drag & drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 15, // Previne movimentos acidentais (15px mínimo)
            },
        })
    )

    // Carregar feriados quando o ano mudar
    useEffect(() => {
        const yearHolidays = getHolidays(currentYear)
        setHolidays(yearHolidays)
    }, [currentYear])

    // Função para obter a cor do grupo
    const getGroupColor = (groupId: string | null) => {
        if (!groupId) return null
        const group = groups.find(g => g.id === groupId)
        return group?.color || null
    }

    // Calcular tarefas combinadas (Reais + Virtuais)
    const combinedTasks = useMemo(() => {
        // Definir intervalo de visualização para projeção
        let startRange: Date
        let endRange: Date

        if (viewMode === 'month') {
            startRange = calendarDays[0]
            endRange = calendarDays[calendarDays.length - 1]
        } else if (viewMode === 'week' && currentWeek) {
            startRange = currentWeek.startDate
            endRange = currentWeek.endDate
        } else {
            // Day view
            startRange = selectedDate || currentDate
            endRange = selectedDate || currentDate
        }

        // 1. Identificar tarefas recorrentes e gerar virtuais
        const virtualTasks: Task[] = []
        const realTasksMap = new Set<string>()

        // Mapear tarefas reais para evitar duplicação (Chave: "YYYY-MM-DD|Título")
        tasks.forEach(t => {
            if (t.dueDate) {
                realTasksMap.add(`${t.dueDate}|${t.title}`)
            }
        })

        tasks.filter(t => t.isRecurring).forEach(task => {
            const dates = generateRecurringDates(task, startRange, endRange)

            dates.forEach(date => {
                const key = `${date}|${task.title}`

                // Só adiciona se não houver conflito com tarefa real
                if (!realTasksMap.has(key)) {
                    realTasksMap.add(key)

                    virtualTasks.push({
                        ...task,
                        id: `virtual-${task.id}-${date}`,
                        // @ts-ignore - Adicionando propriedade temporária para lookup
                        _originalId: task.id,
                        dueDate: date,
                        isVirtual: true,
                        isCompleted: false, // Virtuais são sempre "a fazer"
                        subtasks: task.subtasks?.map(s => ({ ...s, isCompleted: false })) // Resetar subtarefas
                    })
                }
            })
        })

        // Combinar reais + virtuais
        return [...tasks, ...virtualTasks]
    }, [tasks, viewMode, calendarDays, currentWeek, selectedDate, currentDate])

    // Navegar entre meses
    const navigateMonth = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate)
        if (direction === 'next') {
            newDate.setMonth(currentMonth + 1)
        } else {
            newDate.setMonth(currentMonth - 1)
        }
        setCurrentDate(newDate)
        setSelectedDate(null)

        // Atualizar semana se estiver em modo semanal
        if (viewMode === 'week') {
            const weekInfo = getCustomWeekInfo(newDate)
            setCurrentWeek(weekInfo)
        }
    }

    // Navegar entre semanas
    const navigateWeek = (direction: 'prev' | 'next') => {
        if (!currentWeek) return

        const weeks = getWeeksOfMonth(currentWeek.year, currentWeek.month)
        const currentIndex = weeks.findIndex(w => w.weekNumber === currentWeek.weekNumber)

        if (direction === 'next') {
            if (currentIndex < weeks.length - 1) {
                // Próxima semana no mesmo mês
                setCurrentWeek(weeks[currentIndex + 1])
            } else {
                // Primeira semana do próximo mês
                const nextMonth = currentWeek.month === 11 ? 0 : currentWeek.month + 1
                const nextYear = currentWeek.month === 11 ? currentWeek.year + 1 : currentWeek.year
                const nextWeeks = getWeeksOfMonth(nextYear, nextMonth)
                if (nextWeeks.length > 0) {
                    setCurrentWeek(nextWeeks[0])
                    setCurrentDate(new Date(nextYear, nextMonth, 1))
                }
            }
        } else {
            if (currentIndex > 0) {
                // Semana anterior no mesmo mês
                setCurrentWeek(weeks[currentIndex - 1])
            } else {
                // Última semana do mês anterior
                const prevMonth = currentWeek.month === 0 ? 11 : currentWeek.month - 1
                const prevYear = currentWeek.month === 0 ? currentWeek.year - 1 : currentWeek.year
                const prevWeeks = getWeeksOfMonth(prevYear, prevMonth)
                if (prevWeeks.length > 0) {
                    setCurrentWeek(prevWeeks[prevWeeks.length - 1])
                    setCurrentDate(new Date(prevYear, prevMonth, 1))
                }
            }
        }
    }

    // Navegar entre dias
    const navigateDay = (direction: 'prev' | 'next') => {
        const currentDay = selectedDate || currentDate
        const newDate = new Date(currentDay)

        if (direction === 'next') {
            newDate.setDate(newDate.getDate() + 1)
        } else {
            newDate.setDate(newDate.getDate() - 1)
        }

        setSelectedDate(newDate)
        setCurrentDate(newDate)

        // Atualizar semana se necessário
        const weekInfo = getCustomWeekInfo(newDate)
        setCurrentWeek(weekInfo)
    }

    // Sincronizar navegação ao trocar de visualização
    const handleViewChange = (mode: ViewMode) => {
        // Data alvo: sidePanelDate (clique recente) ou selectedDate ou hoje
        const targetDate = sidePanelDate || selectedDate || new Date()

        if (mode === 'day') {
            setSelectedDate(targetDate)
            // Garante que o side panel abra com o dia correto
            setSidePanelDate(targetDate)
        } else if (mode === 'week') {
            const weekInfo = getCustomWeekInfo(targetDate)
            setCurrentWeek(weekInfo)
            setCurrentDate(targetDate)
        } else if (mode === 'month') {
            setCurrentDate(targetDate)
            // Se está voltando para mês, seleciona o dia para feedback visual
            setSelectedDate(targetDate)
        }

        setViewMode(mode)
    }

    const goToToday = () => {
        const today = new Date()
        setCurrentDate(today)
        setSelectedDate(today)
        setCurrentWeek(getCustomWeekInfo(today))
    }

    // Lidar com clique em dia (navega para outro mês se necessário)
    const handleDayClick = (date: Date) => {
        const clickedMonth = date.getMonth()
        const clickedYear = date.getFullYear()

        // Se o dia clicado pertence a outro mês, navegar para esse mês
        if (clickedMonth !== currentMonth || clickedYear !== currentYear) {
            setCurrentDate(new Date(clickedYear, clickedMonth, 1))

            // Atualizar semana se estiver em modo semanal
            if (viewMode === 'week') {
                const weekInfo = getCustomWeekInfo(date)
                setCurrentWeek(weekInfo)
            }
        }

        // Sempre abre o side panel ao clicar em um dia/horário
        setSidePanelDate(date)

        // No modo diário, também atualiza o dia sendo exibido se for diferente
        if (viewMode === 'day' && formatDateToISO(date) !== formatDateToISO(selectedDate || new Date())) {
            setSelectedDate(date)
        }
    }

    // Handler para edição (intercepta tarefas virtuais)
    const handleProxyEdit = (task: Task) => {
        if (task.isVirtual) {
            // @ts-ignore
            const originalId = task._originalId
            const originalTask = tasks.find(t => t.id === originalId) ||
                tasks.find(t => t.title === task.title && t.isRecurring && t.groupId === task.groupId)

            if (originalTask) {
                if (window.confirm('Esta é uma ocorrência futura. Deseja editar a regra de recorrência original?')) {
                    onEdit(originalTask)
                }
            } else {
                alert('Não foi possível encontrar a tarefa original.')
            }
        } else {
            onEdit(task)
        }
    }

    // Handler para Drag & Drop
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (!over || !onUpdateTask) return

        const taskId = active.id as string
        const overData = over.data.current

        if (!overData) return

        // Drop em um Dia (sem horário específico ou Month/Week view)
        if (overData.type === 'day') {
            const newDate = overData.date as Date
            const newDateStr = formatDateToISO(newDate)

            // Buscar a tarefa atual
            const currentTask = tasks.find(t => t.id === taskId)

            // Se já está no dia E scope=date, ignorar (a menos que drop venha de time-slot)
            // Mas se for drop de day -> day, a linha abaixo evita refresh desnecessário
            if (currentTask && currentTask.dueDate === newDateStr && currentTask.scope === 'date' && !currentTask.dueTime) {
                return
            }

            try {
                await onUpdateTask(taskId, {
                    dueDate: newDateStr,
                    scope: 'date',
                    // Mantém o dueTime se existir?
                    // Geralmente arrastar para um dia no mês remove o horário? 
                    // Vamos assumir que arrastar para "Dia" no week/month view mantém horário se tiver, 
                    // ou limpa se for drop explícito "sem horário".
                    // Mas DroppableDay não tem hora.
                    // Vamos manter o horário se já tiver, senão fica sem. 
                    // O comportamento padrão é mudar DATA.
                })
                console.log(`✅ Tarefa ${taskId} reagendada para ${newDateStr}`)
            } catch (error) {
                console.error('❌ Erro ao reagendar tarefa:', error)
            }
        }
        // Drop em um Slot de Horário (Day View)
        else if (overData.type === 'time-slot') {
            const newDateStr = overData.dateStr as string
            const hour = overData.hour as number
            const newTimeStr = `${String(hour).padStart(2, '0')}:00`

            const currentTask = tasks.find(t => t.id === taskId)

            // Se já está neste horário, ignorar
            if (currentTask && currentTask.dueDate === newDateStr && currentTask.dueTime === newTimeStr) {
                return
            }

            try {
                await onUpdateTask(taskId, {
                    dueDate: newDateStr,
                    dueTime: newTimeStr,
                    scope: 'date'
                })
                console.log(`✅ Tarefa ${taskId} reagendada para ${newDateStr} às ${newTimeStr}`)
            } catch (error) {
                console.error('❌ Erro ao reagendar tarefa para horário:', error)
            }
        }
        // Drop na zona "Dia Inteiro" (remove horário)
        else if (overData.type === 'all-day') {
            const newDateStr = overData.dateStr as string

            const currentTask = tasks.find(t => t.id === taskId)

            // Se já está no dia sem horário, ignorar
            if (currentTask && currentTask.dueDate === newDateStr && !currentTask.dueTime) {
                return
            }

            try {
                await onUpdateTask(taskId, {
                    dueDate: newDateStr,
                    dueTime: null, // Define explicitamente como null para remover horário
                    scope: 'date'
                })
                console.log(`✅ Tarefa ${taskId} movida para Dia Inteiro em ${newDateStr}`)
            } catch (error) {
                console.error('❌ Erro ao mover tarefa para dia inteiro:', error)
            }
        }
    }

    // Toggle expansão de tarefa no side panel
    const toggleTaskExpansion = (taskId: string) => {
        setExpandedTasks(prev => {
            const newSet = new Set(prev)
            if (newSet.has(taskId)) {
                newSet.delete(taskId)
            } else {
                newSet.add(taskId)
            }
            return newSet
        })
    }

    // Filtrar tarefas para exibição
    const getTasksToDisplay = () => {
        const currentYearMonth = getYearMonth(currentDate)

        // Definir intervalo de visualização para projeção
        let startRange: Date
        let endRange: Date

        if (viewMode === 'month') {
            startRange = calendarDays[0]
            endRange = calendarDays[calendarDays.length - 1]
        } else if (viewMode === 'week' && currentWeek) {
            startRange = currentWeek.startDate
            endRange = currentWeek.endDate
        } else {
            // Day view
            startRange = selectedDate || currentDate
            endRange = selectedDate || currentDate
        }

        // 1. Identificar tarefas recorrentes e gerar virtuais
        const virtualTasks: Task[] = []
        const realTasksMap = new Set<string>()

        // Mapear tarefas reais para evitar duplicação (Chave: "YYYY-MM-DD|Título")
        tasks.forEach(t => {
            if (t.dueDate) {
                realTasksMap.add(`${t.dueDate}|${t.title}`)
            }
        })

        tasks.filter(t => t.isRecurring).forEach(task => {
            const dates = generateRecurringDates(task, startRange, endRange)

            dates.forEach(date => {
                const key = `${date}|${task.title}`

                // Só adiciona se não houver conflito com tarefa real
                if (!realTasksMap.has(key)) {
                    // Adiciona ao mapa para evitar duplicatas entre as próprias virtuais
                    // (ex: tarefa de segunda projeta quarta, tarefa de terça projeta quarta)
                    realTasksMap.add(key)

                    virtualTasks.push({
                        ...task,
                        id: `virtual-${task.id}-${date}`,
                        // @ts-ignore - Adicionando propriedade temporária para lookup
                        _originalId: task.id,
                        dueDate: date,
                        isVirtual: true,
                        isCompleted: false, // Virtuais são sempre "a fazer"
                        subtasks: task.subtasks?.map(s => ({ ...s, isCompleted: false })) // Resetar subtarefas
                    })
                }
            })
        })

        // Combinar reais + virtuais
        const allTasks = [...tasks, ...virtualTasks]

        // 2. Filtragem normal usando a lista combinada
        // Tarefas do mês
        const monthTasks = allTasks.filter(task =>
            task.scope === 'month' && task.targetMonth === currentYearMonth
        )

        // Tarefas do dia selecionado
        const dayTasks = selectedDate
            ? allTasks.filter(task => {
                const dateStr = formatDateToISO(selectedDate)
                if (task.scope === 'date' && task.dueDate === dateStr) return true
                if (!task.scope && task.dueDate === dateStr) return true
                return false
            })
            : []

        // Tarefas da semana
        const weekTasks = currentWeek
            ? allTasks.filter(task =>
                task.scope === 'week' && task.targetWeek === weekInfoToString(currentWeek)
            )
            : []

        return { monthTasks, dayTasks, weekTasks }
    }

    const { monthTasks, dayTasks, weekTasks } = getTasksToDisplay()

    // Tarefas para o side panel (usa sidePanelDate)
    const sidePanelTasks = sidePanelDate
        ? combinedTasks.filter(task => {
            const dateStr = formatDateToISO(sidePanelDate)
            if (task.scope === 'date' && task.dueDate === dateStr) {
                return true
            }
            if (!task.scope && task.dueDate === dateStr) {
                return true
            }
            return false
        })
        : []

    // Debug
    console.log('📊 [CalendarView] Tarefas recebidas:', tasks.length)
    console.log('📊 [CalendarView] Tarefas do mês:', monthTasks.length)
    console.log('📊 [CalendarView] Tarefas do dia:', dayTasks.length)

    return (
        <DndContext
            sensors={sensors}
            onDragEnd={handleDragEnd}
            collisionDetection={pointerWithin}
        >
            <div className="calendar-view-container">
                {/* Cabeçalho */}
                <div className="calendar-header">
                    <div className="calendar-controls">
                        <button className="btn-today" onClick={goToToday}>
                            Hoje
                        </button>
                        <div className={`date-navigation ${viewMode === 'week' ? 'week-mode' : ''}`}>
                            {viewMode === 'week' ? (
                                <>
                                    <div className="nav-buttons-group">
                                        <button className="btn-nav" onClick={() => navigateWeek('prev')}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="15 18 9 12 15 6" />
                                            </svg>
                                        </button>
                                        <button className="btn-nav" onClick={() => navigateWeek('next')}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                        </button>
                                    </div>
                                    <h2 className="current-month">
                                        {currentWeek ? `${currentWeek.label} - ${getMonthName(currentWeek.month)} ${currentWeek.year}` : ''}
                                    </h2>
                                </>
                            ) : (
                                <>
                                    <div className="nav-buttons-group">
                                        <button className="btn-nav" onClick={() => {
                                            if (viewMode === 'month') navigateMonth('prev')
                                            else navigateDay('prev')
                                        }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="15 18 9 12 15 6" />
                                            </svg>
                                        </button>
                                        <button className="btn-nav" onClick={() => {
                                            if (viewMode === 'month') navigateMonth('next')
                                            else navigateDay('next')
                                        }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="9 18 15 12 9 6" />
                                            </svg>
                                        </button>
                                    </div>
                                    <h2 className="current-month">
                                        {viewMode === 'month'
                                            ? `${getMonthName(currentMonth)} ${currentYear}`
                                            : (selectedDate || currentDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
                                        }
                                    </h2>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="view-controls">
                        <div className="view-mode-selector">
                            <button
                                className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
                                onClick={() => handleViewChange('month')}
                            >
                                Mês
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
                                onClick={() => handleViewChange('week')}
                            >
                                Semana
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'day' ? 'active' : ''}`}
                                onClick={() => handleViewChange('day')}
                            >
                                Dia
                            </button>
                        </div>

                        <button className="btn-add-task" onClick={() => onAddTask()}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Nova Tarefa
                        </button>
                    </div>
                </div>

                {/* Container Principal com Grid e Painel Lateral */}
                <div className="calendar-content-wrapper">
                    {/* Grid do Calendário */}
                    <div className="calendar-main">
                        {viewMode === 'month' ? (
                            <CalendarGrid
                                days={calendarDays}
                                currentYear={currentYear}
                                currentMonth={currentMonth}
                                tasks={combinedTasks}
                                groups={groups}
                                holidays={holidays}
                                onDayClick={handleDayClick}
                                onAddTask={onAddTask}
                                selectedDate={sidePanelDate}
                            />
                        ) : viewMode === 'week' && currentWeek ? (
                            <WeekGrid
                                weekInfo={currentWeek}
                                tasks={combinedTasks}
                                groups={groups}
                                onToggle={onToggle}
                                onEdit={handleProxyEdit}
                                onDelete={onDelete}
                                onDayClick={handleDayClick}
                                onAddTask={onAddTask}
                                selectedDate={sidePanelDate}
                            />
                        ) : viewMode === 'day' && selectedDate ? (
                            <DayGrid
                                selectedDate={selectedDate}
                                tasks={combinedTasks}
                                groups={groups}
                                onToggle={onToggle}
                                onEdit={handleProxyEdit}
                                onDelete={onDelete}
                                onAddTask={onAddTask}
                                onDayClick={handleDayClick}
                            />
                        ) : null}

                        {/* Metas da Semana (apenas no modo semanal, acima das metas do mês) */}
                        {viewMode === 'week' && currentWeek && (
                            <div className="tasks-section week-tasks-section">
                                <h3 className="section-title">
                                    Metas da {currentWeek.label}
                                </h3>
                                <div className="tasks-list">
                                    {weekTasks.length === 0 ? (
                                        <p className="empty-message">Nenhuma meta semanal definida</p>
                                    ) : (
                                        weekTasks.map(task => (
                                            <DraggableTask
                                                key={task.id}
                                                task={task}
                                                groupColor={getGroupColor(task.groupId)}
                                                onToggle={onToggle}
                                                onEdit={handleProxyEdit}
                                                onDelete={onDelete}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Metas do Mês (abaixo do grid) - não mostrar no modo dia */}
                        {viewMode !== 'day' && (
                            <div className="tasks-section month-tasks-section">
                                <h3 className="section-title">
                                    Metas de {getMonthName(currentMonth)}
                                </h3>
                                <div className="tasks-list">
                                    {monthTasks.length === 0 ? (
                                        <p className="empty-message">Nenhuma meta mensal definida</p>
                                    ) : (
                                        monthTasks.map(task => (
                                            <DraggableTask
                                                key={task.id}
                                                task={task}
                                                groupColor={getGroupColor(task.groupId)}
                                                onToggle={onToggle}
                                                onEdit={handleProxyEdit}
                                                onDelete={onDelete}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Painel Lateral - Aparece quando um dia está selecionado (todas as views) */}
                    {sidePanelDate && (
                        <div className="side-panel">
                            <div className="side-panel-header">
                                <h3 className="side-panel-title">
                                    {sidePanelDate.toLocaleDateString('pt-BR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </h3>
                                <button
                                    className="side-panel-close"
                                    onClick={() => setSidePanelDate(null)}
                                    aria-label="Fechar painel"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            <div className="side-panel-content">
                                <div className="task-count">
                                    {sidePanelTasks.length === 0 ? (
                                        <span className="no-tasks-badge">Sem tarefas</span>
                                    ) : (
                                        <span className="tasks-badge">
                                            {sidePanelTasks.length} {sidePanelTasks.length === 1 ? 'tarefa' : 'tarefas'}
                                        </span>
                                    )}
                                </div>

                                <div className="side-panel-tasks">
                                    {sidePanelTasks.length === 0 ? (
                                        <div className="empty-state">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="12" y1="8" x2="12" y2="12" />
                                                <line x1="12" y1="16" x2="12.01" y2="16" />
                                            </svg>
                                            <p>Não há tarefas para este dia</p>
                                        </div>
                                    ) : (
                                        sidePanelTasks.map(task => {
                                            const isExpanded = expandedTasks.has(task.id)
                                            const hasRichContent = task.description || (task.subtasks && task.subtasks.length > 0)

                                            return (
                                                <div key={task.id} style={{ marginBottom: '12px' }}>
                                                    {isExpanded ? (
                                                        <div>
                                                            <TaskDetailView
                                                                task={task}
                                                                groupColor={getGroupColor(task.groupId)}
                                                                onToggle={onToggle}
                                                                onToggleSubtask={onToggleSubtask}
                                                                onEdit={handleProxyEdit}
                                                                onDelete={onDelete}
                                                            />
                                                            {hasRichContent && (
                                                                <button
                                                                    onClick={() => toggleTaskExpansion(task.id)}
                                                                    style={{
                                                                        marginTop: '8px',
                                                                        padding: '6px 12px',
                                                                        background: 'var(--bg-tertiary)',
                                                                        border: '1px solid var(--border-color)',
                                                                        borderRadius: 'var(--radius-sm)',
                                                                        color: 'var(--text-secondary)',
                                                                        fontSize: '12px',
                                                                        cursor: 'pointer',
                                                                        width: '100%'
                                                                    }}
                                                                >
                                                                    ▲ Recolher
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <DraggableTask
                                                                task={task}
                                                                groupColor={getGroupColor(task.groupId)}
                                                                onToggle={onToggle}
                                                                onEdit={onEdit}
                                                                onDelete={onDelete}
                                                            />
                                                            {hasRichContent && (
                                                                <button
                                                                    onClick={() => toggleTaskExpansion(task.id)}
                                                                    style={{
                                                                        marginTop: '8px',
                                                                        padding: '6px 12px',
                                                                        background: 'var(--bg-tertiary)',
                                                                        border: '1px solid var(--border-color)',
                                                                        borderRadius: 'var(--radius-sm)',
                                                                        color: 'var(--text-secondary)',
                                                                        fontSize: '12px',
                                                                        cursor: 'pointer',
                                                                        width: '100%',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        gap: '4px'
                                                                    }}
                                                                >
                                                                    ▼ Ver detalhes
                                                                    {task.description && ' 📄'}
                                                                    {task.subtasks && task.subtasks.length > 0 && ` ✓ ${task.subtasks.filter(s => s.isCompleted).length}/${task.subtasks.length}`}
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </DndContext>
    )
}
