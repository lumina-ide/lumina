/*--------------------------------------------------------------------------------------
 *  Copyright 2026 Lumina IDE. All rights reserved.
 *--------------------------------------------------------------------------------------*/

import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';
import * as net from 'net';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { Emitter, Event } from '../../../../base/common/event.js';
import { IEnvironmentMainService } from '../../../../platform/environment/electron-main/environmentMainService.js';
import { ILogService } from '../../../../platform/log/common/log.js';
import { LlamaServerOptions, LlamaServerStatus } from '../common/llamaServerService.js';

import { setActiveLlamaServerPort } from './llamaServerState.js';

export class LlamaServerService extends Disposable {
	readonly _serviceBrand: undefined;

	private _status: LlamaServerStatus = 'stopped';
	private readonly _onDidChangeStatus = this._register(new Emitter<LlamaServerStatus>());
	readonly onDidChangeStatus: Event<LlamaServerStatus> = this._onDidChangeStatus.event;

	private _process: cp.ChildProcess | null = null;
	private _healthCheckTimer: NodeJS.Timeout | null = null;
	private _healthCheckTimeoutTimer: NodeJS.Timeout | null = null;

	constructor(
		@IEnvironmentMainService private readonly environmentMainService: IEnvironmentMainService,
		@ILogService private readonly logService: ILogService,
	) {
		super();
		this.logService.info('[LlamaServerService] Initialized');
	}

	async getStatus(): Promise<LlamaServerStatus> {
		return this._status;
	}

	async isRunning(): Promise<boolean> {
		return this._status === 'running';
	}

	private _setStatus(status: LlamaServerStatus) {
		if (this._status !== status) {
			this.logService.info(`[LlamaServerService] Status changed: ${this._status} -> ${status}`);
			this._status = status;
			this._onDidChangeStatus.fire(status);
		}
	}

	private _detectBackend(llamaResourcesPath: string): 'cuda' | 'vulkan' | 'cpu' {
		if (process.platform !== 'win32') {
			// fallback on other platforms (e.g. mac/linux - currently win32 binaries are supplied)
			return 'cpu';
		}

		try {
			// 1. Check CUDA: nvcuda.dll is present if NVIDIA driver is installed
			const cudaDriverPath = path.join(process.env['SystemRoot'] || 'C:\\Windows', 'System32', 'nvcuda.dll');
			if (fs.existsSync(cudaDriverPath)) {
				// Also check if we have CUDA runtime DLLs in the cuda resource folder or System32
				const cudaWorkingDir = path.join(llamaResourcesPath, 'win32-x64', 'cuda');
				const cudartPath = path.join(cudaWorkingDir, 'cudart64_13.dll');
				if (fs.existsSync(cudartPath) || fs.existsSync(path.join(process.env['SystemRoot'] || 'C:\\Windows', 'System32', 'cudart64_13.dll'))) {
					this.logService.info('[LlamaServerService] NVIDIA GPU detected (CUDA) and runtime DLLs found');
					return 'cuda';
				} else {
					this.logService.warn('[LlamaServerService] NVIDIA GPU detected but CUDA runtime DLLs (cudart64_13.dll) are missing. Falling back to Vulkan/CPU');
				}
			}

			// 2. Check Vulkan: vulkan-1.dll is present if Vulkan loader is installed
			const vulkanPath = path.join(process.env['SystemRoot'] || 'C:\\Windows', 'System32', 'vulkan-1.dll');
			if (fs.existsSync(vulkanPath)) {
				this.logService.info('[LlamaServerService] Vulkan capability detected');
				return 'vulkan';
			}
		} catch (err) {
			this.logService.error('[LlamaServerService] Error detecting GPU/Vulkan:', err);
		}

		this.logService.info('[LlamaServerService] No GPU acceleration found, falling back to CPU');
		return 'cpu';
	}

	private _getLlamaResourcesPath(): string {
		if (!this.environmentMainService.isBuilt) {
			return path.join(this.environmentMainService.appRoot, 'resources', 'llama');
		} else {
			//Packaged paths: try process.resourcesPath first, then appRoot/resources
			const path1 = path.join(process.resourcesPath, 'llama');
			const path2 = path.join(this.environmentMainService.appRoot, 'resources', 'llama');
			if (fs.existsSync(path1)) {
				return path1;
			}
			return path2;
		}
	}

	private async _findFreePort(startPort: number): Promise<number> {
		return new Promise((resolve) => {
			const checkPort = (port: number) => {
				const server = net.createServer();
				server.once('error', (err: any) => {
					if (err.code === 'EADDRINUSE') {
						checkPort(port + 1);
					} else {
						resolve(port);
					}
				});
				server.once('listening', () => {
					server.close(() => {
						resolve(port);
					});
				});
				server.listen(port, '127.0.0.1');
			};
			checkPort(startPort);
		});
	}

