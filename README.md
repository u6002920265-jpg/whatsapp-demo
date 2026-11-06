# 📊 WhatsApp Group Analytics Dashboard

React + D3 dashboard that ingests WhatsApp group exports (`.txt`, `.json`, `.csv`) and turns them into interactive insights with cross-filtering, theme toggle, and PDF export.

---

## ✨ Highlights

- **Import pipeline**: drag & drop WhatsApp exports, auto-detect format, persist last dataset in `localStorage`, reset to bundled sample (`cr.txt`).
- **Portuguese-first UI**: todos os textos e o modal de ajuda estão em PT-PT, explicando como exportar chats no Android/iOS.
- **Filtro global por utilizadores**: clique em qualquer gráfico para selecionar/deselecionar participantes; multi-seleção e persistência incluídas.
- **Visualizações D3**:
  - Top Contributors (mensagens enviadas vs respostas recebidas)
  - Activity Heatmap (hora × dia, com popover “top users”)
  - Response Time (média auto-escalada)
  - Word Cloud (stopwords PT, sem URLs/números)
  - Conversation Threads (Sankey bipartido de iniciadores vs respondedores)
- **Painel “Informação Pessoal”**: mostra estatísticas detalhadas dos utilizadores filtrados.
- **Light/Dark + Export**: alternância de tema persistente e botão “Exportar PDF” multi-página.

---

## 🛠️ Tech Stack

| Camada | Escolha |
| --- | --- |
| Framework | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + modo escuro/claro |
| Charts | D3.js, d3-sankey, d3-cloud |
| Estado | React Context (DataSource, Filter, Theme) |
| Persistência | `localStorage` (dataset, filtros, tema) |

---

## 🚀 Como correr

```bash
npm install
npm run dev        # http://localhost:5173

npm run build
npm run preview    # opcional, build de produção
```

> Se a porta 5173 estiver ocupada, usa `npm run dev -- --port 5174`.

---

## 📥 Importar dados

1. Abre o painel **“Fonte de Dados”**.
2. Carrega um ficheiro `.txt`, `.json` ou `.csv`.
3. Observa a barra de progresso; erros aparecem no próprio painel.
4. O dataset fica guardado (podes recarregar a página e continuar).
5. Usa “**Repor exemplo (cr.txt)**” para restaurar o sample e limpar filtros.

Formato esperado:

- **TXT**: export WhatsApp oficial (sem media).
- **JSON**: array `{ timestamp, sender, content }` (timestamp ISO).
- **CSV**: colunas `timestamp,sender,message`.

---

## 🧭 Tour rápido

| Secção | Descrição |
| --- | --- |
| **Resumo** | Totais de mensagens, participantes, intervalo temporal e dia mais ativo. |
| **Top Contributors** | Barras horizontais com mensagens enviadas vs respostas recebidas. |
| **User Details Panel** | Estatísticas pessoais para os utilizadores filtrados. |
| **Activity Heatmap** | 24h × 7 dias com tooltip e popover detalhado. |
| **Response Time** | Médias de resposta por utilizador, com escala dinâmica. |
| **Word Cloud** | Nuvem de palavras (sem stopwords PT/URLs). |
| **Conversation Threads** | Sankey bipartido que mostra fluxo de conversas iniciador→respondedor. |
| **Análise de Infrações** | Deteção por IA + mesa de revisão e exportação do snapshot do jogo. |

---

## 🎲 Snapshot do jogo

Depois de correr a análise de infrações, a **Mesa de revisão** permite rever as deteções antes de as transformar num snapshot para o jogo *O Melão dos Cedros*.

- Remove falsos positivos, ajusta a gravidade (baixa = 1 fita, média = 2, alta = 3) e vê o elenco a recompor-se.
- O elenco são os **12 com mais fitas**, com desempate por infrações, mensagens e nome. Se houver menos de 12 pessoas com fitas, as vagas são preenchidas pelos membros sem infrações com mais mensagens.
- **Privado**: nomes reais, mensagens e gravidades. **Público**: alcunhas editáveis, sem mensagens nem números.
- Descarrega `game-data.json` ou `game-data.public.json`, com `schemaVersion`, `generatedAt` e `reviewedAt`.
- A análise usa as **últimas 50 mensagens** de cada participante e resolve os números de telefone para os nomes de `contacts.json` antes de os enviar à IA.

O contrato do snapshot está em `docs/jogo-melao-dos-cedros.md` no repositório do jogo.

---

## 🧱 Estrutura

```text
src/
├── components/
│   ├── Dashboard.tsx           # Layout principal
│   ├── DataImportPanel.tsx     # Upload, ajuda e reset
│   ├── UserDetailsPanel.tsx    # Informação pessoal
│   ├── SummaryStats.tsx, TopContributors.tsx, ...
├── context/
│   ├── DataSourceContext.tsx   # Importação + persistência
│   └── FilterContext.tsx       # Filtros globais memoizados
├── hooks/
│   └── useChartData.ts         # Agregações para gráficos
├── utils/
│   ├── importParsers.ts        # Deteção de formato + parsing
│   └── parser.ts               # Parser WhatsApp TXT
└── types/
    └── index.ts                # Tipos partilhados
```

---

## 🔐 Persistência & Contextos

- **DataSourceContext**: gere `sample` vs `imported`, progresso, erros e `datasetId`.
- **FilterContext**: callbacks estabilizados com `useCallback`/`useMemo` (evita loops) e guarda seleção em `localStorage`.
- **ThemeContext**: toggle claro/escuro com persistência.

---

## 🧪 Dicas & Troubleshooting

1. **Loop “Maximum update depth exceeded”** – assegura que callbacks passados para `useEffect` estão memoizados (já feito no `FilterContext`).
2. **Import falhou** – valida se o ficheiro está em UTF-8 e segue os campos esperados.
3. **Popover fora do ecrã** – o heatmap já usa clamping; reutiliza a mesma abordagem noutros gráficos.
4. **PDF incompleto** – confirma que o elemento com `id="dashboard-content"` engloba todos os charts antes de exportar.

---

## 🤝 Fluxo de contribuições

1. Cria uma branch (ex.: `feature/<nome>`).
2. Implementa, testa e garante `npm run lint`/`npm run build`.
3. Abre PR para `source` → merge → atualiza `main`.

---

Feito com ☕, React hooks e D3.
