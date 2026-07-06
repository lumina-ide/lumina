# Welcome to Lumina.

<div align="center">
	<img
		src="./resources/lumina-ide-logo.png"
		alt="Lumina IDE - AI-Powered Code Editor"
		width="500"
		height="auto"
	/>
</div>

**Lumina** is an open-source, AI-powered code editor by [Neuronal](https://neuronal.ia.br).

Use AI agents on your codebase, checkpoint and visualize changes, and bring any model or host locally. Lumina sends messages directly to providers without retaining your data.

This repo contains the full source code for Lumina. If you're new, welcome!

- 🧭 [Website](https://neuronal.ai)
- 👋 Discord (coming soon)
- 🚙 [Issues](https://github.com/lumina-ide/lumina/issues)


## Local Llama Inference Backend Setup (Windows x64)

To use the 100% local Llama inference features in development or production builds, you must download the `llama.cpp` server binaries and place them in the correct directory structure.

### 1. Download Binaries
Download the official releases matching your hardware version from the [llama.cpp Releases](https://github.com/ggerganov/llama.cpp/releases) page.
*   For **CPU** or **Vulkan** support: Download the standard Windows x64 zip (e.g., `llama-bXXXX-bin-win-x64.zip`).
*   For **CUDA** support (Nvidia GPUs): Download the CUDA-enabled zip (e.g., `llama-bXXXX-bin-win-cuXX.X-x64.zip`).

### 2. File Placement
Extract the contents of the zip files (including `llama-server.exe` and all `.dll` dependency libraries) into the following directories relative to the project root:

*   **CPU Backend:**
    `resources/llama/win32-x64/cpu/`
*   **CUDA Backend (NVIDIA GPUs):**
    `resources/llama/win32-x64/cuda/`
*   **Vulkan Backend (AMD/Intel/Universal GPUs):**
    `resources/llama/win32-x64/vulkan/`

> [!NOTE]
> During startup, Lumina will automatically detect the presence of Nvidia CUDA runtime libraries (such as `cudart64_13.dll` or `cublasLt64_13.dll`) and fallback to Vulkan or CPU if they are not available.

## Reference

Lumina is a fork of [Void](https://github.com/voideditor/void), which is itself a fork of [vscode](https://github.com/microsoft/vscode).

For a guide to the codebase, see [LUMINA_CODEBASE_GUIDE](./LUMINA_CODEBASE_GUIDE.md).

For build instructions, see [BUILDING](./BUILDING.md).

## Support

Contact us via email: contato@neuronal.ia.br
