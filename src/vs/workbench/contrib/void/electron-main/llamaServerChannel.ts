/*--------------------------------------------------------------------------------------
 *  Copyright 2026 Lumina IDE. All rights reserved.
 *--------------------------------------------------------------------------------------*/

import { IServerChannel } from '../../../../base/parts/ipc/common/ipc.js';
import { Event } from '../../../../base/common/event.js';
import { ILlamaServerService } from '../common/llamaServerService.js';

export class LlamaServerChannel implements IServerChannel {
	constructor(private readonly service: ILlamaServerService) {}

	listen(_: unknown, event: string): Event<any> {
		if (event === 'onDidChangeStatus') {
			return this.service.onDidChangeStatus;
		}
		throw new Error(`Event not found: ${event}`);
	}

	async call(_: unknown, command: string, arg?: any): Promise<any> {
		switch (command) {
			case 'start':
				return this.service.start(arg.modelPath, arg.options);
			case 'stop':
				return this.service.stop();
			case 'isRunning':
				return this.service.isRunning();
			case 'getStatus':
				return this.service.getStatus();
			default:
				throw new Error(`Command not found: ${command}`);
		}
	}
}
