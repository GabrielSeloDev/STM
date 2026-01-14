import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class DatabaseManager {
    constructor() {
        const userDataPath = app.getPath('userData')
        this.dbPath = path.join(userDataPath, 'tasks.db')

        console.log(`[Database] Caminho do banco: ${this.dbPath}`)

        // Conecta ao banco (cria se não existir)
        this.db = new Database(this.dbPath)

        // Habilita foreign keys
        this.db.pragma('foreign_keys = ON')

        // Inicializa schema
        this.initializeSchema()

        console.log('[Database] Banco de dados inicializado com sucesso')
    }

    initializeSchema() {
        const schemaPath = path.join(__dirname, 'schema.sql')
        const schema = fs.readFileSync(schemaPath, 'utf-8')

        // Executa o schema
        this.db.exec(schema)

        // Verifica se já existe grupo padrão
        const defaultGroup = this.db.prepare('SELECT * FROM groups WHERE id = ?').get('default')

        if (!defaultGroup) {
            // Cria grupos padrão
            this.db.prepare(`
                INSERT INTO groups (id, name, color) VALUES (?, ?, ?)
            `).run('default', 'Geral', '#6366f1')

            this.db.prepare(`
                INSERT INTO groups (id, name, color) VALUES (?, ?, ?)
            `).run('completed', 'Concluídas', '#10b981')

            console.log('[Database] Grupos padrão criados')
            console.log('[Database] Grupos padrão criados')
        }

        // Migração manual de colunas (para bancos existentes)
        try {
            this.db.prepare('ALTER TABLE tasks ADD COLUMN is_recurring INTEGER DEFAULT 0').run()
            this.db.prepare('ALTER TABLE tasks ADD COLUMN recurrence_pattern TEXT').run()
            this.db.prepare('ALTER TABLE tasks ADD COLUMN recurrence_interval INTEGER DEFAULT 1').run()
            this.db.prepare('ALTER TABLE tasks ADD COLUMN recurrence_days TEXT').run()
            this.db.prepare('ALTER TABLE tasks ADD COLUMN recurrence_end_date TEXT').run()
            this.db.prepare('ALTER TABLE tasks ADD COLUMN parent_task_id TEXT').run()
            console.log('[Database] Colunas de recorrência adicionadas')
        } catch (e) {
            // Colunas já existem, ignora erro
        }
    }

    // ============ GRUPOS ============

    getGroups() {
        return this.db.prepare('SELECT * FROM groups').all()
    }

    addGroup(group) {
        const id = randomUUID()
        this.db.prepare(`
            INSERT INTO groups (id, name, color) VALUES (?, ?, ?)
        `).run(id, group.name, group.color || '#6366f1')

        return { id, name: group.name, color: group.color || '#6366f1' }
    }

    updateGroup(id, updates) {
        const fields = []
        const values = []

        if (updates.name !== undefined) {
            fields.push('name = ?')
            values.push(updates.name)
        }
        if (updates.color !== undefined) {
            fields.push('color = ?')
            values.push(updates.color)
        }

        if (fields.length === 0) return this.db.prepare('SELECT * FROM groups WHERE id = ?').get(id)

        values.push(id)
        this.db.prepare(`UPDATE groups SET ${fields.join(', ')} WHERE id = ?`).run(...values)

        return this.db.prepare('SELECT * FROM groups WHERE id = ?').get(id)
    }

    deleteGroup(id) {
        // Não permite deletar grupos protegidos
        if (id === 'default' || id === 'completed') return false

        // Move tarefas para null
        this.db.prepare('UPDATE tasks SET group_id = NULL WHERE group_id = ?').run(id)

        // Deleta o grupo
        const result = this.db.prepare('DELETE FROM groups WHERE id = ?').run(id)
        return result.changes > 0
    }

    // ============ TAREFAS ============

    getTasks() {
        const tasks = this.db.prepare(`
            SELECT * FROM tasks
        `).all()

        // Converte INTEGER para Boolean e carrega subtarefas
        return tasks.map(task => ({
            ...task,
            isCompleted: Boolean(task.is_completed),
            isImportant: Boolean(task.is_important),
            groupId: task.group_id,
            createdAt: task.created_at,
            dueDate: task.due_date,
            dueTime: task.due_time,
            targetWeek: task.target_week,
            targetMonth: task.target_month,
            isRecurring: Boolean(task.is_recurring),
            recurrencePattern: task.recurrence_pattern,
            recurrenceInterval: task.recurrence_interval,
            recurrenceDays: task.recurrence_days ? JSON.parse(task.recurrence_days) : null,
            recurrenceEndDate: task.recurrence_end_date,
            parentTaskId: task.parent_task_id,
            subtasks: this.getSubtasks(task.id)
        }))
    }

    addTask(task) {
        const id = randomUUID()
        const now = new Date().toISOString()

        this.db.prepare(`
            INSERT INTO tasks (
                id, title, description, is_completed, is_important, 
                group_id, created_at, due_date, due_time, 
                scope, target_week, target_month,
                is_recurring, recurrence_pattern, recurrence_interval,
                recurrence_days, recurrence_end_date, parent_task_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id,
            task.title,
            task.description || null,
            task.isCompleted ? 1 : 0,
            task.isImportant ? 1 : 0,
            task.groupId || null,
            now,
            task.dueDate || null,
            task.dueTime || null,
            task.scope || null,
            task.targetWeek || null,
            task.targetMonth || null,
            task.isRecurring ? 1 : 0,
            task.recurrencePattern || null,
            task.recurrenceInterval || 1,
            task.recurrenceDays ? JSON.stringify(task.recurrenceDays) : null,
            task.recurrenceEndDate || null,
            task.parentTaskId || null
        )

        // Adiciona subtarefas se existirem
        console.log('[Database] Subtasks recebidas:', task.subtasks)
        if (task.subtasks && task.subtasks.length > 0) {
            console.log(`[Database] Adicionando ${task.subtasks.length} subtarefas`)
            task.subtasks.forEach((subtask, index) => {
                console.log(`[Database] Subtask ${index}:`, subtask)
                this.addSubtask(id, subtask.title, index)
            })
        }

        // Retorna tarefa completa
        return this.getTaskById(id)
    }

    updateTask(id, updates) {
        const fields = []
        const values = []

        if (updates.title !== undefined) {
            fields.push('title = ?')
            values.push(updates.title)
        }
        if (updates.description !== undefined) {
            fields.push('description = ?')
            values.push(updates.description)
        }
        if (updates.isCompleted !== undefined) {
            fields.push('is_completed = ?')
            values.push(updates.isCompleted ? 1 : 0)
        }
        if (updates.isImportant !== undefined) {
            fields.push('is_important = ?')
            values.push(updates.isImportant ? 1 : 0)
        }
        if (updates.groupId !== undefined) {
            fields.push('group_id = ?')
            values.push(updates.groupId)
        }
        if (updates.dueDate !== undefined) {
            fields.push('due_date = ?')
            values.push(updates.dueDate)
        }
        if (updates.dueTime !== undefined) {
            fields.push('due_time = ?')
            values.push(updates.dueTime)
        }
        if (updates.scope !== undefined) {
            fields.push('scope = ?')
            values.push(updates.scope)
        }
        if (updates.targetWeek !== undefined) {
            fields.push('target_week = ?')
            values.push(updates.targetWeek)
        }
        if (updates.targetMonth !== undefined) {
            fields.push('target_month = ?')
            values.push(updates.targetMonth)
        }
        // Recorrência
        if (updates.isRecurring !== undefined) {
            fields.push('is_recurring = ?')
            values.push(updates.isRecurring ? 1 : 0)
        }
        if (updates.recurrencePattern !== undefined) {
            fields.push('recurrence_pattern = ?')
            values.push(updates.recurrencePattern)
        }
        if (updates.recurrenceInterval !== undefined) {
            fields.push('recurrence_interval = ?')
            values.push(updates.recurrenceInterval)
        }
        if (updates.recurrenceDays !== undefined) {
            fields.push('recurrence_days = ?')
            values.push(updates.recurrenceDays ? JSON.stringify(updates.recurrenceDays) : null)
        }
        if (updates.recurrenceEndDate !== undefined) {
            fields.push('recurrence_end_date = ?')
            values.push(updates.recurrenceEndDate)
        }

        if (fields.length > 0) {
            values.push(id)
            this.db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values)
        }

        // Atualizar subtarefas se fornecidas
        if (updates.subtasks !== undefined) {
            console.log('[Database] Atualizando subtasks para task:', id)
            console.log('[Database] Subtasks recebidas:', updates.subtasks)

            // Deletar todas as subtarefas antigas
            this.db.prepare('DELETE FROM subtasks WHERE task_id = ?').run(id)

            // Adicionar novas subtarefas
            if (updates.subtasks && updates.subtasks.length > 0) {
                updates.subtasks.forEach((subtask, index) => {
                    console.log(`[Database] Adicionando subtask ${index}:`, subtask)
                    this.addSubtask(id, subtask.title, index)
                })
            }
        }

        // Verifica recorrência se completou
        if (updates.isCompleted === true) {
            const updatedTask = this.getTaskById(id)
            if (updatedTask && updatedTask.isRecurring) {
                try {
                    this.generateNextRecurringInstance(updatedTask)
                } catch (e) {
                    console.error('[Database] Erro ao gerar recorrência:', e)
                }
            }
        }

        return this.getTaskById(id)
    }

    deleteTask(id) {
        // CASCADE vai deletar subtarefas automaticamente
        const result = this.db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
        return result.changes > 0
    }

    getTaskById(id) {
        const task = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)
        if (!task) return null

        return {
            ...task,
            isCompleted: Boolean(task.is_completed),
            isImportant: Boolean(task.is_important),
            groupId: task.group_id,
            createdAt: task.created_at,
            dueDate: task.due_date,
            dueTime: task.due_time,
            targetWeek: task.target_week,
            targetMonth: task.target_month,
            isRecurring: Boolean(task.is_recurring),
            recurrencePattern: task.recurrence_pattern,
            recurrenceInterval: task.recurrence_interval,
            recurrenceDays: task.recurrence_days ? JSON.parse(task.recurrence_days) : null,
            recurrenceEndDate: task.recurrence_end_date,
            parentTaskId: task.parent_task_id,
            subtasks: this.getSubtasks(task.id)
        }
    }

    // ============ SUBTAREFAS ============

    getSubtasks(taskId) {
        const subtasks = this.db.prepare(`
            SELECT * FROM subtasks WHERE task_id = ? ORDER BY position
        `).all(taskId)

        return subtasks.map(sub => ({
            id: sub.id,
            taskId: sub.task_id,
            title: sub.title,
            isCompleted: Boolean(sub.is_completed),
            position: sub.position
        }))
    }

    addSubtask(taskId, title, position = 0) {
        const id = randomUUID()
        this.db.prepare(`
            INSERT INTO subtasks (id, task_id, title, is_completed, position)
            VALUES (?, ?, ?, 0, ?)
        `).run(id, taskId, title, position)

        return { id, taskId, title, isCompleted: false, position }
    }

    updateSubtask(id, updates) {
        const fields = []
        const values = []

        if (updates.title !== undefined) {
            fields.push('title = ?')
            values.push(updates.title)
        }
        if (updates.isCompleted !== undefined) {
            fields.push('is_completed = ?')
            values.push(updates.isCompleted ? 1 : 0)
        }
        if (updates.position !== undefined) {
            fields.push('position = ?')
            values.push(updates.position)
        }

        if (fields.length > 0) {
            values.push(id)
            this.db.prepare(`UPDATE subtasks SET ${fields.join(', ')} WHERE id = ?`).run(...values)
        }

        return this.db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id)
    }

    // ============ RECORRÊNCIA ============

    generateNextRecurringInstance(task) {
        if (!task.dueDate) return

        const currentDate = new Date(task.dueDate)
        const nextDate = new Date(currentDate)
        const interval = task.recurrenceInterval || 1

        if (task.recurrencePattern === 'daily') {
            nextDate.setDate(currentDate.getDate() + interval)
        }
        else if (task.recurrencePattern === 'weekly') {
            if (task.recurrenceDays && task.recurrenceDays.length > 0) {
                const currentDay = currentDate.getDay() // 0-6
                const days = task.recurrenceDays.sort((a, b) => a - b)
                const nextInWeek = days.find(d => d > currentDay)

                if (nextInWeek !== undefined) {
                    nextDate.setDate(currentDate.getDate() + (nextInWeek - currentDay))
                } else {
                    const daysUntilNextSunday = 7 - currentDay
                    const weeksToSkipDays = (interval - 1) * 7
                    const dayOffset = days[0]
                    nextDate.setDate(currentDate.getDate() + daysUntilNextSunday + weeksToSkipDays + dayOffset)
                }
            } else {
                nextDate.setDate(currentDate.getDate() + (7 * interval))
            }
        }
        else if (task.recurrencePattern === 'monthly') {
            nextDate.setMonth(currentDate.getMonth() + interval)
        }
        else if (task.recurrencePattern === 'yearly') {
            nextDate.setFullYear(currentDate.getFullYear() + interval)
        }

        if (task.recurrenceEndDate) {
            const endDate = new Date(task.recurrenceEndDate)
            if (nextDate > endDate) return
        }

        const nextDateStr = nextDate.toISOString().split('T')[0]
        console.log(`[Database] Gerando nova ocorrência para ${nextDateStr}`)

        const subtasksToCreate = task.subtasks ? task.subtasks.map(s => ({
            title: s.title,
            position: s.position
        })) : []

        this.addTask({
            ...task,
            id: undefined,
            isCompleted: false,
            dueDate: nextDateStr,
            createdAt: undefined,
            subtasks: subtasksToCreate,
            parentTaskId: task.id
        })
    }

    deleteSubtask(id) {
        const result = this.db.prepare('DELETE FROM subtasks WHERE id = ?').run(id)
        return result.changes > 0
    }

    // ============ UTILITÁRIOS ============

    close() {
        this.db.close()
        console.log('[Database] Conexão fechada')
    }
}
