# Building Lumina

Guia prático para compilar e rodar o Lumina em modo de desenvolvimento.

---

## Pré-requisitos

### Node.js

Use exatamente a versão `20.18.2` (definida em `.nvmrc`).

```bash
# Com nvm (recomendado)
nvm install
nvm use
```

### Windows

Instale o [Visual Studio 2022](https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=Community) com os seguintes componentes:

**Workloads:**
- `Desktop development with C++`
- `Node.js build tools`

**Individual Components:**
- `MSVC v143 - VS 2022 C++ x64/x86 Spectre-mitigated libs (Latest)`
- `C++ ATL for latest build tools with Spectre Mitigations`
- `C++ MFC for latest build tools with Spectre Mitigations`

### macOS

Python e XCode (geralmente já instalados).

### Linux

```bash
# Debian/Ubuntu
sudo apt-get install build-essential g++ libx11-dev libxkbfile-dev libsecret-1-dev libkrb5-dev python-is-python3

# Fedora/Red Hat
sudo dnf install @development-tools gcc gcc-c++ make libsecret-devel krb5-devel libX11-devel libxkbfile-devel

# openSUSE
sudo zypper install patterns-devel-C-C++-devel_C_C++ krb5-devel libsecret-devel libxkbfile-devel libX11-devel
```

### Rust (apenas para o CLI)

Instale via [rustup.rs](https://rustup.rs) se precisar compilar o CLI em `cli/`.

---

## Setup inicial

```bash
# 1. Instalar dependências (1100+ pacotes)
npm install
```

> **Atenção:** o caminho da pasta do projeto **não pode conter espaços**.

---

## Rodando em modo de desenvolvimento

São necessários **três processos** rodando simultaneamente. Abra três terminais:

### Terminal 1 — watch-client (TypeScript principal)

```bash
node --max-old-space-size=8192 ./node_modules/gulp/bin/gulp.js watch-client
```

Compila todo o TypeScript do Lumina. A primeira compilação leva ~6-7 minutos. Após isso fica em modo watch.

### Terminal 2 — watch-extensions (extensões built-in)

```bash
node --max-old-space-size=8192 ./node_modules/gulp/bin/gulp.js watch-extensions watch-extension-media
```

Compila as extensões built-in. A primeira compilação leva ~3 minutos.

### Terminal 3 — Lumina (janela do editor)

Aguarde os dois watchers acima mostrarem `Finished compilation with 0 errors` antes de abrir.

```bash
# Windows
.\scripts\code.bat --user-data-dir .\.tmp\user-data --extensions-dir .\.tmp\extensions

# macOS / Linux
./scripts/code.sh --user-data-dir ./.tmp/user-data --extensions-dir ./.tmp/extensions
```

As flags `--user-data-dir` e `--extensions-dir` isolam o estado do editor de desenvolvimento. Para resetar, basta deletar a pasta `.tmp/`.

> Para ver mudanças no código: pressione `Ctrl+R` (ou `Cmd+R` no Mac) dentro da janela do Lumina.

### Atalho (VSCode/Lumina)

Alternativamente, pressione `Ctrl+Shift+B` (ou `Cmd+Shift+B` no Mac) dentro do VSCode/Lumina para iniciar os watchers automaticamente via task.

---

## Build do React

O código React fica em `src/vs/workbench/contrib/void/browser/react/src/`. O pipeline é:

```
src/ → scope-tailwind → src2/ → tsup → out/
```

`src2/` é gerado automaticamente — **não edite diretamente**.

```bash
# Build único
npm run buildreact

# Watch (recompila ao salvar)
npm run watchreact
```

Se der erro de memória:
```bash
NODE_OPTIONS="--max-old-space-size=8192" npm run buildreact
```

---

## Onde fica o código do Lumina

Todo o código específico do Lumina (não VSCode base) está em:

```
src/vs/workbench/contrib/void/
├── browser/        # UI, sidebar, chat, serviços de frontend
│   └── react/src/  # Componentes React (edite aqui, não em src2/)
├── common/         # Lógica compartilhada, tipos, modelos LLM
└── electron-main/  # Processo principal, roteamento de mensagens LLM
```

---

## Gerando o instalador Windows

Use o script que automatiza os três passos necessários:

```bash
.\scripts\build-installer-win32-x64.bat
```

O script executa em sequência:
1. `gulp vscode-win32-x64` — build completo (~25 min)
2. `gulp vscode-win32-x64-inno-updater` — copia as ferramentas de update
3. `gulp vscode-win32-x64-user-setup` — gera o instalador

**Saída:** `.build\win32-x64\user-setup\Lumina-win32-x64-user-setup.exe`

> **Atenção:** Não rode `vscode-win32-x64-user-setup` diretamente sem antes rodar o `inno-updater` — a pasta `tools/` é apagada a cada build e precisa ser repopulada.

Se quiser o instalador system-wide (requer admin):
```bash
npm run gulp vscode-win32-x64-inno-updater
npm run gulp vscode-win32-x64-system-setup
```

### Outras plataformas (apenas portátil, sem instalador)

```bash
npm run gulp vscode-darwin-arm64   # macOS Apple Silicon
npm run gulp vscode-darwin-x64     # macOS Intel
npm run gulp vscode-linux-x64      # Linux
```

---

## Problemas comuns

| Problema | Solução |
|---|---|
| Erro de versão do Node | Use `nvm install && nvm use` para garantir a versão `20.18.2` |
| Caminho com espaços | Mova o projeto para um caminho sem espaços |
| Erro no build do React | `NODE_OPTIONS="--max-old-space-size=8192" npm run buildreact` |
| Estilos não aparecem | Aguarde alguns segundos e recarregue com `Ctrl+R` |
| Erro de `dynamic import` | Verifique se todos os imports terminam com `.js` |
| `tools/` não encontrado no instalador | Execute `npm run gulp vscode-win32-x64-inno-updater` antes do setup |
| Sandbox no Linux | `sudo chown root:root .build/electron/chrome-sandbox && sudo chmod 4755 .build/electron/chrome-sandbox` |
| `libtool` no macOS | Use GNU libtool em vez do BSD libtool |

---

## Versões confirmadas em produção

| Ferramenta | Versão |
|---|---|
| Node.js | 20.18.2 |
| npm | 10.8.2 |
| Electron | 34.3.2 |
| TypeScript | 5.8.0-dev |
| React | 19.1.0 |
| Gulp | 4.0.0 |
