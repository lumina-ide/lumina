# Welcome to Lumina / Bem-vindo ao Lumina

<div align="center">
	<img
		src="./resources/lumina-ide-logo.png"
		alt="Lumina IDE - AI-Powered Code Editor"
		width="450"
		height="auto"
	/>
	<p><strong>The Open-Source, 100% Local AI-Powered Code Editor</strong></p>
	<p><em>O Editor de Código de Código Aberto com Inteligência Artificial 100% Local</em></p>
</div>

<hr />

## 🚀 Downloads / Baixar

Get the latest stable release for Windows. Linux and macOS builds coming soon!
*Obtenha a versão estável mais recente para Windows. Builds de Linux e macOS em breve!*

<div align="center">
	<a href="https://www.neuronal.ia.br/downloads/Lumina-win32-x64-user-setup.exe">
		<img src="https://img.shields.io/badge/Download-Lumina%20for%20Windows%20(x64)-007acc?style=for-the-badge&logo=windows&logoColor=white" alt="Download Lumina for Windows" />
	</a>
	<br />
	<small>Direct Link: <a href="https://www.neuronal.ia.br/downloads/Lumina-win32-x64-user-setup.exe">Lumina Windows x64 Installer (.exe)</a></small>
</div>

<hr />

## 🇬🇧 English

**Lumina** is a modern, open-source, AI-powered code editor built on top of VS Code, designed and maintained by [Neuronal](https://neuronal.ia.br). 

Unlike other AI editors, Lumina focuses on privacy, developer autonomy, and offline capability. It allows you to run AI agents and autocomplete directly on your local hardware without sending your code to third-party servers.

### Key Features
*   **100% Local Inference:** Built-in integration with `llama.cpp` to run model inference locally on your own machine.
*   **Privacy First:** Directly communicates with your local services (or remote APIs) with zero data retention or telemetry from our side.
*   **Advanced AI Agent:** Run agents that can read, write, and execute files within your workspace to solve complex tasks.
*   **Visual Customizations:** Upgraded settings panel with manual parameters control (GPU layers, threads, temperature, custom system prompts).
*   **VS Code Ecosystem:** Full compatibility with VS Code themes, extensions, and keyboard shortcuts.

### Local Llama Backend Setup (Windows x64)
To use local Llama models, you must download the server binaries and place them in the folder structure:

1.  **Download:** Go to [llama.cpp Releases](https://github.com/ggerganov/llama.cpp/releases).
    *   For **CPU/Vulkan**: Download `llama-bXXXX-bin-win-x64.zip`.
    *   For **CUDA (NVIDIA)**: Download `llama-bXXXX-bin-win-cuXX.X-x64.zip`.
2.  **Placement:** Extract the files (including `llama-server.exe` and `.dll` dependencies) into:
    *   *CPU:* `resources/llama/win32-x64/cpu/`
    *   *CUDA:* `resources/llama/win32-x64/cuda/`
    *   *Vulkan:* `resources/llama/win32-x64/vulkan/`

*Note: Lumina dynamically detects your GPU and falls back to Vulkan/CPU if CUDA is not available.*

---

## 🇧🇷 Português

O **Lumina** é um editor de código moderno, de código aberto e alimentado por inteligência artificial, construído sobre a base do VS Code e mantido pela [Neuronal](https://neuronal.ia.br).

Ao contrário de outros editores de IA, o Lumina é focado em privacidade, autonomia do desenvolvedor e capacidade offline. Ele permite que você execute agentes de IA e autocompletar diretamente no seu hardware local, sem enviar seu código para servidores de terceiros.

### Principais Funcionalidades
*   **Inferência 100% Local:** Integração nativa com `llama.cpp` para rodar modelos localmente na sua própria máquina.
*   **Privacidade em Primeiro Lugar:** Comunicação direta com seus serviços locais (ou APIs remotas) com zero retenção de dados ou telemetria de nossa parte.
*   **Agente de IA Avançado:** Execute agentes capazes de ler, escrever e modificar arquivos no seu espaço de trabalho para resolver tarefas complexas.
*   **Parâmetros de Modelos Customizáveis:** Painel de configurações aprimorado com controle manual de parâmetros (GPU layers, threads, temperatura, stop tokens, prompts de sistema).
*   **Ecossistema VS Code:** Compatibilidade total com temas, extensões e atalhos do VS Code.

### Configuração do Servidor Llama Local (Windows x64)
Para utilizar modelos locais Llama, você precisa baixar as binárias do servidor e organizá-las nas pastas corretas:

1.  **Download:** Acesse as [Releases do llama.cpp](https://github.com/ggerganov/llama.cpp/releases).
    *   Para **CPU/Vulkan**: Baixe `llama-bXXXX-bin-win-x64.zip`.
    *   Para **CUDA (NVIDIA)**: Baixe `llama-bXXXX-bin-win-cuXX.X-x64.zip`.
2.  **Onde colocar:** Extraia os arquivos (incluindo `llama-server.exe` e as dependências `.dll`) nas pastas:
    *   *CPU:* `resources/llama/win32-x64/cpu/`
    *   *CUDA:* `resources/llama/win32-x64/cuda/`
    *   *Vulkan:* `resources/llama/win32-x64/vulkan/`

*Nota: O Lumina detectará automaticamente a presença de suporte CUDA e reverterá de forma transparente para Vulkan ou CPU caso necessário.*

<hr />

## 📖 Reference & Development / Referência e Desenvolvimento

Lumina is a fork of [Void](https://github.com/voideditor/void), which is itself a fork of [VS Code](https://github.com/microsoft/vscode).

*   For codebase overview / *Visão geral da estrutura:* [LUMINA_CODEBASE_GUIDE](./LUMINA_CODEBASE_GUIDE.md)
*   For compilation and build guides / *Instruções de compilação e build:* [BUILDING](./BUILDING.md)

## 📞 Support & Community / Suporte e Contato

*   **Website:** [neuronal.ia.br](https://neuronal.ia.br)
*   **Email:** contato@neuronal.ia.br
