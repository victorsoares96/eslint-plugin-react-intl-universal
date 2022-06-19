import { Rule } from 'eslint';

const rule: Rule.RuleModule = {
	create: context => {
		return {
			'MemberExpression > Identifier[name=\'intl\']': (node: Rule.Node) => {
				context.report({
					message: 'Don\'t use intl',
					node,
				});
			},
		};
	},
};

export = rule
