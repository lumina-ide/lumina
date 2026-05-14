# Lumina — Implementação de Inferência Local (llama.cpp)

Guia de implementação passo a passo para integrar o `llama-server` diretamente no Lumina.
Objetivo: rodar modelos GGUF locais sem instalar nada além do próprio Lumina.

---

## Visão Geral

```
Lumina Editor
├── Browser Process (UI)
│   ├── Provider "llamaServer" nas Settings
│   └── UI de seleção/configuração de modelo
│
└── Electron Main Process
    ├── LlamaServerService — gerencia o processo llama-server
    └── LLMMessageChannel — já existente, sem mudanças
```

O `llama-server` expõe `http://localhost:PORT/v1` — API OpenAI-compatible.
O pipeline de mensagens existente (`_sendOpenAICompatibleChat`) funciona **sem modificação**.

---

## Fase 1 — Provider e Processo Básico

**Arquivos a modificar/criar:**

### 1.1 — Registrar o provider `llamaServer`

**Arquivo:** `src/vs/workbench/contrib/void/common/modelCapabilities.ts`

Adicionar em `defaultProviderSettings`:
```typescript
llamaServer: {
    endpoint: 'http://127.0.0.1:8080',
    modelPath: '',
    contextSize: 4096,
    gpuLayers: -1,       // -1 = auto (tudo na GPU)
    threads: 4,
    temperature: 0.7,
    repeatPenalty: 1.1,
    systemPrompt: '',
    port: 8080,
},
```

Adicionar em `defaultModelsOfProvider`:
```typescript
llamaServer: [], // autodetected from loaded model
```

---

### 1.2 — Registrar o tipo do provider

**Arquivo:** `src/vs/workbench/contrib/void/common/voidSettingsTypes.ts`

- Adicionar `llamaServer` ao `localProviderNames`
- O `ProviderName` é derivado automaticamente de `defaultProviderSettings`

---

### 1.3 — Implementação do provider no pipeline LLM

**Arquivo:** `src/vs/workbench/contrib/void/electron-main/llmMessage/sendLLMMessage.impl.ts`

Adicionar no `newOpenAICompatibleSDK`:
```typescript
else if (providerName === 'llamaServer') {
    const thisConfig = settingsOfProvider.llamaServer
    return new OpenAI({
        baseURL: `${thisConfig.endpoint}/v1`,
        apiKey: 'noop',
        ...commonPayloadOpts
    })
}
```

Adicionar em `sendLLMMessageToProviderImplementation`:
```typescript
llamaServer: {
    sendChat: (params) => _sendOpenAICompatibleChat(params),
    sendFIM: (params) => _sendOpenAICompatibleFIM(params),
    list: llamaServerList,
},
```

Implementar `llamaServerList` (lista o modelo carregado via `/v1/models`).

---

### 1.4 — Serviço de gerenciamento do processo

**Arquivo novo:** `src/vs/workbench/contrib/void/electron-main/llamaServerService.ts`

```typescript
export interface ILlamaServerService {
    readonly _serviceBrand: undefined;
    start(modelPath: string, options: LlamaServerOptions): Promise<void>;
    stop(): Promise<void>;
    isRunning(): Promise<boolean>;
    getStatus(): LlamaServerStatus;
    readonly onDidChangeStatus: Event<LlamaServerStatus>;
}

export type LlamaServerStatus = 'stopped' | 'starting' | 'running' | 'error';

export interface LlamaServerOptions {
    port: number;
    contextSize: number;
    gpuLayers: number;
    threads: number;
}
```

Responsabilidades:
- Localizar o binário `llama-server` em `resources/llama/{platform}/`
- Detectar GPU (NVIDIA CUDA, AMD Vulkan, CPU fallback)
- Spawnar o processo com `child_process.spawn`
- Monitorar saúde via `GET /health`
- Matar o processo no shutdown do editor
- Emitir eventos de status

---

### 1.5 — Registrar o serviço no app.ts

**Arquivo:** `src/vs/code/electron-main/app.ts`

```typescript
// Lumina - llama.cpp local inference
services.set(ILlamaServerService, new SyncDescriptor(LlamaServerService, undefined, false));

// Canal IPC
const llamaServerChannel = ProxyChannel.fromService(accessor.get(ILlamaServerService), disposables);
mainProcessElectronServer.registerChannel('lumina-channel-llamaServer', llamaServerChannel);
```

---

## Fase 2 — UI de Configuração

**Arquivo:** `src/vs/workbench/contrib/void/browser/react/src/void-settings-tsx/Settings.tsx`

Adicionar seção "Local Model (llama.cpp)" com:

```
┌─────────────────────────────────────────┐
│  Local Model (llama.cpp)                │
│                                         │
│  Model file: [Browse...]  path/to/model │
│  Status: ● Running — qwen2.5-coder-7b  │
│                                         │
│  GPU: NVIDIA RTX 3080 (CUDA)           │
│  Context: [4096    ▼]                  │
│  GPU Layers: [-1 (auto) ▼]             │
│  Threads: [4  ▼]                       │
│  Temperature: [0.7]                    │
│  Repeat Penalty: [1.1]                 │
│  Port: [8080]                          │
│                                         │
│  System Prompt:                         │
│  [                                    ] │
│                                         │
│  [  Start Model  ]  [  Stop  ]         │
└─────────────────────────────────────────┘
```

---

## Fase 3 — Binários llama-server

### 3.1 — Estrutura de pastas

