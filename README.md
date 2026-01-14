# STM Task Manager

Um gerenciador de tarefas desktop moderno e elegante, construído com Electron, React e TypeScript.

## 🚀 Funcionalidades

- ✅ **CRUD Completo**: Criar, editar, excluir e visualizar tarefas
- 📁 **Organização por Grupos**: Organize suas tarefas em grupos personalizados
- 🎨 **Interface Moderna**: Design dark premium com animações suaves
- 💾 **Persistência Local**: Dados salvos automaticamente em arquivo JSON local
- 🖥️ **Aplicativo Desktop**: Executável nativo para macOS, Windows e Linux

## 📋 Pré-requisitos

- Node.js 16+ 
- npm ou yarn

## 🛠️ Instalação

```bash
# Instalar dependências
npm install
```

## 🎯 Como Usar

### Modo Desenvolvimento

```bash
# Iniciar em modo de desenvolvimento
npm run electron:dev
```

Isso irá:
1. Iniciar o servidor Vite
2. Abrir a janela do Electron automaticamente
3. Habilitar hot-reload para desenvolvimento

### Build para Produção

```bash
# Criar build de produção
npm run build

# Criar executável
npm run electron:build
```

O executável será gerado na pasta `dist/`.

## 📁 Estrutura do Projeto

```
STM/
├── electron/              # Processo principal do Electron
│   ├── main.js           # Entry point do Electron
│   ├── preload.js        # Ponte segura (IPC)
│   └── dataManager.js    # Gerenciador de dados local
├── src/                  # Frontend React
│   ├── components/       # Componentes React
│   ├── hooks/           # Custom hooks
│   ├── styles/          # Estilos globais
│   └── types/           # Tipos TypeScript
└── package.json
```

## 💡 Funcionalidades Principais

### Tarefas
- Criar nova tarefa com título
- Marcar como concluída
- Editar título e grupo
- Excluir tarefa
- Filtrar por grupo

### Grupos
- Criar grupos personalizados
- Escolher cor do grupo
- Excluir grupos (tarefas movidas para "Sem Grupo")
- Visualizar contador de tarefas por grupo

## 🎨 Design

O aplicativo utiliza:
- **Fonte**: Inter (Google Fonts)
- **Tema**: Dark mode premium
- **Cores**: Sistema de design com variáveis CSS
- **Animações**: Transições suaves e micro-interações

## 📦 Tecnologias

- **Electron** - Framework para aplicativos desktop
- **React** - Biblioteca UI
- **TypeScript** - Type safety
- **Vite** - Build tool e dev server
- **CSS Modules** - Estilos componentizados

## 📝 Dados

Os dados são salvos automaticamente em:
- **macOS**: `~/Library/Application Support/stm-task-manager/tasks-data.json`
- **Windows**: `%APPDATA%/stm-task-manager/tasks-data.json`
- **Linux**: `~/.config/stm-task-manager/tasks-data.json`

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## 📄 Licença

MIT

---

Desenvolvido com ❤️ por Gabriel Selo
