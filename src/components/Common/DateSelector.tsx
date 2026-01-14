import { useState, useRef, useEffect } from 'react'
import { generateCalendarDays, getMonthName, formatDateToISO } from '../../utils/dateUtils'
import './DateSelector.css'

interface DateSelectorProps {
    value: string // ISO date string (YYYY-MM-DD)
    onChange: (date: string) => void
    label?: string
    placeholder?: string
}

export function DateSelector({ value, onChange, label, placeholder = 'Selecione uma data' }: DateSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLButtonElement>(null)

    // Se houver um valor, usar esse mês/ano
    useEffect(() => {
        if (value) {
            const date = new Date(value + 'T00:00:00')
            setCurrentMonth(date.getMonth())
            setCurrentYear(date.getFullYear())
        }
    }, [value])

    // Fechar quando clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const calendarDays = generateCalendarDays(currentYear, currentMonth)

    const navigateMonth = (direction: 'prev' | 'next') => {
        if (direction === 'next') {
            if (currentMonth === 11) {
                setCurrentMonth(0)
                setCurrentYear(currentYear + 1)
            } else {
                setCurrentMonth(currentMonth + 1)
            }
        } else {
            if (currentMonth === 0) {
                setCurrentMonth(11)
                setCurrentYear(currentYear - 1)
            } else {
                setCurrentMonth(currentMonth - 1)
            }
        }
    }

    const handleDateSelect = (date: Date) => {
        onChange(formatDateToISO(date))
        setIsOpen(false)
    }

    const handleToggle = () => {
        if (!isOpen && inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect()
            const dropdownWidth = Math.max(rect.width, 320)
            const dropdownHeight = 420 // Altura aproximada do dropdown

            let top = rect.bottom + 4
            let left = rect.left

            // Verificar se vai sair pela direita
            if (left + dropdownWidth > window.innerWidth) {
                left = window.innerWidth - dropdownWidth - 16
            }

            // Verificar se vai sair pela esquerda
            if (left < 16) {
                left = 16
            }

            // Verificar se vai sair por baixo
            if (top + dropdownHeight > window.innerHeight) {
                // Mostrar acima do input
                top = rect.top - dropdownHeight - 4
            }

            // Se mesmo acima não couber, ajustar
            if (top < 16) {
                top = 16
            }

            setDropdownPosition({
                top,
                left,
                width: dropdownWidth
            })
        }
        setIsOpen(!isOpen)
    }

    const displayValue = value
        ? new Date(value + 'T00:00:00').toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
        : ''

    const today = formatDateToISO(new Date())

    return (
        <div className="date-selector" ref={containerRef}>
            {label && <label className="date-selector-label">{label}</label>}
            <button
                ref={inputRef}
                type="button"
                className="date-selector-input"
                onClick={handleToggle}
            >
                <span className={displayValue ? '' : 'placeholder'}>
                    {displayValue || placeholder}
                </span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            </button>

            {isOpen && (
                <div
                    className="date-selector-dropdown"
                    style={{
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        width: `${Math.max(dropdownPosition.width, 320)}px`
                    }}
                >
                    <div className="date-selector-header">
                        <button
                            type="button"
                            className="month-nav-btn"
                            onClick={() => navigateMonth('prev')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        <span className="current-month-label">
                            {getMonthName(currentMonth)} {currentYear}
                        </span>
                        <button
                            type="button"
                            className="month-nav-btn"
                            onClick={() => navigateMonth('next')}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </div>

                    <div className="date-selector-calendar">
                        <div className="weekday-headers">
                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                <div key={day} className="weekday-header">{day}</div>
                            ))}
                        </div>
                        <div className="calendar-days-grid">
                            {calendarDays.map((date, index) => {
                                const dateStr = formatDateToISO(date)
                                const isSelected = dateStr === value
                                const isToday = dateStr === today
                                const isOtherMonth = date.getMonth() !== currentMonth

                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        className={`calendar-day-btn ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${isOtherMonth ? 'other-month' : ''}`}
                                        onClick={() => handleDateSelect(date)}
                                    >
                                        {date.getDate()}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="date-selector-footer">
                        <button
                            type="button"
                            className="btn-today"
                            onClick={() => {
                                onChange(today)
                                setIsOpen(false)
                            }}
                        >
                            Hoje
                        </button>
                        <button
                            type="button"
                            className="btn-clear"
                            onClick={() => {
                                onChange('')
                                setIsOpen(false)
                            }}
                        >
                            Limpar
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