```
resources/
└── llama/
    ├── win32-x64/
    │   ├── llama-server.exe          # CPU only
    │   ├── llama-server-cuda.exe     # NVIDIA CUDA
    │   └── llama-server-vulkan.exe   # AMD/Intel Vulkan
    └── linux-x64/
        ├── llama-server              # CPU only
        ├── llama-server-cuda         # NVIDIA CUDA
        └── llama-server-vulkan       # AMD/Intel Vulkan
```

### 3.2 — Obter os binários

Baixar releases do llama.cpp: https://github.com/ggml-org/llama.cpp/releases

Para Windows:
- `llama-bXXXX-bin-win-cpu-x64.zip` → extrair `llama-server.exe`
- `llama-bXXXX-bin-win-cuda-cu12.4-x64.zip` → extrair `llama-server.exe` → renomear para `llama-server-cuda.exe`
- `llama-bXXXX-bin-win-vulkan-x64.zip` → extrair `llama-server.exe` → renomear para `llama-server-vulkan.exe`

Para Linux:
- Mesma lógica com os zips linux

### 3.3 — Detecção de GPU

```typescript
async function detectGPU(): Promise<'cuda' | 'vulkan' | 'cpu'> {
    if (process.platform === 'win32') {
        // Checar registro NVIDIA: HKLM\SOFTWARE\NVIDIA Corporation
        // Checar registro AMD: HKLM\SOFTWARE\AMD
    } else {
        // Linux: checar /dev/nvidia0 ou lspci
    }
    return 'cpu'; // fallback
}
```

### 3.4 — Incluir no build

**Arquivo:** `build/gulpfile.vscode.js`

Adicionar cópia da pasta `resources/llama/` no pacote final.

---

## Fase 4 — RAG (Retrieval-Augmented Generation)

### 4.1 — Componentes necessários

- **Indexador**: usa o file watcher existente do VSCode para monitorar mudanças
- **Embeddings**: via `llama-server` endpoint `/v1/embeddings`
- **Vector store**: SQLite (já existe `@vscode/sqlite3` nas deps)
- **Injeção de contexto**: adiciona chunks relevantes no system prompt

### 4.2 — Fluxo

```
Usuário faz pergunta
  → Gera embedding da pergunta (llama-server /v1/embeddings)
  → Busca chunks similares no SQLite (cosine similarity)
  → Injeta no system prompt como contexto
  → Envia para o modelo
```

### 4.3 — Arquivos novos

- `src/.../void/electron-main/ragService.ts` — indexação e busca
- `src/.../void/common/ragServiceTypes.ts` — tipos e interface
- `src/.../void/electron-main/ragChannel.ts` — canal IPC

---

## Fase 5 — Suporte Multimodal

Para modelos com visão (LLaVA, modelos Neuronal multimodais):

### 5.1 — Detecção de capacidade

```typescript
// GET /v1/models retorna metadata do modelo
// Checar se o modelo tem "vision" nas capabilities
const hasVision = modelInfo.capabilities?.includes('vision') ?? false;
```

### 5.2 — Payload de imagem

```typescript
// Formato OpenAI vision (suportado pelo llama-server)
{
    role: 'user',
    content: [
        { type: 'text', text: 'O que há nessa imagem?' },
        { type: 'image_url', image_url: { url: 'data:image/png;base64,...' } }
    ]
}
```

### 5.3 — UI

- Habilitar botão de upload de imagem no chat quando modelo suportar visão
- Converter imagem para base64 no browser process
- Enviar via payload multimodal

---

## Ordem de Implementação

```
Fase 1.1  Registrar provider llamaServer em modelCapabilities.ts
Fase 1.2  Registrar tipo em voidSettingsTypes.ts
Fase 1.3  Implementar no pipeline LLM (sendLLMMessage.impl.ts)
Fase 1.4  Criar LlamaServerService (electron-main)
Fase 1.5  Registrar no app.ts
    ↓
Testar: subir llama-server manualmente, verificar chat funcionando
    ↓
Fase 2    UI de configuração nas Settings
    ↓
Fase 3.1  Criar estrutura resources/llama/
Fase 3.2  Baixar binários llama.cpp
Fase 3.3  Implementar detecção de GPU
Fase 3.4  Incluir no build
    ↓
Testar: build completo, instalador, rodar modelo do zero
    ↓
Fase 4    RAG
Fase 5    Multimodal
```

---

## Arquivos Modificados/Criados

| Arquivo | Ação |
|---|---|
| `src/.../common/modelCapabilities.ts` | Adicionar `llamaServer` |
| `src/.../common/voidSettingsTypes.ts` | Adicionar ao `localProviderNames` |
| `src/.../electron-main/llamaServerService.ts` | **NOVO** |
| `src/.../electron-main/sendLLMMessage.impl.ts` | Adicionar `llamaServer` |
| `src/.../electron-main/sendLLMMessageChannel.ts` | Adicionar canal |
| `src/.../code/electron-main/app.ts` | Registrar serviço |
| `src/.../react/src/void-settings-tsx/Settings.tsx` | UI de configuração |
| `resources/llama/` | **NOVO** — binários |
| `build/gulpfile.vscode.js` | Incluir `resources/llama/` no pacote |
| `scripts/build-installer-win32-x64.bat` | Já atualizado |

---

## Notas Importantes

- O `llama-server` usa API OpenAI-compatible — **zero mudanças no pipeline de mensagens**
- Manter Ollama como provider opcional para quem já usa
- O processo `llama-server` deve morrer junto com o editor (filho do main process)
- Modelos recomendados para começar: `qwen2.5-coder-7b-instruct.Q4_K_M.gguf` (~4.5GB)
- Para CPU-only: modelos até 7B são viáveis com 16GB RAM
- Para GPU 8GB VRAM: até 13B confortável
