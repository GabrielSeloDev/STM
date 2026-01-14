import React, { useState } from 'react'
import { Group } from '../../types'
import './Sidebar.css'

interface SidebarProps {
    groups: Group[]
    selectedGroupId: string | null
    currentView: 'dashboard' | 'list' | 'calendar'
    onSelectGroup: (id: string | null) => void
    onViewChange: (view: 'dashboard' | 'list' | 'calendar') => void
    onAddGroup: (groupData: Partial<Group>) => void
    onDeleteGroup: (id: string) => void
    taskCounts: Record<string, number>
}

const PRESET_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
]

export function Sidebar({ groups, selectedGroupId, currentView, onSelectGroup, onViewChange, onAddGroup, onDeleteGroup, taskCounts }: SidebarProps) {
    const [isCreating, setIsCreating] = useState(false)
    const [newGroupName, setNewGroupName] = useState('')
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])
    const [isCollapsed, setIsCollapsed] = useState(false)

    const handleCreateGroup = (e: React.FormEvent) => {
        e.preventDefault()
        if (newGroupName.trim()) {
            onAddGroup({ name: newGroupName.trim(), color: selectedColor })
            setNewGroupName('')
            setSelectedColor(PRESET_COLORS[0])
            setIsCreating(false)
        }
    }

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="app-logo">
                    <div className="logo-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 11l3 3L22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                    </div>
                    {!isCollapsed && <span className="app-title">STM</span>}
                </div>
                <button
                    className="btn-collapse"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? "Expandir" : "Recolher"}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {isCollapsed ? (
                            <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
                        ) : (
                            <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
                        )}
                    </svg>
                </button>
            </div>

            <div className="sidebar-content">
                <div className="sidebar-section">
                    <button
                        className={`sidebar-item ${currentView === 'dashboard' ? 'active' : ''}`}
                        onClick={() => onViewChange('dashboard')}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="9" />
                            <rect x="14" y="3" width="7" height="5" />
                            <rect x="14" y="12" width="7" height="9" />
                            <rect x="3" y="16" width="7" height="5" />
                        </svg>
                        {!isCollapsed && <span>Dashboard</span>}
                    </button>

                    <button
                        className={`sidebar-item ${currentView === 'list' ? 'active' : ''}`}
                        onClick={() => onViewChange('list')}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="8" y1="6" x2="21" y2="6" />
                            <line x1="8" y1="12" x2="21" y2="12" />
                            <line x1="8" y1="18" x2="21" y2="18" />
                            <line x1="3" y1="6" x2="3.01" y2="6" />
                            <line x1="3" y1="12" x2="3.01" y2="12" />
                            <line x1="3" y1="18" x2="3.01" y2="18" />
                        </svg>
                        {!isCollapsed && <span>Lista de Tarefas</span>}
                    </button>

                    <button
                        className={`sidebar-item ${currentView === 'calendar' ? 'active' : ''}`}
                        onClick={() => onViewChange('calendar')}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {!isCollapsed && <span>Calendário</span>}
                    </button>
                </div>

                <div className="sidebar-section">
                    <div className="section-header">
                        {!isCollapsed && <span className="section-title">Grupos</span>}
                        <button className="btn-icon" onClick={() => setIsCreating(true)} title="Novo Grupo">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        </button>
                    </div>

                    <div className="groups-list">
                        {groups.map((group) => (
                            <div
                                key={group.id}
                                className="sidebar-item group-item"
                            >
                                <div className="group-button">
                                    <span className="group-color" style={{ backgroundColor: group.color }} />
                                    {!isCollapsed && (
                                        <>
                                            <span>{group.name}</span>
                                            <span className="item-count">{taskCounts[group.id] || 0}</span>
                                        </>
                                    )}
                                </div>
                                {!isCollapsed && group.id !== 'default' && group.id !== 'completed' && (
                                    <button
                                        className="btn-delete-group"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (confirm(`Deseja realmente excluir o grupo "${group.name}"?`)) {
                                                onDeleteGroup(group.id)
                                            }
                                        }}
                                        title="Excluir grupo"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="18" y1="6" x2="6" y2="18" />
                                            <line x1="6" y1="6" x2="18" y2="18" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {isCreating && (
                <div className="create-group-modal">
                    <div className="modal-backdrop" onClick={() => setIsCreating(false)} />
                    <div className="create-group-form animate-scale-in">
                        <h3>Novo Grupo</h3>
                        <form onSubmit={handleCreateGroup}>
                            <input
                                type="text"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder="Nome do grupo..."
                                autoFocus
                                required
                            />
                            <div className="color-picker">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setSelectedColor(color)}
                                    />
                                ))}
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsCreating(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Criar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
