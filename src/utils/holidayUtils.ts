import { Holiday } from '../types'

/**
 * Calcula a data da Páscoa para um ano específico usando o algoritmo de Meeus/Jones/Butcher
 */
function getEasterDate(year: number): Date {
    const a = year % 19
    const b = Math.floor(year / 100)
    const c = year % 100
    const d = Math.floor(b / 4)
    const e = b % 4
    const f = Math.floor((b + 8) / 25)
    const g = Math.floor((b - f + 1) / 3)
    const h = (19 * a + b - d - g + 15) % 30
    const i = Math.floor(c / 4)
    const k = c % 4
    const l = (32 + 2 * e + 2 * i - h - k) % 7
    const m = Math.floor((a + 11 * h + 22 * l) / 451)
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1 // 0-indexed
    const day = ((h + l - 7 * m + 114) % 31) + 1

    return new Date(year, month, day)
}

/**
 * Adiciona dias a uma data
 */
function addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
}

/**
 * Formata data para ISO String (YYYY-MM-DD)
 */
function formatToISO(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * Retorna todos os feriados nacionais do Brasil para um ano específico
 */
export function getHolidays(year: number): Holiday[] {
    const holidays: Holiday[] = []

    // Feriados fixos nacionais
    holidays.push(
        { date: `${year}-01-01`, name: 'Ano Novo', type: 'national' },
        { date: `${year}-04-21`, name: 'Tiradentes', type: 'national' },
        { date: `${year}-05-01`, name: 'Dia do Trabalho', type: 'national' },
        { date: `${year}-09-07`, name: 'Independência do Brasil', type: 'national' },
        { date: `${year}-10-12`, name: 'Nossa Senhora Aparecida', type: 'national' },
        { date: `${year}-11-02`, name: 'Finados', type: 'national' },
        { date: `${year}-11-15`, name: 'Proclamação da República', type: 'national' },
        { date: `${year}-11-20`, name: 'Consciência Negra', type: 'national' },
        { date: `${year}-12-25`, name: 'Natal', type: 'national' }
    )

    // Feriados móveis (baseados na Páscoa)
    const easter = getEasterDate(year)

    // Carnaval - Terça-feira de Carnaval (47 dias antes da Páscoa)
    const carnavalTuesday = addDays(easter, -47)

    // Sábado de Carnaval (3 dias antes da terça)
    holidays.push({
        date: formatToISO(addDays(carnavalTuesday, -3)),
        name: 'Sábado de Carnaval',
        type: 'national'
    })

    // Domingo de Carnaval (2 dias antes da terça)
    holidays.push({
        date: formatToISO(addDays(carnavalTuesday, -2)),
        name: 'Domingo de Carnaval',
        type: 'national'
    })

    // Segunda-feira de Carnaval (1 dia antes da terça)
    holidays.push({
        date: formatToISO(addDays(carnavalTuesday, -1)),
        name: 'Segunda de Carnaval',
        type: 'national'
    })

    // Terça-feira de Carnaval
    holidays.push({
        date: formatToISO(carnavalTuesday),
        name: 'Carnaval',
        type: 'national'
    })

    // Quarta-feira de Cinzas (1 dia depois da terça)
    holidays.push({
        date: formatToISO(addDays(carnavalTuesday, 1)),
        name: 'Quarta-feira de Cinzas',
        type: 'national'
    })

    // Sexta-feira Santa (2 dias antes da Páscoa)
    const goodFriday = addDays(easter, -2)
    holidays.push({
        date: formatToISO(goodFriday),
        name: 'Sexta-feira Santa',
        type: 'national'
    })

    // Páscoa
    holidays.push({
        date: formatToISO(easter),
        name: 'Páscoa',
        type: 'national'
    })

    // Corpus Christi (60 dias depois da Páscoa)
    const corpusChristi = addDays(easter, 60)
    holidays.push({
        date: formatToISO(corpusChristi),
        name: 'Corpus Christi',
        type: 'national'
    })

    return holidays.sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Verifica se uma data é feriado
 */
export function isHoliday(date: string, holidays: Holiday[]): Holiday | undefined {
    return holidays.find(h => h.date === date)
}