	async start(modelPath: string, options: LlamaServerOptions): Promise<void> {
		if (this._status === 'running' || this._status === 'starting') {
			this.logService.info('[LlamaServerService] Server is already running or starting.');
			return;
		}

		this._setStatus('starting');

		try {
			if (!modelPath || !fs.existsSync(modelPath)) {
				throw new Error(`Model file not found at path: "${modelPath}"`);
			}

			const llamaResourcesPath = this._getLlamaResourcesPath();
			const backend = this._detectBackend(llamaResourcesPath);
			const workingDir = path.join(llamaResourcesPath, 'win32-x64', backend);
			const binaryPath = path.join(workingDir, 'llama-server.exe');

			if (!fs.existsSync(binaryPath)) {
				throw new Error(`Llama binary not found at: "${binaryPath}"`);
			}

			const basePort = options.port;
			const actualPort = await this._findFreePort(basePort);
			setActiveLlamaServerPort(actualPort);

			const args: string[] = [
				'--model', modelPath,
				'--port', actualPort.toString(),
				'--ctx-size', options.contextSize.toString(),
				'--threads', options.threads.toString(),
				'--n-gpu-layers', options.gpuLayers.toString(),
				'--host', '127.0.0.1'
			];

			this.logService.info(`[LlamaServerService] Spawning server on port ${actualPort}: "${binaryPath}" in cwd: "${workingDir}" with args:`, args);

			this._process = cp.spawn(binaryPath, args, {
				cwd: workingDir,
				detached: false
			});

			this._process.stdout?.on('data', (data) => {
				this.logService.info(`[LlamaServer:stdout] ${data.toString().trim()}`);
			});

			this._process.stderr?.on('data', (data) => {
				this.logService.warn(`[LlamaServer:stderr] ${data.toString().trim()}`);
			});

			this._process.on('close', (code) => {
				this.logService.info(`[LlamaServerService] Process exited with code ${code}`);
				this._process = null;
				this._cleanupTimers();
				this._setStatus('stopped');
			});

			this._process.on('error', (err) => {
				this.logService.error('[LlamaServerService] Process error:', err);
				this._cleanupTimers();
				this._setStatus('error');
			});

			// Start polling health endpoint
			this._startHealthCheck(actualPort);

		} catch (error: any) {
			this.logService.error('[LlamaServerService] Failed to start server:', error);
			this._setStatus('error');
			throw error;
		}
	}

	async stop(): Promise<void> {
		this.logService.info('[LlamaServerService] Stopping server...');
		this._cleanupTimers();

		if (this._process) {
			// On Windows, sometimes SIGTERM is not enough, so we can try basic kill
			this._process.kill('SIGTERM');
			// Wait a bit, if still alive, force kill
			const proc = this._process;
			setTimeout(() => {
				try {
					proc.kill('SIGKILL');
				} catch (e) {
					// already dead
				}
			}, 2000);
			this._process = null;
		}

		this._setStatus('stopped');
	}

	private _startHealthCheck(port: number) {
		this._cleanupTimers();

		const checkHealth = () => {
			const req = http.get(`http://127.0.0.1:${port}/health`, (res) => {
				let body = '';
				res.on('data', chunk => body += chunk);
				res.on('end', () => {
					try {
						const json = JSON.parse(body);
						if (res.statusCode === 200 && (json.status === 'ok' || json.status === 'success' || json.status === 'loading')) {
							// Server is up (loading means it is loading the model, which is fine, it will accept connections soon)
							this._setStatus('running');
							if (this._healthCheckTimeoutTimer) {
								clearTimeout(this._healthCheckTimeoutTimer);
								this._healthCheckTimeoutTimer = null;
							}
						}
					} catch (e) {
						// parse error, try again
					}
				});
			});

			req.on('error', () => {
				// failed to connect, try again
			});

			req.end();
		};

		// Check every 1.5 seconds
		this._healthCheckTimer = setInterval(checkHealth, 1500);

		// Timeout after 3 minutes if never succeeded (large models can take time to load in RAM/VRAM)
		this._healthCheckTimeoutTimer = setTimeout(() => {
			this.logService.error('[LlamaServerService] Health check timed out after 3 minutes');
			this.stop();
			this._setStatus('error');
		}, 180000);
	}

	private _cleanupTimers() {
		if (this._healthCheckTimer) {
			clearInterval(this._healthCheckTimer);
			this._healthCheckTimer = null;
		}
		if (this._healthCheckTimeoutTimer) {
			clearTimeout(this._healthCheckTimeoutTimer);
			this._healthCheckTimeoutTimer = null;
		}
	}

	override dispose() {
		this.logService.info('[LlamaServerService] Disposing, cleaning up processes...');
		this.stop();
		super.dispose();
	}
}
