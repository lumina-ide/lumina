/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import './media/searchEverywhere.css';
import { IQuickPick, IQuickPickSeparator, IQuickInputButton } from '../../../../platform/quickinput/common/quickInput.js';
import { PickerQuickAccessProvider, IPickerQuickAccessItem } from '../../../../platform/quickinput/browser/pickerQuickAccess.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';
import { localize } from '../../../../nls.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { SearchEverywhereCategory, ISearchEverywhereItem, getCategoryLabel } from '../common/searchEverywhereCommon.js';
import { SearchEverywhereProviderAdapter } from './searchEverywhereProviderAdapter.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';

export enum SearchEverywhereTab {
	All = 'all',
	Classes = 'classes',
	Files = 'files',
	Symbols = 'symbols',
	Actions = 'actions'
}

interface ISearchEverywhereQuickPickItem extends IPickerQuickAccessItem {
	category?: SearchEverywhereCategory;
	resource?: any;
}

interface ITabButton extends IQuickInputButton {
	tab?: SearchEverywhereTab;
}

/**
 * Quick Access Provider for Search Everywhere functionality with tabs.
 * Provides unified search across files, symbols, classes, and commands.
 */
export class SearchEverywhereQuickAccessProvider extends PickerQuickAccessProvider<ISearchEverywhereQuickPickItem> {

	static readonly PREFIX = '';
	static readonly TABS = [
		SearchEverywhereTab.All,
		SearchEverywhereTab.Classes,
		SearchEverywhereTab.Files,
		SearchEverywhereTab.Symbols,
		SearchEverywhereTab.Actions
	];

	private currentTab: SearchEverywhereTab = SearchEverywhereTab.All;
	private includeNonProjectItems: boolean = false;
	private providerAdapter: SearchEverywhereProviderAdapter;

	constructor(
		@IInstantiationService private readonly instantiationService: IInstantiationService,
		@IConfigurationService private readonly configurationService: IConfigurationService
	) {
		super(SearchEverywhereQuickAccessProvider.PREFIX, {
			canAcceptInBackground: true,
			noResultsPick: {
				label: localize('noSearchEverywhereResults', "No matching results")
			}
		});

		this.providerAdapter = this.instantiationService.createInstance(SearchEverywhereProviderAdapter);
		this.loadConfiguration();
	}

	private loadConfiguration(): void {
		this.includeNonProjectItems = this.configurationService.getValue<boolean>('searchEverywhere.includeNonProjectItems') ?? false;
	}

	override provide(picker: IQuickPick<ISearchEverywhereQuickPickItem, { useSeparators: true }>, token: CancellationToken): any {
		const disposables = new DisposableStore();

		// Configure quick pick title and buttons
		this.updatePickerHeader(picker, disposables);

		// Handle tab switching on value change
		disposables.add(picker.onDidChangeValue(() => {
			this.handleTabSwitching(picker);
		}));

		// Call parent provide
		disposables.add(super.provide(picker, token));

		return disposables;
	}

	private updatePickerHeader(picker: IQuickPick<ISearchEverywhereQuickPickItem, { useSeparators: true }>, disposables: DisposableStore): void {
		const tabConfigs: { tab: SearchEverywhereTab; icon: string; label: string }[] = [
			{ tab: SearchEverywhereTab.All, icon: 'codicon-search', label: 'All' },
			{ tab: SearchEverywhereTab.Classes, icon: 'codicon-symbol-class', label: 'Classes (#)' },
			{ tab: SearchEverywhereTab.Files, icon: 'codicon-file', label: 'Files' },
			{ tab: SearchEverywhereTab.Symbols, icon: 'codicon-symbol-method', label: 'Symbols (@)' },
			{ tab: SearchEverywhereTab.Actions, icon: 'codicon-terminal', label: 'Actions (>)' }
		];

		const buttons: ITabButton[] = tabConfigs.map(t => ({
			iconClass: `codicon ${t.icon}`,
			tooltip: `${t.tab === this.currentTab ? '● ' : ''}${t.label}`,
			alwaysVisible: true,
			tab: t.tab
		}));

		const checkboxButton: IQuickInputButton = {
			iconClass: this.includeNonProjectItems ? 'codicon codicon-check-all' : 'codicon codicon-exclude',
			tooltip: localize('searchEverywhereIncludeNonProject',
				'Include non-project items ({0})', this.includeNonProjectItems ? 'ON' : 'OFF'),
			alwaysVisible: true
		};

		picker.buttons = [...buttons, checkboxButton];
		picker.title = `Search Everywhere [${this.currentTab.toUpperCase()}]`;

		disposables.add(picker.onDidTriggerButton((btn: ITabButton) => {
			if (btn.tab) {
				this.currentTab = btn.tab;
				this.updatePickerHeader(picker, disposables);
				picker.placeholder = this.getPlaceholder();
				// Trigger quick access refresh
				picker.value = picker.value;
			} else {
				this.includeNonProjectItems = !this.includeNonProjectItems;
				this.updatePickerHeader(picker, disposables);
				picker.value = picker.value;
			}
		}));

		picker.placeholder = this.getPlaceholder();
	}

