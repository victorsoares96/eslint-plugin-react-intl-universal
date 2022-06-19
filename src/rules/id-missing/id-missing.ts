import { Rule } from 'eslint';
import { BigIntLiteral, RegExpLiteral, SimpleLiteral } from 'estree';
import { findGetOrGetHTMLAttrNode } from './helpers/findNodes';
import { getIntlIds } from './helpers/translations';
import schema from './schema.json';

const rule: Rule.RuleModule = {
	meta: {
		docs: {
			description: 'Validates intl message ids are in locale file',
			category: 'Intl',
			recommended: true,
		},
		fixable: undefined,
		schema: [schema],
	},
	create: context => {
		const translatedIds = getIntlIds(context);
		const translatedIdSet = new Set(translatedIds);

		function isLiteralTranslated(literal: string) {
			return translatedIdSet.has(literal);
		}

		function processLiteral(node: SimpleLiteral | RegExpLiteral | BigIntLiteral) {
			if (node.value && !isLiteralTranslated(node.value.toString())) {
				context.report({
					node: node,
					message: 'Missing id: ' + node.value,
				});
			}
		}

		return {
			CallExpression: function (node) {
				const attrNode = findGetOrGetHTMLAttrNode(node);
				if (attrNode) return processLiteral(attrNode);
			},
		};
	},
};

export = rule
