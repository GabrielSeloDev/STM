export interface Subtask {
    id: string
    taskId: string
    title: string
    isCompleted: boolean
    position: number
}

export interface Task {
    id: string
    title: string
    description?: string | null
    isCompleted: boolean
    isImportant?: boolean
    groupId: string | null
    createdAt: string
    // Escopo de organização temporal
    scope?: 'date' | 'week' | 'month'
    // Para scope='date': data específica + horário opcional
    dueDate?: string | null // ISO Date String (YYYY-MM-DD)
    dueTime?: string | null // HH:mm format
    // Para scope='week': semana alvo (formato ISO: YYYY-Www, ex: "2023-W42")
    targetWeek?: string | null
    // Para scope='month': mês alvo (formato: YYYY-MM, ex: "2023-12")
    targetMonth?: string | null
    // Subtarefas/Checklist
    subtasks?: Subtask[]

    // Recorrência
    isRecurring?: boolean
    recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | null
    recurrenceInterval?: number | null
    recurrenceDays?: number[] | null // 0-6 (Dom-Sab)
    recurrenceEndDate?: string | null
    parentTaskId?: string | null

    // UI Only
    isVirtual?: boolean
}

export type TaskInput = Omit<Partial<Task>, 'subtasks'> & {
    subtasks?: Partial<Subtask>[]
}

export interface Group {
    id: string
    name: string
    color: string
}

export interface Holiday {
    date: string // ISO Date String (YYYY-MM-DD)
    name: string
    type: 'national' | 'regional'
}


export interface ElectronAPI {
    getTasks: () => Promise<Task[]>
    addTask: (task: TaskInput) => Promise<Task>
    updateTask: (id: string, updates: TaskInput) => Promise<Task>
    deleteTask: (id: string) => Promise<boolean>
    getGroups: () => Promise<Group[]>
    addGroup: (group: Partial<Group>) => Promise<Group>
    updateGroup: (id: string, updates: Partial<Group>) => Promise<Group>
    deleteGroup: (id: string) => Promise<boolean>
    getSubtasks: (taskId: string) => Promise<Subtask[]>
    addSubtask: (taskId: string, title: string, position?: number) => Promise<Subtask>
    updateSubtask: (id: string, updates: Partial<Subtask>) => Promise<Subtask>
    deleteSubtask: (id: string) => Promise<boolean>
}

declare global {
    interface Window {
        electronAPI: ElectronAPI
    }
}
