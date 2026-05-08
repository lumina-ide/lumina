# Lumina — Inferência Local com llama.cpp

Guia de desenvolvimento para integrar o `llama-server` (llama.cpp) diretamente no Lumina, eliminando a dependência do Ollama como processo externo.

---

## Objetivo

Permitir que o usuário use modelos GGUF locais (Neuronal, Helixa, Yune, Huda, Lumina e qualquer outro) diretamente no editor, sem instalar nada além do próprio Lumina.

**Plataformas:** Windows x64, Linux x64
**Formatos suportados:** GGUF
**API:** OpenAI-compatible (já suportada pelo pipeline existente)

---

## Arquitetura

```
Lumina Editor
├── Browser Process (UI)
│   ├── Settings UI — seleção de modelo, configuração de parâmetros
│   └── Provider "llamaServer" — igual aos outros providers
│
└── Electron Main Process (Node.js)
    ├── LlamaServerService — gerencia o processo llama-server
    │   ├── spawn/kill do binário
    │   ├── detecção de GPU (CUDA/Vulkan/CPU)
    │   └── health check via HTTP
    └── LLMMessageChannel — já existente, sem mudanças
```

O `llama-server` expõe `http://localhost:PORT/v1` — API 100% compatível com OpenAI. O pipeline de mensagens existente (`_sendOpenAICompatibleChat`) funciona sem modificação.

---

## Fase 1 — Provider e processo básico

**Estimativa: 4-6 horas**

### 1.1 Registrar o provider `llamaServer`

**Arquivo:** `src/vs/workbench/contrib/void/common/modelCapabilities.ts`

```typescript
llamaServer: {
  endpoint: 'http://127.0.0.1:8080',
  modelPath: '',        // caminho para o arquivo .gguf
  contextSize: 4096,
  gpuLayers: -1,        // -1 = auto (tudo na GPU se possível)
  threads: 4,
  temperature: 0.7,
  repeatPenalty: 1.1,
  systemPrompt: '',
}
```

**Arquivo:** `src/vs/workbench/contrib/void/common/voidSettingsTypes.ts`
- Adicionar `llamaServer` ao `defaultProviderSettings`
- Adicionar `llamaServer` ao `localProviderNames`

### 1.2 Implementação do provider

**Arquivo:** `src/vs/workbench/contrib/void/electron-main/llmMessage/sendLLMMessage.impl.ts`

```typescript
llamaServer: {
  sendChat: (params) => _sendOpenAICompatibleChat(params),  // reutiliza existente
  sendFIM: (params) => _sendOpenAICompatibleFIM(params),    // reutiliza existente
  list: llamaServerList,                                     // novo: lista modelos carregados
}
```

### 1.3 Serviço de gerenciamento do processo

**Arquivo novo:** `src/vs/workbench/contrib/void/electron-main/llamaServerService.ts`

Responsabilidades:
- Localizar o binário `llama-server` empacotado
- Detectar GPU disponível (NVIDIA CUDA, AMD Vulkan, CPU fallback)
- Spawnar o processo com os parâmetros corretos
- Monitorar saúde via `GET /health`
- Matar o processo ao fechar o editor
- Expor eventos: `onStarted`, `onStopped`, `onError`

```typescript
export class LlamaServerService extends Disposable {
  async start(modelPath: string, options: LlamaServerOptions): Promise<void>
  async stop(): Promise<void>
  async isRunning(): Promise<boolean>
  async getLoadedModel(): Promise<string | null>
}
```

### 1.4 Registrar o serviço no app.ts

**Arquivo:** `src/vs/code/electron-main/app.ts`
- Registrar `ILlamaServerService` no container de DI
- Registrar canal IPC `lumina-channel-llamaServer`
- Garantir shutdown no `onWillShutdown`

---

## Fase 2 — Gerenciamento de modelos (UI)

**Estimativa: 4-5 horas**

### 2.1 Componente de seleção de modelo

**Arquivo:** `src/vs/workbench/contrib/void/browser/react/src/void-settings-tsx/Settings.tsx`

Adicionar seção "Local Models (llama.cpp)" com:
- Botão "Browse" para selecionar arquivo `.gguf`
- Campo de caminho do modelo
- Status do servidor (Stopped / Loading / Running)
- Botão Start/Stop manual
- Indicador de GPU detectada

### 2.2 Parâmetros configuráveis pelo usuário

Expor na UI:
| Parâmetro | Padrão | Descrição |
|---|---|---|
| Context Size | 4096 | Janela de contexto |
| GPU Layers | -1 (auto) | Camadas na GPU (-1 = todas) |
| Threads | 4 | Threads de CPU |
| Temperature | 0.7 | Criatividade do modelo |
| Repeat Penalty | 1.1 | Penalidade de repetição |
| System Prompt | (vazio) | Prompt de sistema fixo |
| Port | 8080 | Porta do servidor |

### 2.3 Modelos recomendados (Neuronal)

Lista de modelos da família Neuronal pré-configurados com capabilities corretas:

```typescript
const neuronalModelOptions = {
  'neuronal-1b': { contextWindow: 4096, sizeGb: 0.8, supportsFIM: true },
  'neuronal-2b': { contextWindow: 4096, sizeGb: 1.5, supportsFIM: true },
  'neuronal-4b': { contextWindow: 8192, sizeGb: 2.8, supportsFIM: true },
  'neuronal-7b': { contextWindow: 8192, sizeGb: 4.5, supportsFIM: true },
  'helixa-4b':   { contextWindow: 8192, sizeGb: 2.8, supportsFIM: false },
  'yune-7b':     { contextWindow: 16384, sizeGb: 4.5, supportsFIM: false },
  'huda-4b':     { contextWindow: 8192, sizeGb: 2.8, supportsFIM: false },
  'lumina-7b':   { contextWindow: 16384, sizeGb: 4.5, supportsFIM: true },
}
```

