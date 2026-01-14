import { useState, useEffect } from 'react'
import { Task, Group, Subtask } from '../../types'
import { getWeeksOfMonth, getCustomWeekInfo, weekInfoToString, stringToWeekInfo } from '../../utils/dateUtils'
import { DateSelector } from '../Common/DateSelector'
import { TimeSelector } from '../Common/TimeSelector'
import './TaskFormModal.css'

interface TaskFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: {
        title: string
        description?: string | null
        groupId: string | null
        scope: 'date' | 'week' | 'month'
        dueDate?: string | null
        dueTime?: string | null
        targetWeek?: string | null
        targetMonth?: string | null
        subtasks?: Partial<Subtask>[]
    }) => void
    onDelete?: (taskId: string) => void
    groups: Group[]
    editingTask?: Task | null
    initialTaskData?: Partial<Task> | null
}

export function TaskFormModal({ isOpen, onClose, onSubmit, onDelete, groups, editingTask, initialTaskData }: TaskFormModalProps) {
    const [title, setTitle] = useState(editingTask?.title || '')
    const [description, setDescription] = useState(editingTask?.description || '')
    const [groupId, setGroupId] = useState<string | null>(editingTask?.groupId || null)
    const [scope, setScope] = useState<'date' | 'week' | 'month'>(editingTask?.scope || 'date')
    const [dueDate, setDueDate] = useState<string>(editingTask?.dueDate || '')
    const [dueTime, setDueTime] = useState<string>(editingTask?.dueTime || '')

    // Para semanas: ano, mês e número da semana
    const [weekYear, setWeekYear] = useState<number>(new Date().getFullYear())
    const [weekMonth, setWeekMonth] = useState<number>(new Date().getMonth())
    const [selectedWeek, setSelectedWeek] = useState<string>('')

    const [targetMonth, setTargetMonth] = useState<string>('')

    // Subtarefas
    const [subtasks, setSubtasks] = useState<Partial<Subtask>[]>(editingTask?.subtasks || [])
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

    // Recorrência
    const [isRecurring, setIsRecurring] = useState(editingTask?.isRecurring || false)
    const [recurrencePattern, setRecurrencePattern] = useState<string>(editingTask?.recurrencePattern || 'daily')
    const [recurrenceInterval, setRecurrenceInterval] = useState<number>(editingTask?.recurrenceInterval || 1)
    const [recurrenceDays, setRecurrenceDays] = useState<number[]>(editingTask?.recurrenceDays || [])
    const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>(editingTask?.recurrenceEndDate || '')

    // Gerar lista de semanas do mês selecionado
    const availableWeeks = getWeeksOfMonth(weekYear, weekMonth)

    useEffect(() => {
        if (editingTask) {
            setTitle(editingTask.title)
            setDescription(editingTask.description || '')
            setGroupId(editingTask.groupId)
            setSubtasks(editingTask.subtasks || [])
            // Fallback: se a tarefa não tem scope, inferir baseado nos campos
            const inferredScope = editingTask.scope || (editingTask.dueDate ? 'date' : 'month')
            setScope(inferredScope)
            setDueDate(editingTask.dueDate || '')
            setDueTime(editingTask.dueTime || '')

            if (editingTask.scope === 'week' && editingTask.targetWeek) {
                const weekInfo = stringToWeekInfo(editingTask.targetWeek)
                if (weekInfo) {
                    setWeekYear(weekInfo.year)
                    setWeekMonth(weekInfo.month)
                    setSelectedWeek(editingTask.targetWeek)
                }
            }

            if (editingTask.scope === 'month' && editingTask.targetMonth) {
                setTargetMonth(editingTask.targetMonth)
            }

            // Recorrência
            setIsRecurring(!!editingTask.isRecurring)
            setRecurrencePattern(editingTask.recurrencePattern || 'daily')
            setRecurrenceInterval(editingTask.recurrenceInterval || 1)
            setRecurrenceDays(editingTask.recurrenceDays || [])
            setRecurrenceEndDate(editingTask.recurrenceEndDate || '')
        } else {
            // Reset para nova tarefa
            setTitle('')
            setDescription('')
            setSubtasks([])
            setNewSubtaskTitle('')

            // Reset recorrência
            setIsRecurring(false)
            setRecurrencePattern('daily')
            setRecurrenceInterval(1)
            setRecurrenceDays([])
            setRecurrenceEndDate('')

            setGroupId(initialTaskData?.groupId || null)
            setScope(initialTaskData?.scope || 'date')
            setDueDate(initialTaskData?.dueDate || '')
            setDueTime(initialTaskData?.dueTime || '')

            const now = new Date()
            setWeekYear(now.getFullYear())
            setWeekMonth(now.getMonth())

            // Se initialTaskData tem targetWeek, usar
            if (initialTaskData?.targetWeek) {
                const weekInfo = stringToWeekInfo(initialTaskData.targetWeek)
                if (weekInfo) {
                    setWeekYear(weekInfo.year)
                    setWeekMonth(weekInfo.month)
                    setSelectedWeek(initialTaskData.targetWeek)
                }
            } else {
                const currentWeekInfo = getCustomWeekInfo(now)
                if (currentWeekInfo) {
                    setSelectedWeek(weekInfoToString(currentWeekInfo))
                }
            }

            // Se initialTaskData tem targetMonth, usar
            if (initialTaskData?.targetMonth) {
                setTargetMonth(initialTaskData.targetMonth)
            } else {
                const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
                setTargetMonth(monthStr)
            }
        }
    }, [editingTask, initialTaskData, isOpen])

    // Atualizar semanas disponíveis quando ano/mês mudar
    useEffect(() => {
        if (scope === 'week') {
            const weeks = getWeeksOfMonth(weekYear, weekMonth)
            if (weeks.length > 0 && !selectedWeek) {
                setSelectedWeek(weekInfoToString(weeks[0]))
            }
        }
    }, [weekYear, weekMonth, scope])

    // Funções de gerenciamento de subtarefas
    const handleAddSubtask = () => {
        if (newSubtaskTitle.trim()) {
            setSubtasks([...subtasks, {
                title: newSubtaskTitle.trim(),
                isCompleted: false,
                position: subtasks.length
            }])
            setNewSubtaskTitle('')
        }
    }

    const handleToggleSubtask = (index: number) => {
        const updated = [...subtasks]
        updated[index] = {
            ...updated[index],
            isCompleted: !updated[index].isCompleted
        }
        setSubtasks(updated)
    }

    const handleDeleteSubtask = (index: number) => {
        setSubtasks(subtasks.filter((_, i) => i !== index))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (title.trim()) {
            console.log('📝 [TaskFormModal] Estado atual de subtasks:', subtasks)

            const data: any = {
                title: title.trim(),
                description: description.trim() || null,
                groupId,
                scope,
                subtasks: subtasks.map((sub, idx) => ({
                    title: sub.title,
                    isCompleted: sub.isCompleted || false,
                    position: idx
                })),

                // Recorrência
                isRecurring,
                recurrencePattern: isRecurring ? recurrencePattern : null,
                recurrenceInterval: isRecurring ? recurrenceInterval : null,
                recurrenceDays: isRecurring ? recurrenceDays : null,
                recurrenceEndDate: isRecurring ? recurrenceEndDate : null
            }

            // Adicionar campos específicos baseados no escopo
            if (scope === 'date') {
                data.dueDate = dueDate || null
                data.dueTime = dueTime || null
            } else if (scope === 'week') {
                data.targetWeek = selectedWeek
            } else if (scope === 'month') {
                data.targetMonth = targetMonth
            }

            console.log('🚀 [TaskFormModal] Enviando tarefa:', JSON.stringify(data, null, 2))
            onSubmit(data)
            onClose()
        }
    }

    if (!isOpen) return null

    // Gerar opções de mês para o seletor de semana
    const generateMonthOptions = () => {
        const months = []
        const currentYear = new Date().getFullYear()

        for (let year = currentYear - 1; year <= currentYear + 1; year++) {
            for (let month = 0; month < 12; month++) {
                months.push({ year, month })
            }
        }

        return months
    }

    const monthOptions = generateMonthOptions()
    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-content-large animate-scale-in" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="task-title">Título da Tarefa</label>
                        <input
                            id="task-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Digite o título da tarefa..."
                            autoFocus
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="task-group">Grupo</label>
                            <select
                                id="task-group"
                                value={groupId || ''}
                                onChange={(e) => setGroupId(e.target.value || null)}
                                className="form-select"
                            >
                                <option value="">Sem Grupo</option>
                                {groups.map((group) => (
                                    <option key={group.id} value={group.id}>
                                        {group.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="task-scope">Tipo de Organização</label>
                            <select
                                id="task-scope"
                                value={scope}
                                onChange={(e) => setScope(e.target.value as any)}
                                className="form-select"
                            >
                                <option value="date">Data Específica</option>
                                <option value="week">Meta Semanal</option>
                                <option value="month">Meta Mensal</option>
                            </select>
                        </div>
                    </div>

                    {/* Campos condicionais baseados no escopo */}
                    {scope === 'date' && (
                        <div className="form-row">
                            <div className="form-group">
                                <DateSelector
                                    label="Data"
                                    value={dueDate}
                                    onChange={setDueDate}
                                    placeholder="Selecione uma data"
                                />
                            </div>

                            <div className="form-group">
                                <TimeSelector
                                    label="Horário (opcional)"
                                    value={dueTime}
                                    onChange={setDueTime}
                                    placeholder="Selecione um horário"
                                />
                            </div>
                        </div>
                    )}

                    {scope === 'week' && (
                        <>
                            <div className="form-group">
                                <label htmlFor="task-week-month">Mês</label>
                                <select
                                    id="task-week-month"
                                    value={`${weekYear}-${weekMonth}`}
                                    onChange={(e) => {
                                        const [year, month] = e.target.value.split('-').map(Number)
                                        setWeekYear(year)
                                        setWeekMonth(month)
                                    }}
                                    className="form-select"
                                >
                                    {monthOptions.map(({ year, month }) => (
                                        <option key={`${year}-${month}`} value={`${year}-${month}`}>
                                            {monthNames[month]} {year}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="task-week">Semana</label>
                                <select
                                    id="task-week"
                                    value={selectedWeek}
                                    onChange={(e) => setSelectedWeek(e.target.value)}
                                    className="form-select"
                                >
                                    {availableWeeks.map((week) => (
                                        <option key={weekInfoToString(week)} value={weekInfoToString(week)}>
                                            {week.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="field-hint">Tarefa para ser concluída durante esta semana</p>
                            </div>
                        </>
                    )}

                    {scope === 'month' && (
                        <div className="form-group">
                            <label htmlFor="task-month">Mês Alvo</label>
                            <input
                                id="task-month"
                                type="month"
                                value={targetMonth}
                                onChange={(e) => setTargetMonth(e.target.value)}
                                className="form-input"
                            />
                            <p className="field-hint">Tarefa para ser concluída durante este mês</p>
                        </div>
                    )}

                    {/* Recorrência */}
                    <div className="form-group recurrence-section">
                        <div className="recurrence-toggle">
                            <label className="checkbox-container">
                                <input
                                    type="checkbox"
                                    checked={isRecurring}
                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                />
                                <span className="checkmark"></span>
                                <span className="label-text">Repetir tarefa</span>
                            </label>
                        </div>

                        {isRecurring && (
                            <div className="recurrence-options animate-fade-in">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Frequência</label>
                                        <select
                                            value={recurrencePattern}
                                            onChange={(e) => setRecurrencePattern(e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="daily">Diariamente</option>
                                            <option value="weekly">Semanalmente</option>
                                            <option value="monthly">Mensalmente</option>
                                            <option value="yearly">Anualmente</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Repetir a cada</label>
                                        <div className="interval-input-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <input
                                                type="number"
                                                min="1"
                                                value={recurrenceInterval}
                                                onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                                                className="form-input"
                                                style={{ width: '80px' }}
                                            />
                                            <span className="unit-label" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                                                {recurrencePattern === 'daily' ? (recurrenceInterval === 1 ? 'Dia' : 'Dias') :
                                                    recurrencePattern === 'weekly' ? (recurrenceInterval === 1 ? 'Semana' : 'Semanas') :
                                                        recurrencePattern === 'monthly' ? (recurrenceInterval === 1 ? 'Mês' : 'Meses') :
                                                            (recurrenceInterval === 1 ? 'Ano' : 'Anos')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {recurrencePattern === 'weekly' && (
                                    <div className="form-group">
                                        <label>Dias da semana</label>
                                        <div className="week-days-selector" style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    className={`week-day-btn ${recurrenceDays.includes(idx) ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        if (recurrenceDays.includes(idx)) {
                                                            setRecurrenceDays(recurrenceDays.filter(d => d !== idx))
                                                        } else {
                                                            setRecurrenceDays([...recurrenceDays, idx])
                                                        }
                                                    }}
                                                    style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        border: '1px solid var(--border-color)',
                                                        background: recurrenceDays.includes(idx) ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                                                        color: recurrenceDays.includes(idx) ? 'white' : 'var(--text-primary)',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        fontWeight: '500',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Terminar em (Opcional)</label>
                                    <input
                                        type="date"
                                        value={recurrenceEndDate}
                                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                                        className="form-input"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Descrição */}
                    <div className="form-group">
                        <label htmlFor="task-description">Descrição (Opcional)</label>
                        <textarea
                            id="task-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Adicione detalhes sobre a tarefa..."
                            rows={3}
                            className="form-textarea"
                        />
                    </div>

                    {/* Subtarefas/Checklist */}
                    <div className="form-group">
                        <label>Checklist (Opcional)</label>
                        <div className="subtasks-container">
                            {subtasks.length > 0 && (
                                <div className="subtasks-list">
                                    {subtasks.map((subtask, index) => (
                                        <div key={index} className="subtask-item">
                                            <input
                                                type="checkbox"
                                                checked={subtask.isCompleted}
                                                onChange={() => handleToggleSubtask(index)}
                                                className="subtask-checkbox"
                                            />
                                            <span className={subtask.isCompleted ? 'subtask-completed' : ''}>
                                                {subtask.title}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteSubtask(index)}
                                                className="subtask-delete"
                                                aria-label="Remover subtarefa"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="subtask-input-container">
                                <input
                                    type="text"
                                    value={newSubtaskTitle}
                                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleAddSubtask()
                                        }
                                    }}
                                    placeholder="Adicionar item da checklist..."
                                    className="subtask-input"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddSubtask}
                                    className="subtask-add-btn"
                                    disabled={!newSubtaskTitle.trim()}
                                >
                                    + Adicionar
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="modal-actions">
                        {editingTask && onDelete && (
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => {
                                    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
                                        onDelete(editingTask.id)
                                        onClose()
                                    }
                                }}
                            >
                                Excluir
                            </button>
                        )}
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {editingTask ? 'Salvar' : 'Criar'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
