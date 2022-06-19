import { Rule } from 'eslint';
import fs from 'fs';
import defaultOptions from '../defaultOptions.json';

type LocalesFileKeys = { keys: string[]; mtime: number }

type LocalesFilePath = string

/**
 * Map of locale file paths to keys and modified time
 *
 * @type {{string: {keys: Array, mtime: number}}}
 */
const localesFilesKeys: { [key: LocalesFilePath]: LocalesFileKeys } = {};

function listPaths(obj: any) {
	// @ts-ignore
	function rKeys(o: any, path?: string) {
		if (typeof o !== 'object') return path;
		return Object.keys(o).map((key) =>
			rKeys(o[key], path ? [path, key].join('.') : key)
		);
	}

	return rKeys(obj).toString().split(',').filter(Boolean);
}

/**
 * Get a list of ids keys from reading locale files
 * Keeps track of modified times and reloads if changed,; useful for realtime eslint in-editor
 *
 * @param {object} context - Context
 * @returns {string[]} results - Array of ids
 */
export function getIntlIds(context: Rule.RuleContext) {
	let options = defaultOptions;

	if (context.options.length > 0) {
		options = context.options[0];
	}

	const { locales } = options as { locales: string[] };

	if (!locales) {
		throw new Error('locale paths must be provided');
	}

	const results: Array<string> = [];

	locales.forEach((locale: string) => {
		const mtime = fs.lstatSync(locale).mtime.getTime();

		if (!localesFilesKeys[locale] || mtime !== localesFilesKeys[locale].mtime) {
			const json = JSON.parse(fs.readFileSync(locale, 'utf8'));

			localesFilesKeys[locale] = {
				keys: listPaths(json),
				mtime: mtime,
			};
		}

		results.push(...localesFilesKeys[locale].keys);
	});

	return results;
}
