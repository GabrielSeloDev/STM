import { useState, useRef, useEffect } from 'react'
import './TimeSelector.css'

interface TimeSelectorProps {
    value: string // HH:mm format
    onChange: (time: string) => void
    label?: string
    placeholder?: string
}

export function TimeSelector({ value, onChange, label, placeholder = 'Selecione um horário' }: TimeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLButtonElement>(null)

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

    const handleTimeSelect = (hour: number, minute: number) => {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
        onChange(timeStr)
        setIsOpen(false)
    }

    const handleToggle = () => {
        if (!isOpen && inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect()
            const dropdownWidth = Math.max(rect.width, 280)
            const dropdownHeight = 320

            let top = rect.bottom + 4
            let left = rect.left

            if (left + dropdownWidth > window.innerWidth) {
                left = window.innerWidth - dropdownWidth - 16
            }

            if (left < 16) {
                left = 16
            }

            if (top + dropdownHeight > window.innerHeight) {
                top = rect.top - dropdownHeight - 4
            }

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

    const hours = Array.from({ length: 24 }, (_, i) => i)
    const minutes = [0, 15, 30, 45]

    return (
        <div className="time-selector" ref={containerRef}>
            {label && <label className="time-selector-label">{label}</label>}
            <button
                ref={inputRef}
                type="button"
                className="time-selector-input"
                onClick={handleToggle}
            >
                <span className={value ? '' : 'placeholder'}>
                    {value || placeholder}
                </span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            </button>

            {isOpen && (
                <div
                    className="time-selector-dropdown"
                    style={{
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        width: `${dropdownPosition.width}px`
                    }}
                >
                    <div className="time-selector-header">
                        <span className="time-label">Selecione o horário</span>
                    </div>

                    <div className="time-grid">
                        <div className="hours-column">
                            <div className="column-label">Hora</div>
                            <div className="time-scroll">
                                {hours.map(hour => (
                                    <button
                                        key={hour}
                                        type="button"
                                        className={`time-btn ${value?.startsWith(String(hour).padStart(2, '0')) ? 'active' : ''}`}
                                        onClick={() => {
                                            const currentMinute = value ? parseInt(value.split(':')[1]) : 0
                                            handleTimeSelect(hour, currentMinute)
                                        }}
                                    >
                                        {String(hour).padStart(2, '0')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="minutes-column">
                            <div className="column-label">Minuto</div>
                            <div className="time-scroll">
                                {minutes.map(minute => (
                                    <button
                                        key={minute}
                                        type="button"
                                        className={`time-btn ${value?.endsWith(String(minute).padStart(2, '0')) ? 'active' : ''}`}
                                        onClick={() => {
                                            const currentHour = value ? parseInt(value.split(':')[0]) : 0
                                            handleTimeSelect(currentHour, minute)
                                        }}
                                    >
                                        {String(minute).padStart(2, '0')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="time-selector-footer">
                        <button
                            type="button"
                            className="btn-now"
                            onClick={() => {
                                const now = new Date()
                                handleTimeSelect(now.getHours(), Math.floor(now.getMinutes() / 15) * 15)
                            }}
                        >
                            Agora
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
