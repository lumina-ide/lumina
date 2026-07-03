# Lumina Changelog

All notable changes to Lumina are documented here.

---

## [Unreleased]

### Fixed — Security
- **Approval buttons invisible when agent paused** — Fixed `isCheckpointGhost` logic that was applying `opacity-50 pointer-events-none` to approval buttons when the agent was waiting for user approval (LLM paused streaming). Tool request messages now always remain clickable regardless of checkpoint state. The ghost effect now only affects the tool result display, never the approval controls.

### Added — Visual Branding
- **Lumina Yellow theme (default)** — New default color theme inspired by Mayukai Mirage Gruvbox Darktooth with warm yellow (#fabd2f) and orange (#fe8019) accents. Features a dark background (#282828) with excellent readability for all-day development work.
- **New Lumina icon set** — Completely redesigned application icons and installer graphics with new Lumina branding. Includes:
  - Updated `.ico` files for Windows shortcuts and task bar
  - New `.bmp` graphics for installer wizard
  - Refreshed logo assets throughout the application

### Updated
- **Default color theme** — Lumina Yellow replaces Lumina Dark as the default theme for new installations
- **Windows installer** — Updated with new Lumina branding icons
- **Theme colors** — Default background color changed from `#070f1c` (navy) to `#282828` (warm dark) to match Lumina Yellow theme

---

## [0.1.1] — 2025-05-11

### Fixed
- **Agent mode broken** — Tool calls were never executed. The `onFinalMessage` callback in the OpenAI-compatible provider was incorrectly placed inside an `if (!fullText && !toolName)` block, causing it to never fire when the model returned a tool call. The agent would say "I will use tool X" and hang indefinitely. Fixed by moving `onFinalMessage` outside the empty-response guard.

### Updated — LLM SDKs
- `openai`: `4.96.0` → `5.23.2`
- `@anthropic-ai/sdk`: `0.40.0` → `0.62.0`
- `@google/genai`: `0.13.0` → `1.52.0`
- `groq-sdk`: `0.20.1` → `0.32.0`

### Updated — Models

**OpenAI:** Added `gpt-5`, `gpt-5.5`, `gpt-5-mini`

**Anthropic:** Added `claude-opus-4-7`, `claude-opus-4-6`, `claude-opus-4-5`, `claude-sonnet-4-6`, `claude-sonnet-4-5`, `claude-haiku-4`

**xAI:** Added `grok-4`, `grok-4-fast`

**Gemini:** Updated to stable IDs — `gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-2.5-flash-lite` (removed expired preview IDs)

**DeepSeek:** Added `deepseek-v4-pro`, `deepseek-v4-flash` (legacy aliases `deepseek-chat` and `deepseek-reasoner` kept for compatibility until 2026-07-24)

**Groq:** Added `llama-4-maverick`, `llama-4-scout`, `deepseek-r1-distill-llama-70b`

**Mistral:** Added `devstral-2`, `devstral-small-2507`, `mistral-large-3`, `mistral-medium-3`, `mistral-small-3`

**OpenRouter:** Updated with latest models from all providers

---

## [0.1.0] — 2025-05-05

### Initial Lumina Release (fork of Void 1.4.9)

#### Rebranding
- Renamed from Void to Lumina throughout the codebase
- New `product.json` with Lumina identity, GUIDs, and URLs pointing to `neuronal.ia.br/lumina`
- Installer renamed to `Lumina-win32-x64-user-setup.exe`
- Data folder: `.lumina-editor`
- Application name: `lumina`

#### Theme
- Added **Lumina Dark** theme — deep navy background (`#070f1c`) with cyan (`#00c8f0`) and violet (`#7b4fff`) accents
- Added **Lumina Cyberpunk** theme — near-black with magenta neon (`#ff2d78`), electric yellow (`#ffe600`), and cyan (`#00fff9`)
- Added **Lumina Light** theme — clean white with blue (`#0066ff`), green for numbers, orange for strings

#### Layout
- Activity bar default changed to `top` (horizontal tabs, Fleet-style)
- Default window background color set to `#070f1c` (Lumina Dark) — eliminates green flash on startup

#### Build
- Added `scripts/build-installer-win32-x64.bat` — automates full build + inno-updater + installer in one command
- Added `scripts/bump-version.js` — auto-increments `luminaVersion` and `luminaRelease` before each build
- Added `BUILDING.md` — complete build guide
- Added `LLAMA_LOCAL_INFERENCE.md` — implementation plan for bundled local model inference

#### Fixes
- Fixed `AzureOpenAI` constructor incompatibility with openai v5 (`apiKey` type mismatch)
- Fixed default background color to prevent VSCode green flash on startup
- Removed expired Gemini preview model IDs

#### Extensions
- Remote SSH/WSL extensions updated to point to `lumina-ide/lumina` binaries
- Theme extension renamed from `theme-neuronal` to `theme-lumina`
