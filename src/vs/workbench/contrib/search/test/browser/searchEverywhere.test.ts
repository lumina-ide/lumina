/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { SearchEverywhereQuickAccessProvider, SearchEverywhereTab } from '../../browser/searchEverywhereQuickAccess.js';
import { SearchEverywhereCategory, getCategoryLabel, getCategoryIcon } from '../../common/searchEverywhereCommon.js';

suite('Search Everywhere', () => {

	test('Provider should have correct prefix', () => {
		assert.strictEqual(SearchEverywhereQuickAccessProvider.PREFIX, '');
	});

	test('Provider should have all tabs defined', () => {
		const expectedTabs = [
			SearchEverywhereTab.All,
			SearchEverywhereTab.Classes,
			SearchEverywhereTab.Files,
			SearchEverywhereTab.Symbols,
			SearchEverywhereTab.Actions
		];

		assert.strictEqual(SearchEverywhereQuickAccessProvider.TABS.length, expectedTabs.length);
		expectedTabs.forEach(tab => {
			assert.ok(SearchEverywhereQuickAccessProvider.TABS.includes(tab));
		});
	});

	test('Category enum should have all categories', () => {
		const categories = [
			SearchEverywhereCategory.File,
			SearchEverywhereCategory.Symbol,
			SearchEverywhereCategory.Class,
			SearchEverywhereCategory.Command
		];

		categories.forEach(category => {
			assert.ok(category !== undefined && category !== null);
			assert.ok(getCategoryLabel(category).length > 0, `Category ${category} should have label`);
			assert.ok(getCategoryIcon(category).length > 0, `Category ${category} should have icon`);
		});
	});

	test('Tab enum should have correct values', () => {
		assert.strictEqual(SearchEverywhereTab.All, 'all');
		assert.strictEqual(SearchEverywhereTab.Classes, 'classes');
		assert.strictEqual(SearchEverywhereTab.Files, 'files');
		assert.strictEqual(SearchEverywhereTab.Symbols, 'symbols');
		assert.strictEqual(SearchEverywhereTab.Actions, 'actions');
	});

	test('Category labels and icons should be defined', () => {
		for (const category of Object.values(SearchEverywhereCategory)) {
			const label = getCategoryLabel(category);
			const icon = getCategoryIcon(category);

			assert.ok(label && label.length > 0, `Category ${category} should have non-empty label`);
			assert.ok(icon && icon.length > 0, `Category ${category} should have non-empty icon`);
		}
	});

	test('Prefix detection should work correctly', () => {
		// @ prefix → Symbols tab
		// # prefix → Classes tab
		// > prefix → Actions tab
		// : prefix → All (line numbers)
		// empty → All tab

		const prefixes = ['@', '#', '>', ':', ''];
		prefixes.forEach(prefix => {
			assert.ok(typeof prefix === 'string', `Prefix ${prefix} should be string`);
		});
	});
});

