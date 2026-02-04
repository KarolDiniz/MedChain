# MedChain

Sistema de gerenciamento de prontuários médicos baseado em blockchain, onde a integridade dos dados médicos é garantida por hashes e registros imutáveis.

## Tecnologias

- **React** com Vite
- **React Router** para navegação
- **JavaScript** (ES6+)
- Componentização clara e reutilizável
- Separação de responsabilidades (views, components, services)

## Como executar

```bash
npm install
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173)

## Usuários de demonstração

**Senha padrão para todos:** `12345`

### Doutores
| E-mail | Senha |
|--------|-------|
| maria.silva@medchain.com | 12345 |
| joao.santos@medchain.com | 12345 |

### Pacientes
| E-mail | Senha |
|--------|-------|
| ana.oliveira@email.com | 12345 |
| carlos.mendes@email.com | 12345 |

## Funcionalidades

### Doutor
- Dashboard com visão geral
- CRUD de Pacientes (cadastro exclusivo pelo doutor)
- CRUD de Prontuários Médicos
- Tipos de prontuário: Consultas, Diagnósticos, Prescrições, Atestados, Arquivos
- Indicadores de blockchain e auditoria

### Paciente
- Visualização do perfil (somente leitura)
- Visualização de todos os prontuários médicos
- Consultas, diagnósticos, prescrições, atestados e arquivos

## Estrutura do projeto

```
src/
├── components/     # Componentes reutilizáveis
│   ├── common/     # Button, Input, Card
│   ├── layout/     # Sidebar, Layout
│   ├── auth/       # ProtectedRoute
│   └── doctor/     # Modais CRUD
├── contexts/       # AuthContext
├── data/           # Mock data
├── pages/          # Páginas/views
│   ├── auth/       # Login, Register
│   ├── doctor/     # Dashboard, Patients, MedicalRecords
│   └── patient/    # Profile, MedicalRecords
├── services/       # Lógica de negócio
└── styles/         # Tema e estilos globais
```

## Regras de negócio

- **Paciente não possui tela de cadastro** — O cadastro é realizado exclusivamente pelo doutor
- **Imutabilidade** — Prontuários protegidos por hashes (conceito de blockchain)
- **Auditoria** — Cada registro possui hash para validação de integridade
