/*--------------------------------------------------------------------------------------
 *  Copyright 2026 Lumina IDE. All rights reserved.
 *--------------------------------------------------------------------------------------*/

import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { Event } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { IChannel } from '../../../../base/parts/ipc/common/ipc.js';
import { IMainProcessService } from '../../../../platform/ipc/common/mainProcessService.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';

export const ILlamaServerService = createDecorator<ILlamaServerService>('llamaServerService');

export type LlamaServerStatus = 'stopped' | 'starting' | 'running' | 'error';

export interface LlamaServerOptions {
	port: number;
	contextSize: number;
	gpuLayers: number;
	threads: number;
}

export interface ILlamaServerService {
	readonly _serviceBrand: undefined;
	start(modelPath: string, options: LlamaServerOptions): Promise<void>;
	stop(): Promise<void>;
	isRunning(): Promise<boolean>;
	getStatus(): Promise<LlamaServerStatus>;
	readonly onDidChangeStatus: Event<LlamaServerStatus>;
}

export class LlamaServerService extends Disposable implements ILlamaServerService {
	readonly _serviceBrand: undefined;
	private readonly channel: IChannel;

	readonly onDidChangeStatus: Event<LlamaServerStatus>;

	constructor(
		@IMainProcessService private readonly mainProcessService: IMainProcessService,
	) {
		super();
		this.channel = this.mainProcessService.getChannel('void-channel-llamaServer');
		this.onDidChangeStatus = this.channel.listen<LlamaServerStatus>('onDidChangeStatus');
	}

	async start(modelPath: string, options: LlamaServerOptions): Promise<void> {
		return this.channel.call('start', { modelPath, options });
	}

	async stop(): Promise<void> {
		return this.channel.call('stop');
	}

	async isRunning(): Promise<boolean> {
		return this.channel.call('isRunning');
	}

	async getStatus(): Promise<LlamaServerStatus> {
		return this.channel.call('getStatus');
	}
}

registerSingleton(ILlamaServerService, LlamaServerService, InstantiationType.Delayed);
