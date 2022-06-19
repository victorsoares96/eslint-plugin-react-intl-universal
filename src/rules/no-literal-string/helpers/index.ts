import { DOM_TAGS, SVG_TAGS } from '../constants';

const cache = new WeakMap();

export function isUpperCase(str: string) {
	return /^[A-Z_-]+$/.test(str);
}

function isNativeDOMTag(str: string) {
	return DOM_TAGS.includes(str);
}

function isSvgTag(str: string) {
	return SVG_TAGS.includes(str);
}

const blacklistAttrs = ['placeholder', 'alt', 'aria-label', 'value'];
export function isAllowedDOMAttr(tag: string, attr: string) {
	if (isSvgTag(tag)) return true;
	if (isNativeDOMTag(tag)) {
		return !blacklistAttrs.includes(attr);
	}
	return false;
}

function generateFullMatchRegExp(source: any) {
	if (source instanceof RegExp) {
		return source;
	}

	if (typeof source !== 'string') {
		console.error('generateFullMatchRegExp: expect string but get', source);
		return new RegExp('');
	}

	// allow dot ahead
	return new RegExp(`(^|\\.)${source}${source.endsWith('$') ? '' : '$'}`);
}

export function getNearestAncestor(node: { name?: { name: any }; parent?: any }, type: string) {
	let temp = node.parent;

	while (temp) {
		if (temp.type === type) {
			return temp;
		}
		temp = temp.parent;
	}

	return temp;
}

function matchPatterns(patterns: any[], text: string) {
	let handler = cache.get(patterns);

	if (handler) {
		return handler(text);
	}

	handler = (str: string) => {
		return patterns.map(generateFullMatchRegExp).some(item => item.test(str));
	};

	cache.set(patterns, handler);

	return handler(text);
}

export function shouldSkip({ exclude = [], include = [] }, text: string) {
	if (include.length || exclude.length) {
		if ((!exclude.length || matchPatterns(exclude, text)) && !matchPatterns(include, text)) {
			return true;
		}
	}
	return false;
}
