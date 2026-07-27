/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export enum SearchEverywhereCategory {
	File = 'file',
	Symbol = 'symbol',
	Class = 'class',
	Command = 'command'
}

export interface ISearchEverywhereItem {
	label: string;
	description?: string;
	detail?: string;
	category: SearchEverywhereCategory;
	resource?: any;
	icon?: string;
	accept?: () => void;
}

export function getCategoryLabel(category: SearchEverywhereCategory): string {
	const labels: Record<SearchEverywhereCategory, string> = {
		[SearchEverywhereCategory.File]: 'File',
		[SearchEverywhereCategory.Symbol]: 'Symbol',
		[SearchEverywhereCategory.Class]: 'Class',
		[SearchEverywhereCategory.Command]: 'Command'
	};
	return labels[category];
}

export function getCategoryIcon(category: SearchEverywhereCategory): string {
	const icons: Record<SearchEverywhereCategory, string> = {
		[SearchEverywhereCategory.File]: 'codicon-file',
		[SearchEverywhereCategory.Symbol]: 'codicon-symbol-method',
		[SearchEverywhereCategory.Class]: 'codicon-symbol-class',
		[SearchEverywhereCategory.Command]: 'codicon-terminal'
	};
	return icons[category];
}
