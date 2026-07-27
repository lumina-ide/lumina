/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SymbolsQuickAccessProvider } from './symbolsQuickAccess.js';
import { SearchEverywhereCategory, ISearchEverywhereItem } from '../common/searchEverywhereCommon.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { CancellationToken } from '../../../../base/common/cancellation.js';
import { ICommandService } from '../../../../platform/commands/common/commands.js';
import { SymbolKind } from '../../../../editor/common/languages.js';
import { ISearchService, ITextQuery } from '../../../services/search/common/search.js';
import { IWorkspaceContextService } from '../../../../platform/workspace/common/workspace.js';
import { ILabelService } from '../../../../platform/label/common/label.js';
import { IEditorService } from '../../../services/editor/common/editorService.js';
import { QueryBuilder } from '../../../services/search/common/queryBuilder.js';
import { basenameOrAuthority, dirname } from '../../../../base/common/resources.js';

function cleanFilter(filter: string): string {
	return filter.replace(/^[@#>: ]+/, '').trim();
}

/**
 * Adapter that integrates existing Quick Access providers with Search Everywhere
 */
export class SearchEverywhereProviderAdapter {

	private symbolsProvider: SymbolsQuickAccessProvider | undefined;
	private readonly queryBuilder: QueryBuilder;
	private includeNonProjectItems: boolean = false;

	constructor(
		@IInstantiationService private readonly instantiationService: IInstantiationService,
		@ICommandService private readonly commandService: ICommandService,
		@ISearchService private readonly searchService: ISearchService,
		@IWorkspaceContextService private readonly contextService: IWorkspaceContextService,
		@ILabelService private readonly labelService: ILabelService,
		@IEditorService private readonly editorService: IEditorService
	) {
		this.queryBuilder = this.instantiationService.createInstance(QueryBuilder);
	}

	/**
	 * Get text results from workspace files (full text search)
	 */
	async getTextResults(filter: string, token: CancellationToken): Promise<ISearchEverywhereItem[]> {
		const query = cleanFilter(filter);
		if (!query || query.length < 2) {
			return [];
		}

		try {
			const folders = this.contextService.getWorkspace().folders;
			if (!folders.length) {
				return [];
			}

			const textQuery: ITextQuery = this.queryBuilder.text(
				{ pattern: query },
				folders.map(f => f.uri),
				{ maxResults: 30 }
			);

			const results: ISearchEverywhereItem[] = [];
			await this.searchService.textSearch(textQuery, token, (match: any) => {
				if (results.length >= 30) {
					return;
				}
				if (match && 'lineNumber' in match) {
					const lineText = match.preview?.text?.trim() || '';
					results.push({
						label: lineText || basenameOrAuthority(match.resource),
						description: `${this.labelService.getUriLabel(match.resource, { relative: true })}:${match.lineNumber}`,
						category: SearchEverywhereCategory.File,
						accept: () => {
							this.editorService.openEditor({
								resource: match.resource,
								options: {
									selection: {
										startLineNumber: match.lineNumber,
										startColumn: match.offset,
										endLineNumber: match.lineNumber,
										endColumn: match.offset + match.length
									}
								}
							});
						}
					});
				}
			});

			return results;
		} catch (e) {
			return [];
		}
	}

	/**
	 * Get file results matching the query (file names + full text content)
	 */
	async getFileResults(filter: string, token: CancellationToken): Promise<ISearchEverywhereItem[]> {
		const query = cleanFilter(filter);
		if (!query) {
			return [];
		}

		try {
			const folders = this.contextService.getWorkspace().folders;
			if (!folders.length) {
				return [];
			}

			const fileQueryOptions: any = {
				filePattern: query,
				maxResults: 50
			};

			if (!this.includeNonProjectItems) {
				fileQueryOptions.excludePattern = { '**/node_modules/**': true, '**/out/**': true, '**/.git/**': true };
			}

			const [fileSearchComplete, textResults] = await Promise.all([
				this.searchService.fileSearch(
					this.queryBuilder.file(folders.map(f => f.uri), fileQueryOptions),
					token
				),
				this.getTextResults(filter, token)
			]);

			const fileResults: ISearchEverywhereItem[] = fileSearchComplete.results.map(res => ({
				label: basenameOrAuthority(res.resource),
				description: this.labelService.getUriLabel(dirname(res.resource), { relative: true }),
				category: SearchEverywhereCategory.File,
				accept: () => {
					this.editorService.openEditor({ resource: res.resource });
				}
			}));

			return [...fileResults, ...textResults];
		} catch (e) {
			return [];
		}
	}

	/**
	 * Get symbol results from SymbolsQuickAccessProvider - includes all symbols
	 */
	async getSymbolResults(filter: string, token: CancellationToken): Promise<ISearchEverywhereItem[]> {
		if (!this.symbolsProvider) {
			this.symbolsProvider = this.instantiationService.createInstance(SymbolsQuickAccessProvider);
		}

		const query = cleanFilter(filter);
		try {
			const symbolPicks = await this.symbolsProvider.getSymbolPicks(query, undefined, token);
			return symbolPicks.map(pick => ({
				label: pick.label,
				description: pick.description,
				detail: pick.detail,
				category: SearchEverywhereCategory.Symbol,
				accept: () => {
					if (pick.symbol?.location) {
						this.editorService.openEditor({
							resource: pick.symbol.location.uri,
							options: { selection: pick.symbol.location.range }
						});
					}
				}
			}));
		} catch (e) {
			return [];
		}
	}

	/**
	 * Get class results (specialized symbol search - filter by kind)
	 */
	async getClassResults(filter: string, token: CancellationToken): Promise<ISearchEverywhereItem[]> {
		if (!this.symbolsProvider) {
			this.symbolsProvider = this.instantiationService.createInstance(SymbolsQuickAccessProvider);
		}

		const query = cleanFilter(filter);
		try {
			const symbolPicks = await this.symbolsProvider.getSymbolPicks(query, undefined, token);
			const classPicks = symbolPicks.filter(pick => {
				const kind = pick.symbol?.kind;
				return kind === SymbolKind.Class ||
					kind === SymbolKind.Interface ||
					kind === SymbolKind.Struct ||
					kind === SymbolKind.Enum;
			});

			return classPicks.map(pick => ({
				label: pick.label,
				description: pick.description,
				detail: pick.detail,
				category: SearchEverywhereCategory.Class,
				accept: () => {
					if (pick.symbol?.location) {
						this.editorService.openEditor({
							resource: pick.symbol.location.uri,
							options: { selection: pick.symbol.location.range }
						});
					}
				}
			}));
		} catch (e) {
			return [];
		}
	}

	/**
	 * Get action/command results
	 */
	async getActionResults(filter: string, token: CancellationToken): Promise<ISearchEverywhereItem[]> {
		const query = cleanFilter(filter);
		try {
			const commands = await this.commandService.executeCommand('_commands') as any;
			if (!Array.isArray(commands)) {
				return [];
			}

			const results = commands
				.filter((cmd: any) => cmd.id &&
					(!query ||
						(cmd.title && cmd.title.toLowerCase().includes(query.toLowerCase())) ||
						cmd.id.toLowerCase().includes(query.toLowerCase())))
				.slice(0, 50)
				.map((cmd: any) => ({
					label: cmd.title || cmd.id,
					description: cmd.id,
					detail: cmd.category,
					category: SearchEverywhereCategory.Command,
					accept: () => {
						this.commandService.executeCommand(cmd.id);
					}
				}));

			return results;
		} catch (e) {
			return [];
		}
	}

	/**
	 * Set whether to include non-project items in search results
	 */
	setIncludeNonProjectItems(include: boolean): void {
		this.includeNonProjectItems = include;
	}

	dispose(): void {
		this.symbolsProvider?.dispose();
	}
}
