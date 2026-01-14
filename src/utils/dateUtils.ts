/**
 * Utilitários para manipulação de datas no calendário
 */

/**
 * Retorna o número de dias em um mês específico
 */
export function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate()
}

/**
 * Retorna o dia da semana do primeiro dia do mês (0 = Domingo, 6 = Sábado)
 */
export function getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 1).getDay()
}

/**
 * Gera array com todos os dias do calendário (incluindo padding de meses anteriores/posteriores)
 * O grid será dinâmico (n x 7) onde n é o número de semanas que aparecem no calendário do mês
 */
export function generateCalendarDays(year: number, month: number): Date[] {
    const weeks = getCalendarWeeksForMonth(year, month)
    const days: Date[] = []

    // Achatar o array de semanas em um único array de dias
    weeks.forEach(week => {
        days.push(...week)
    })

    return days
}

/**
 * Formata data para ISO Date String (YYYY-MM-DD)
 */
export function formatDateToISO(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * Retorna o número da semana ISO (formato: YYYY-Www)
 */
export function getISOWeek(date: Date): string {
    const target = new Date(date.valueOf())
    const dayNumber = (date.getDay() + 6) % 7
    target.setDate(target.getDate() - dayNumber + 3)
    const firstThursday = target.valueOf()
    target.setMonth(0, 1)
    if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
    }
    const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
    return `${target.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`
}

/**
 * Retorna o mês no formato YYYY-MM
 */
export function getYearMonth(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
}

/**
 * Verifica se duas datas são do mesmo dia
 */
export function isSameDay(date1: Date, date2: Date): boolean {
    return formatDateToISO(date1) === formatDateToISO(date2)
}

/**
 * Verifica se uma data está no mês atual do calendário
 */
export function isCurrentMonth(date: Date, year: number, month: number): boolean {
    return date.getFullYear() === year && date.getMonth() === month
}

/**
 * Retorna o nome do mês em português
 */
export function getMonthName(month: number): string {
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return months[month]
}

/**
 * Retorna os nomes dos dias da semana
 */
export function getWeekDays(): string[] {
    return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
}

/**
 * Interface para informações de uma semana customizada
 */
export interface WeekInfo {
    weekNumber: number // 1, 2, 3... (relativo ao mês)
    year: number
    month: number // 0-11
    startDate: Date
    endDate: Date
    label: string // "Semana 1 (30/12 - 05/01)"
}

/**
 * Retorna o início da semana (Domingo) para uma data
 */
function getWeekStart(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
}

/**
 * Retorna o fim da semana (Sábado) para uma data
 */
function getWeekEnd(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() + (6 - day)
    return new Date(d.setDate(diff))
}

/**
 * Determina a qual mês uma semana pertence
 * Regra: Se a semana contém o dia 1 de um mês, ela pertence a esse mês
 * Caso contrário, pertence ao mês com maioria dos dias
 */
function getWeekOwnerMonth(weekStart: Date, weekEnd: Date): { year: number; month: number } {
    const current = new Date(weekStart)

    // Verificar se algum dia da semana é dia 1 de algum mês
    while (current <= weekEnd) {
        if (current.getDate() === 1) {
            // Esta semana contém o dia 1, então pertence a este mês
            return {
                year: current.getFullYear(),
                month: current.getMonth()
            }
        }
        current.setDate(current.getDate() + 1)
    }

    // Se não contém dia 1, usar regra da maioria dos dias
    const daysCount: { [key: string]: number } = {}
    const curr = new Date(weekStart)

    while (curr <= weekEnd) {
        const key = `${curr.getFullYear()}-${curr.getMonth()}`
        daysCount[key] = (daysCount[key] || 0) + 1
        curr.setDate(curr.getDate() + 1)
    }

    // Encontrar o mês com mais dias
    let maxDays = 0
    let ownerKey = ''
    for (const [key, count] of Object.entries(daysCount)) {
        if (count > maxDays) {
            maxDays = count
            ownerKey = key
        }
    }

    const [year, month] = ownerKey.split('-').map(Number)
    return { year, month }
}

