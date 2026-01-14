-- Schema para Selo TaskManager v2.0

-- Tabela de Grupos
CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL
);

-- Tabela de Tarefas
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    is_completed INTEGER DEFAULT 0,
    is_important INTEGER DEFAULT 0,
    group_id TEXT,
    created_at TEXT NOT NULL,
    due_date TEXT,
    due_time TEXT,
    scope TEXT,
    target_week TEXT,
    target_month TEXT,
    is_recurring INTEGER DEFAULT 0,
    recurrence_pattern TEXT,
    recurrence_interval INTEGER DEFAULT 1,
    recurrence_days TEXT,
    recurrence_end_date TEXT,
    parent_task_id TEXT,
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

-- Tabela de Subtarefas
CREATE TABLE IF NOT EXISTS subtasks (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    title TEXT NOT NULL,
    is_completed INTEGER DEFAULT 0,
    position INTEGER DEFAULT 0,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tasks_group ON tasks(group_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);
