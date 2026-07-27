/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from '../../../../nls.js';
import { ServicesAccessor } from '../../../../platform/instantiation/common/instantiation.js';
import { Action2, registerAction2 } from '../../../../platform/actions/common/actions.js';
import { KeybindingWeight } from '../../../../platform/keybinding/common/keybindingsRegistry.js';
import { KeyCode } from '../../../../base/common/keyCodes.js';
import { IQuickInputService } from '../../../../platform/quickinput/common/quickInput.js';

//#region Search Everywhere Actions

registerAction2(class SearchEverywhereAction extends Action2 {

	static readonly ID = 'workbench.action.searchEverywhere';
	static readonly LABEL = nls.localize('searchEverywhere', "Search Everywhere");

	constructor() {
		super({
			id: SearchEverywhereAction.ID,
			title: {
				...nls.localize2('searchEverywhere', "Search Everywhere"),
				mnemonicTitle: nls.localize({ key: 'miSearchEverywhere', comment: ['&& denotes a mnemonic'] }, "Search Everywhere")
			},
			f1: true,
			keybinding: {
				weight: KeybindingWeight.WorkbenchContrib,
				primary: KeyCode.CapsLock
			}
		});
	}

	override async run(accessor: ServicesAccessor): Promise<void> {
		const quickInputService = accessor.get(IQuickInputService);
		// Show quick access with empty prefix to trigger default/AnythingQuickAccessProvider
		quickInputService.quickAccess.show(undefined, { preserveValue: false });
	}
});

//#endregion