	private handleTabSwitching(picker: IQuickPick<ISearchEverywhereQuickPickItem, { useSeparators: true }>): void {
		const value = picker.value.trim();

		// Auto-detect tab based on input prefix
		if (value.startsWith('@')) {
			this.currentTab = SearchEverywhereTab.Symbols;
		} else if (value.startsWith('#')) {
			this.currentTab = SearchEverywhereTab.Classes;
		} else if (value.startsWith('>')) {
			this.currentTab = SearchEverywhereTab.Actions;
		}

		picker.title = `Search Everywhere [${this.currentTab.toUpperCase()}]`;
		picker.placeholder = this.getPlaceholder();
	}

	private getPlaceholder(): string {
		const placeholders: Record<SearchEverywhereTab, string> = {
			[SearchEverywhereTab.All]: localize('searchEverywhereAll', "Search everything... (@ for symbols, # for classes, > for commands)"),
			[SearchEverywhereTab.Classes]: localize('searchEverywhereClasses', "Search classes..."),
			[SearchEverywhereTab.Files]: localize('searchEverywhereFiles', "Search files..."),
			[SearchEverywhereTab.Symbols]: localize('searchEverywhereSymbols', "Search symbols..."),
			[SearchEverywhereTab.Actions]: localize('searchEverywhereActions', "Search commands...")
		};

		return placeholders[this.currentTab];
	}

	protected async _getPicks(filter: string, disposables: DisposableStore, token: CancellationToken): Promise<any> {
		const allPicks: (ISearchEverywhereQuickPickItem | IQuickPickSeparator)[] = [];

		try {
			this.providerAdapter.setIncludeNonProjectItems(this.includeNonProjectItems);

			const [files, symbols, classes, actions] = await Promise.all([
				(this.currentTab === SearchEverywhereTab.All || this.currentTab === SearchEverywhereTab.Files)
					? this.providerAdapter.getFileResults(filter, token) : Promise.resolve([]),
				(this.currentTab === SearchEverywhereTab.All || this.currentTab === SearchEverywhereTab.Symbols)
					? this.providerAdapter.getSymbolResults(filter, token) : Promise.resolve([]),
				(this.currentTab === SearchEverywhereTab.All || this.currentTab === SearchEverywhereTab.Classes)
					? this.providerAdapter.getClassResults(filter, token) : Promise.resolve([]),
				(this.currentTab === SearchEverywhereTab.All || this.currentTab === SearchEverywhereTab.Actions)
					? this.providerAdapter.getActionResults(filter, token) : Promise.resolve([])
			]);

			const categoryMap: Map<SearchEverywhereCategory, ISearchEverywhereItem[]> = new Map([
				[SearchEverywhereCategory.File, files],
				[SearchEverywhereCategory.Class, classes],
				[SearchEverywhereCategory.Symbol, symbols],
				[SearchEverywhereCategory.Command, actions]
			]);

			if (this.currentTab === SearchEverywhereTab.All) {
				for (const [category, items] of categoryMap.entries()) {
					if (items.length > 0) {
						allPicks.push({
							type: 'separator',
							label: `${getCategoryLabel(category).toUpperCase()} (${items.length})`
						});
						for (const item of items) {
							allPicks.push({
								...item,
								iconClass: this.getIconClassForCategory(category)
							} as ISearchEverywhereQuickPickItem);
						}
					}
				}
			} else {
				const activeCategory = this.getCategoryForTab(this.currentTab);
				const items = activeCategory ? (categoryMap.get(activeCategory) || []) : [];
				for (const item of items) {
					allPicks.push({
						...item,
						iconClass: this.getIconClassForCategory(item.category)
					} as ISearchEverywhereQuickPickItem);
				}
			}
		} catch (e) {
			console.error('Error in SearchEverywhere _getPicks:', e);
		}

		return allPicks.length > 0 ? allPicks : [];
	}

	private getCategoryForTab(tab: SearchEverywhereTab): SearchEverywhereCategory | undefined {
		switch (tab) {
			case SearchEverywhereTab.Classes:
				return SearchEverywhereCategory.Class;
			case SearchEverywhereTab.Files:
				return SearchEverywhereCategory.File;
			case SearchEverywhereTab.Symbols:
				return SearchEverywhereCategory.Symbol;
			case SearchEverywhereTab.Actions:
				return SearchEverywhereCategory.Command;
			default:
				return undefined;
		}
	}

	private getIconClassForCategory(category: SearchEverywhereCategory): string {
		const iconMap: Record<SearchEverywhereCategory, string> = {
			[SearchEverywhereCategory.File]: 'codicon codicon-file',
			[SearchEverywhereCategory.Class]: 'codicon codicon-symbol-class',
			[SearchEverywhereCategory.Symbol]: 'codicon codicon-symbol-method',
			[SearchEverywhereCategory.Command]: 'codicon codicon-terminal'
		};
		return iconMap[category];
	}
}