---

## Fase 3 — Binários empacotados

**Estimativa: 3-4 horas**

### 3.1 Estrutura de binários

```
resources/
└── llama/
    ├── win32-x64/
    │   ├── llama-server.exe
    │   ├── llama-server-cuda.exe    # versão NVIDIA
    │   └── llama-server-vulkan.exe  # versão AMD/Intel
    └── linux-x64/
        ├── llama-server
        ├── llama-server-cuda
        └── llama-server-vulkan
```

### 3.2 Detecção de GPU

```typescript
async function detectGPU(): Promise<'cuda' | 'vulkan' | 'cpu'> {
  // Windows: checar registro NVIDIA, AMD
  // Linux: checar /dev/nvidia*, lspci
  // Fallback: CPU
}
```

### 3.3 Seleção automática do binário

```typescript
const binaryName = platform === 'win32'
  ? `llama-server${gpu === 'cuda' ? '-cuda' : gpu === 'vulkan' ? '-vulkan' : ''}.exe`
  : `llama-server${gpu === 'cuda' ? '-cuda' : gpu === 'vulkan' ? '-vulkan' : ''}`
```

### 3.4 Atualizar o build

**Arquivo:** `build/gulpfile.vscode.js` ou `build/gulpfile.vscode.win32.js`
- Incluir pasta `resources/llama/` no pacote final
- Garantir permissões de execução no Linux (`chmod +x`)

---

## Fase 4 — RAG e multimodal

**Estimativa: 6-8 horas**

### 4.1 RAG (Retrieval-Augmented Generation)

Permite que o modelo acesse documentação atualizada, código do projeto, etc.

**Componentes:**
- Indexador de arquivos do workspace (usa o file watcher existente do VSCode)
- Embeddings locais via `llama-server` (endpoint `/v1/embeddings`)
- Vector store simples em SQLite (já existe `@vscode/sqlite3` nas deps)
- Injeção automática de contexto relevante no prompt

**Fluxo:**
```
Usuário faz pergunta
→ Gera embedding da pergunta
→ Busca chunks similares no vector store
→ Injeta no system prompt
→ Envia para o modelo
```

### 4.2 Suporte multimodal (imagem)

Para modelos com capacidade visual (LLaVA, BakLLaVA, modelos Neuronal multimodais):

- Detectar se o modelo carregado suporta visão (via `/v1/models` metadata)
- Habilitar upload de imagem no chat (já existe infraestrutura no Lumina)
- Converter imagem para base64 e incluir no payload OpenAI vision format

```typescript
// Payload para modelos multimodais
{
  role: 'user',
  content: [
    { type: 'text', text: 'O que há nessa imagem?' },
    { type: 'image_url', image_url: { url: 'data:image/png;base64,...' } }
  ]
}
```

---

## Fase 5 — Polimento e UX

**Estimativa: 3-4 horas**

### 5.1 Onboarding para modelos locais

Na tela de onboarding existente, adicionar passo:
- "Você tem modelos GGUF locais? Aponte o caminho."
- Detectar automaticamente se há modelos em pastas comuns
- Sugerir download de modelos recomendados da Neuronal

### 5.2 Indicadores de status

- Ícone na status bar mostrando: modelo carregado, uso de VRAM, velocidade (tokens/s)
- Notificação quando o modelo terminar de carregar
- Aviso quando VRAM insuficiente (sugerir reduzir GPU layers)

### 5.3 Checklist de manutenção mensal

Ver `MAINTENANCE.md` para procedimentos de atualização do llama.cpp.

---

## Ordem de implementação recomendada

```
Fase 1.1 → 1.2 → 1.3 → 1.4   (provider + processo)
     ↓
Fase 2.1 → 2.2 → 2.3          (UI básica)
     ↓
Fase 3.1 → 3.2 → 3.3 → 3.4   (binários)
     ↓
Testar end-to-end
     ↓
Fase 4.1 (RAG)
Fase 4.2 (multimodal)
     ↓
Fase 5 (polimento)
```

---

## Arquivos que serão criados/modificados

| Arquivo | Ação |
|---|---|
| `src/.../common/modelCapabilities.ts` | Adicionar `llamaServer` provider |
| `src/.../common/voidSettingsTypes.ts` | Registrar provider e settings |
| `src/.../electron-main/llamaServerService.ts` | **NOVO** — gerenciador de processo |
| `src/.../electron-main/sendLLMMessage.impl.ts` | Adicionar `llamaServer` implementation |
| `src/.../electron-main/sendLLMMessageChannel.ts` | Adicionar canal `llamaServer` |
| `src/.../code/electron-main/app.ts` | Registrar serviço e canal |
| `src/.../react/src/void-settings-tsx/Settings.tsx` | UI de configuração |
| `resources/llama/` | **NOVO** — binários llama-server |
| `build/gulpfile.vscode.js` | Incluir binários no pacote |
| `BUILDING.md` | Documentar como obter binários llama.cpp |

---

## Notas importantes

- O `llama-server` usa a mesma API OpenAI — **zero mudanças no pipeline de mensagens**
- Manter Ollama como provider opcional para quem já usa
- O processo `llama-server` deve ser filho do processo Electron main — morre junto com o editor
- Modelos grandes (13B+) requerem GPU com VRAM suficiente — documentar requisitos mínimos
- Para CPU-only: modelos até 7B são viáveis com 16GB RAM
