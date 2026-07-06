# Fluxo de Execução do Lumina IDE (Modo de Desenvolvimento)

Siga sempre esta ordem exata de passos para rodar e testar o Lumina IDE localmente:

---

### Passo 1 — Instalar Dependências (se necessário)
Sempre rode após clonar ou obter atualizações de dependências:
```bash
npm install
```

### Passo 2 — Iniciar os Watchers do VSCode Base
Pressione **`Ctrl+Shift+B`** (ou `Cmd+Shift+B` no Mac) para abrir o gerenciador de tasks do VSCode/Lumina e iniciar os watchers automáticos:
* `watch-client` (compilação do TypeScript principal)
* `watch-extensions` & `watch-extension-media` (compilação das extensões embutidas)

> [!IMPORTANT]
> **Aguarde** até que ambos os watchers informem `Finished compilation with 0 errors` nos terminais antes de prosseguir.

### Passo 3 — Iniciar o Watcher do React Frontend
Em um novo terminal, inicie o empacotamento da UI do React (responsável pela barra lateral de chat e painel de configurações):
```bash
npm run watchreact
```

### Passo 4 — Abrir o Editor de Desenvolvimento (Lumina)
Após as compilações do VSCode base e do React estarem prontas, abra a janela de desenvolvimento isolada:

* **Windows:**
  ```powershell
  .\scripts\code.bat --user-data-dir .\.tmp\user-data --extensions-dir .\.tmp\extensions
  ```
* **macOS / Linux:**
  ```bash
  ./scripts/code.sh --user-data-dir ./.tmp/user-data --extensions-dir ./.tmp/extensions
  ```

---

*Nota: Para aplicar alterações feitas no código enquanto o editor estiver aberto, basta focar a janela do Lumina e pressionar **`Ctrl+R`** (ou `Cmd+R` no Mac) para recarregar a interface.*
