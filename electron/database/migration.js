import fs from 'fs'
import path from 'path'
import { app } from 'electron'

export function migrateFromJSON(dbManager) {
    const userDataPath = app.getPath('userData')
    const jsonPath = path.join(userDataPath, 'tasks-data.json')

    // Verifica se existe arquivo JSON antigo
    if (!fs.existsSync(jsonPath)) {
        console.log('[Migration] Nenhum arquivo JSON encontrado para migrar')
        return
    }

    try {
        const fileContent = fs.readFileSync(jsonPath, 'utf-8')
        const data = JSON.parse(fileContent)

        console.log('[Migration] Iniciando migração de dados...')

        // Migra grupos
        if (data.groups && data.groups.length > 0) {
            console.log(`[Migration] Migrando ${data.groups.length} grupos...`)

            for (const group of data.groups) {
                // Verifica se já existe
                const existing = dbManager.db.prepare('SELECT id FROM groups WHERE id = ?').get(group.id)

                if (!existing) {
                    dbManager.db.prepare(`
                        INSERT INTO groups (id, name, color) VALUES (?, ?, ?)
                    `).run(group.id, group.name, group.color)
                }
            }
        }

        // Migra tarefas
        if (data.tasks && data.tasks.length > 0) {
            console.log(`[Migration] Migrando ${data.tasks.length} tarefas...`)

            for (const task of data.tasks) {
                // Verifica se já existe
                const existing = dbManager.db.prepare('SELECT id FROM tasks WHERE id = ?').get(task.id)

                if (!existing) {
                    dbManager.db.prepare(`
                        INSERT INTO tasks (
                            id, title, description, is_completed, is_important,
                            group_id, created_at, due_date, due_time,
                            scope, target_week, target_month
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `).run(
                        task.id,
                        task.title,
                        null, // description não existia antes
                        task.isCompleted ? 1 : 0,
                        task.isImportant ? 1 : 0,
                        task.groupId || null,
                        task.createdAt || new Date().toISOString(),
                        task.dueDate || null,
                        task.dueTime || null,
                        task.scope || null,
                        task.targetWeek || null,
                        task.targetMonth || null
                    )
                }
            }
        }

        // Renomeia arquivo JSON para backup
        const backupPath = path.join(userDataPath, 'tasks-data.json.backup')
        fs.renameSync(jsonPath, backupPath)

        console.log('[Migration] Migração concluída com sucesso!')
        console.log(`[Migration] Backup salvo em: ${backupPath}`)

    } catch (error) {
        console.error('[Migration] Erro durante migração:', error)
        throw error
    }
}
