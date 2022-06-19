import { Rule } from 'eslint';

/**
 * Finds an attribute in formatMessage using attribute name.
 *
 * @param {Object} node - parent formatMessage node
 * @param {string} attrName - attribute name.
 * @returns {Object} node - returns node if it finds the attribute.
 */
export function findGetOrGetHTMLAttrNode(node: Rule.Node) {
	// Find intl.get or intl.getHTML usages
	if (
		node.type === 'CallExpression' &&
		node.callee.type === 'MemberExpression' &&
		node.callee.object.type === 'Identifier' &&
		node.callee.object.name === 'intl' &&
		node.callee.property.type === 'Identifier' &&
		(node.callee.property.name === 'get' || node.callee.property.name === 'getHTML')
	) {
		if (node.arguments.length > 0) {
			if (node.arguments[0].type === 'Literal') {
				return node.arguments[0];
			}
		}
		return undefined;
	}
}
