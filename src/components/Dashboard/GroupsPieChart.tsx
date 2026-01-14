import { Task, Group } from '../../types'
import { useMemo, useState, useRef, useEffect } from 'react'
import './GroupsPieChart.css'

interface GroupsPieChartProps {
    tasks: Task[]
    groups: Group[]
}

interface GroupStats {
    groupId: string
    groupName: string
    color: string
    total: number
    completed: number
    percentage: number
}

interface ChartSlide {
    id: string
    title: string
    type: 'total' | 'group'
    stats?: GroupStats
    allStats?: GroupStats[]
}

export function GroupsPieChart({ tasks, groups }: GroupsPieChartProps) {
    const [currentSlide, setCurrentSlide] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [translateX, setTranslateX] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)

    const stats = useMemo(() => {
        const groupStats: Record<string, GroupStats> = {}

        // Inicializa stats para todos os grupos
        groups.forEach(group => {
            groupStats[group.id] = {
                groupId: group.id,
                groupName: group.name,
                color: group.color,
                total: 0,
                completed: 0,
                percentage: 0
            }
        })

        // Adiciona grupo para tarefas sem grupo
        groupStats['ungrouped'] = {
            groupId: 'ungrouped',
            groupName: 'Sem Grupo',
            color: '#9ca3af',
            total: 0,
            completed: 0,
            percentage: 0
        }

        // Conta tarefas por grupo
        tasks.forEach(task => {
            const key = task.groupId || 'ungrouped'
            if (!groupStats[key]) return

            groupStats[key].total++
            if (task.isCompleted) {
                groupStats[key].completed++
            }
        })

        // Calcula percentagens
        Object.values(groupStats).forEach(stat => {
            if (stat.total > 0) {
                stat.percentage = Math.round((stat.completed / stat.total) * 100)
            }
        })

        // Filtra grupos sem tarefas
        return Object.values(groupStats).filter(stat => stat.total > 0)
    }, [tasks, groups])

    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.isCompleted).length
    const overallPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Gera dados para o gráfico de pizza total
    const totalPieData = useMemo(() => {
        let currentAngle = 0
        return stats.map(stat => {
            const sliceAngle = (stat.total / totalTasks) * 360
            const startAngle = currentAngle
            currentAngle += sliceAngle

            return {
                ...stat,
                startAngle,
                endAngle: currentAngle,
                sliceAngle
            }
        })
    }, [stats, totalTasks])

    // Cria os slides do carrossel
    const slides: ChartSlide[] = useMemo(() => {
        const result: ChartSlide[] = [
            {
                id: 'total',
                title: 'Progresso Geral',
                type: 'total',
                allStats: stats
            }
        ]

        stats.forEach(stat => {
            result.push({
                id: stat.groupId,
                title: stat.groupName,
                type: 'group',
                stats: stat
            })
        })

        return result
    }, [stats])

    // Função para criar o path do SVG para cada fatia
    const createSlicePath = (startAngle: number, endAngle: number) => {
        const centerX = 100
        const centerY = 100
        const radius = 80

        const startRad = (startAngle - 90) * (Math.PI / 180)
        const endRad = (endAngle - 90) * (Math.PI / 180)

        const x1 = centerX + radius * Math.cos(startRad)
        const y1 = centerY + radius * Math.sin(startRad)
        const x2 = centerX + radius * Math.cos(endRad)
        const y2 = centerY + radius * Math.sin(endRad)

        const largeArc = endAngle - startAngle > 180 ? 1 : 0

        return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
    }

    // Cria um gráfico de pizza simples para um grupo
    const createSimplePieChart = (completed: number, total: number, color: string) => {
        const percentage = total > 0 ? (completed / total) * 100 : 0
        const angle = (percentage / 100) * 360

        if (angle === 0) {
            return (
                <circle cx="100" cy="100" r="80" fill="var(--bg-tertiary)" opacity="0.3" />
            )
        }

        if (angle >= 360) {
            return (
                <circle cx="100" cy="100" r="80" fill={color} opacity="0.8" />
            )
        }

        const path = createSlicePath(0, angle)
        return (
            <>
                <circle cx="100" cy="100" r="80" fill="var(--bg-tertiary)" opacity="0.3" />
                <path d={path} fill={color} opacity="0.8" />
            </>
        )
    }

    // Handlers de arrasto
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true)
        setStartX(e.clientX - translateX)
    }

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true)
        setStartX(e.touches[0].clientX - translateX)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return
        const x = e.clientX - startX
        setTranslateX(x)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return
        const x = e.touches[0].clientX - startX
        setTranslateX(x)
    }

    const handleDragEnd = () => {
        if (!isDragging) return
        setIsDragging(false)

        const containerWidth = containerRef.current?.offsetWidth || 400
        const threshold = containerWidth * 0.2

        if (translateX > threshold && currentSlide > 0) {
            setCurrentSlide(currentSlide - 1)
        } else if (translateX < -threshold && currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1)
        }

        setTranslateX(0)
    }

    useEffect(() => {
        setTranslateX(0)
    }, [currentSlide])

    if (totalTasks === 0) {
        return (
            <div className="groups-pie-chart">
                <h2>📈 Progresso por Grupo</h2>
                <div className="empty-chart">
                    <p>Nenhuma tarefa cadastrada</p>
                    <span className="empty-hint">Adicione tarefas para ver o gráfico</span>
                </div>
            </div>
        )
    }

    const currentSlideData = slides[currentSlide]

    return (
        <div className="groups-pie-chart">
            <div className="chart-header">
                <h2>📈 {currentSlideData.title}</h2>
                <div className="carousel-indicators">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            className={`indicator ${index === currentSlide ? 'active' : ''}`}
                            onClick={() => setCurrentSlide(index)}
                        />
                    ))}
                </div>
            </div>

            <div
                ref={containerRef}
                className="carousel-container"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleDragEnd}
            >
                <div
                    className="carousel-track"
                    style={{
                        transform: `translateX(calc(-${currentSlide * 100}% + ${translateX}px))`,
                        transition: isDragging ? 'none' : 'transform 0.3s ease-out'
                    }}
                >
                    {slides.map((slide) => (
                        <div key={slide.id} className="carousel-slide">
                            <div className="chart-container">
                                <div className="pie-chart">
                                    <svg viewBox="0 0 200 200" className="pie-svg">
                                        {slide.type === 'total' ? (
                                            createSimplePieChart(
                                                completedTasks,
                                                totalTasks,
                                                'var(--accent-primary)'
                                            )
                                        ) : slide.stats && (
                                            createSimplePieChart(
                                                slide.stats.completed,
                                                slide.stats.total,
                                                slide.stats.color
                                            )
                                        )}
                                        <circle cx="100" cy="100" r="50" fill="var(--bg-primary)" />
                                        <text x="100" y="100" textAnchor="middle" className="chart-center-number">
                                            {slide.type === 'total' ? overallPercentage : slide.stats?.percentage}%
                                        </text>
                                        <text x="100" y="115" textAnchor="middle" className="chart-center-label">
                                            Concluído
                                        </text>
                                    </svg>
                                </div>

                                {slide.type === 'total' ? (
                                    <div className="chart-legend">
                                        {stats.map(stat => (
                                            <div key={stat.groupId} className="legend-item">
                                                <div
                                                    className="legend-color"
                                                    style={{ backgroundColor: stat.color }}
                                                />
                                                <div className="legend-info">
                                                    <span className="legend-name">{stat.groupName}</span>
                                                    <span className="legend-stats">
                                                        {stat.completed}/{stat.total} ({stat.percentage}%)
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : slide.stats && (
                                    <div className="group-stats">
                                        <div className="stat-row">
                                            <span className="stat-label">Total</span>
                                            <span className="stat-value">{slide.stats.total}</span>
                                        </div>
                                        <div className="stat-row">
                                            <span className="stat-label">Concluídas</span>
                                            <span className="stat-value">{slide.stats.completed}</span>
                                        </div>
                                        <div className="stat-row">
                                            <span className="stat-label">Pendentes</span>
                                            <span className="stat-value">{slide.stats.total - slide.stats.completed}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {
                currentSlideData.type === 'total' && (
                    <div className="overall-stats">
                        <div className="stat-item">
                            <span className="stat-label">Total de Tarefas</span>
                            <span className="stat-value">{totalTasks}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Concluídas</span>
                            <span className="stat-value">{completedTasks}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Pendentes</span>
                            <span className="stat-value">{totalTasks - completedTasks}</span>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