/**
 * Retorna todas as semanas de um mês específico
 */
export function getWeeksOfMonth(year: number, month: number): WeekInfo[] {
    const weeks: WeekInfo[] = []
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Começar da primeira semana que contém dias deste mês
    let currentWeekStart = getWeekStart(firstDay)
    let weekNumber = 0

    while (currentWeekStart <= lastDay) {
        const weekEnd = getWeekEnd(currentWeekStart)
        const owner = getWeekOwnerMonth(currentWeekStart, weekEnd)

        // Só incluir se esta semana pertence ao mês atual
        if (owner.year === year && owner.month === month) {
            weekNumber++
            weeks.push({
                weekNumber,
                year,
                month,
                startDate: new Date(currentWeekStart),
                endDate: new Date(weekEnd),
                label: `Semana ${weekNumber} (${currentWeekStart.getDate()}/${String(currentWeekStart.getMonth() + 1).padStart(2, '0')} - ${weekEnd.getDate()}/${String(weekEnd.getMonth() + 1).padStart(2, '0')})`
            })
        }

        // Próxima semana
        currentWeekStart = new Date(currentWeekStart)
        currentWeekStart.setDate(currentWeekStart.getDate() + 7)
    }

    return weeks
}

/**
 * Retorna informações da semana customizada para uma data específica
 */
export function getCustomWeekInfo(date: Date): WeekInfo | null {
    const weekStart = getWeekStart(date)
    const weekEnd = getWeekEnd(date)
    const owner = getWeekOwnerMonth(weekStart, weekEnd)

    const weeksOfMonth = getWeeksOfMonth(owner.year, owner.month)
    const weekInfo = weeksOfMonth.find(w =>
        date >= w.startDate && date <= w.endDate
    )

    return weekInfo || null
}

/**
 * Converte WeekInfo para string no formato "YYYY-MM-Wn"
 */
export function weekInfoToString(weekInfo: WeekInfo): string {
    const monthStr = String(weekInfo.month + 1).padStart(2, '0')
    return `${weekInfo.year}-${monthStr}-W${weekInfo.weekNumber}`
}

/**
 * Converte string "YYYY-MM-Wn" para WeekInfo
 */
export function stringToWeekInfo(weekString: string): WeekInfo | null {
    const match = weekString.match(/^(\d{4})-(\d{2})-W(\d+)$/)
    if (!match) return null

    const year = parseInt(match[1])
    const month = parseInt(match[2]) - 1
    const weekNumber = parseInt(match[3])

    const weeks = getWeeksOfMonth(year, month)
    return weeks.find(w => w.weekNumber === weekNumber) || null
}

/**
 * Retorna os dias de uma semana específica
 */
export function getDaysOfWeek(weekInfo: WeekInfo): Date[] {
    const days: Date[] = []
    const current = new Date(weekInfo.startDate)

    while (current <= weekInfo.endDate) {
        days.push(new Date(current))
        current.setDate(current.getDate() + 1)
    }

    return days
}

/**
 * Retorna todas as semanas que aparecem no calendário de um mês
 * (diferente de getWeeksOfMonth que retorna apenas as semanas que "pertencem" ao mês)
 * Esta função retorna todas as semanas que contêm pelo menos um dia do mês
 */
export function getCalendarWeeksForMonth(year: number, month: number): Date[][] {
    const weeks: Date[][] = []
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Começar do domingo da semana que contém o primeiro dia do mês
    let currentWeekStart = getWeekStart(firstDay)

    // Continuar até que a semana atual não contenha mais dias do mês
    while (currentWeekStart <= lastDay) {
        const weekEnd = getWeekEnd(currentWeekStart)
        const weekDays: Date[] = []

        // Adicionar todos os 7 dias da semana
        const current = new Date(currentWeekStart)
        for (let i = 0; i < 7; i++) {
            weekDays.push(new Date(current))
            current.setDate(current.getDate() + 1)
        }

        weeks.push(weekDays)

        // Próxima semana
        currentWeekStart = new Date(currentWeekStart)
        currentWeekStart.setDate(currentWeekStart.getDate() + 7)
    }

    return weeks
}
