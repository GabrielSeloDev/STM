import { Task, Group } from '../../types'
import { ImportantGoals } from './ImportantGoals'
import { GroupsPieChart } from './GroupsPieChart'
import './Dashboard.css'

interface DashboardProps {
    tasks: Task[]
    groups: Group[]
    onToggle: (id: string) => void
    onToggleImportant: (id: string) => void
    onEdit: (task: Task) => void
    onDelete: (id: string) => void
}

export function Dashboard({ tasks, groups, onToggle, onToggleImportant, onEdit, onDelete }: DashboardProps) {
    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <h1>📊 Dashboard</h1>
                <p className="dashboard-subtitle">Visão geral das suas metas e progresso</p>
            </header>

            <div className="dashboard-grid">
                <div className="dashboard-card important-section">
                    <ImportantGoals
                        tasks={tasks}
                        groups={groups}
                        onToggle={onToggle}
                        onToggleImportant={onToggleImportant}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                </div>

                <div className="dashboard-card chart-section">
                    <GroupsPieChart
                        tasks={tasks}
                        groups={groups}
                    />
                </div>
            </div>
        </div>
    )
}
