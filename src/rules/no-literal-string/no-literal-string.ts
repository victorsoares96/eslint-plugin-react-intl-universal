import { Rule } from 'eslint';
import _ from 'lodash';
import { isUpperCase, getNearestAncestor, isAllowedDOMAttr, shouldSkip } from './helpers';
import defaultOptions from './default.json';
import schema from './schema.json';

function isValidFunctionCall(
	context: Rule.RuleContext,
	options: { callees: { exclude?: never[] | undefined; include?: never[] | undefined } },
	{ callee }: any,
) {
	if (callee.type === 'Import') return true;

	const sourceText = context.getSourceCode().getText(callee);

	return shouldSkip(options.callees, sourceText);
}

function isValidLiteral(
	options: { words: { exclude?: never[] | undefined; include?: never[] | undefined } },
	{ value }: { value: any },
) {
	if (typeof value !== 'string') {
		return true;
	}
	const trimed = value.trim();
	if (!trimed) return true;

	if (shouldSkip(options.words, value)) return true;
}

function isValidTypeScriptAnnotation(
	esTreeNodeToTSNodeMap: { get: (arg0: any) => any },
	typeChecker: { getTypeAtLocation: (arg0: any) => any },
	node: { value: any },
) {
	const tsNode = esTreeNodeToTSNodeMap.get(node);
	const typeObj = typeChecker.getTypeAtLocation(tsNode.parent);

	// var a: 'abc' | 'name' = 'abc'
	if (typeObj.isUnion()) {
		const found = typeObj.types.some((item: { isStringLiteral: () => any; value: any }) => {
			if (item.isStringLiteral() && item.value === node.value) {
				return true;
			}
		});
		return found;
	}
}

const rule: Rule.RuleModule = {
	meta: {
		docs: {
			description: 'disallow literal string',
			category: 'Best Practices',
			recommended: true,
		},
		schema: [schema],
	},
	create: context => {
		// variables should be defined here
		const { parserServices } = context;
		const options = _.defaults({}, context.options[0], defaultOptions);

		const { mode, 'should-validate-template': validateTemplate, message } = options;
		const onlyValidateJSX = ['jsx-only', 'jsx-text-only'].includes(mode);

		//----------------------------------------------------------------------
		// Helpers
		//----------------------------------------------------------------------

		const indicatorStack: boolean[] = [];

		function endIndicator() {
			indicatorStack.pop();
		}

		/**
		 * detect if current "scope" is valid
		 */
		function isValidScope() {
			return indicatorStack.some(item => item);
		}

		//----------------------------------------------------------------------
		// Public
		//----------------------------------------------------------------------

		const { esTreeNodeToTSNodeMap, program } = parserServices;
		let typeChecker: any;
		if (program && esTreeNodeToTSNodeMap) typeChecker = program.getTypeChecker();

		function report(node: any) {
			context.report({
				node,
				message: `${message}: ${context.getSourceCode().getText(node.parent)}`,
			});
		}

		function validateBeforeReport(node: { value: any }) {
			if (isValidScope()) return;
			if (isValidLiteral(options, node)) return;

			if (typeChecker && isValidTypeScriptAnnotation(esTreeNodeToTSNodeMap, typeChecker, node)) {
				return;
			}

			report(node);
		}

		const scriptVisitor = {
			//
			// ─── EXPORT AND IMPORT ───────────────────────────────────────────
			//

			ImportExpression(node: any) {
				// allow (import('abc'))
				indicatorStack.push(true);
			},
			'ImportExpression:exit': endIndicator,

			ImportDeclaration(node: any) {
				// allow (import abc form 'abc')
				indicatorStack.push(true);
			},
			'ImportDeclaration:exit': endIndicator,

			ExportAllDeclaration(node: any) {
				// allow export * from 'mod'
				indicatorStack.push(true);
			},
			'ExportAllDeclaration:exit': endIndicator,

			'ExportNamedDeclaration[source]'(node: any) {
				// allow export { named } from 'mod'
				indicatorStack.push(true);
			},
			'ExportNamedDeclaration[source]:exit': endIndicator,
			// ─────────────────────────────────────────────────────────────────

			//
			// ─── JSX ─────────────────────────────────────────────────────────
			//

			JSXElement(node: { openingElement: { name: { name: string } } }) {
				indicatorStack.push(shouldSkip(options['jsx-components'], node.openingElement.name.name));
			},
			'JSXElement:exit': endIndicator,

			'JSXElement Literal'(node: any) {
				if (mode === 'jsx-only') {
					validateBeforeReport(node);
				}
			},

			'JSXElement > Literal'(node: any) {
				if (mode === 'jsx-text-only') {
					validateBeforeReport(node);
				}
			},

			'JSXFragment > Literal'(node: any) {
				if (onlyValidateJSX) {
					validateBeforeReport(node);
				}
			},

			JSXAttribute(node: { name: { name: any } }) {
				const attrName = node.name.name;

				// allow <MyComponent className="active" />
				if (shouldSkip(options['jsx-attributes'], attrName)) {
					indicatorStack.push(true);
					return;
				}

				const jsxElement = getNearestAncestor(node, 'JSXOpeningElement');
				const tagName = jsxElement.name.name;
				if (isAllowedDOMAttr(tagName, attrName)) {
					indicatorStack.push(true);
					return;
				}
				indicatorStack.push(false);
			},
			'JSXAttribute:exit': endIndicator,

			// @typescript-eslint/parser would parse string literal as JSXText node
			JSXText(node: any) {
				validateBeforeReport(node);
			},
			// ─────────────────────────────────────────────────────────────────

			//
			// ─── TYPESCRIPT ──────────────────────────────────────────────────
			//

			TSModuleDeclaration() {
				indicatorStack.push(true);
			},
			'TSModuleDeclaration:exit': endIndicator,

			TSLiteralType(node: any) {
				// allow var a: Type['member'];
				indicatorStack.push(true);
			},
			'TSLiteralType:exit': endIndicator,
			TSEnumMember(node: any) {
				// allow enum E { "a b" = 1 }
				indicatorStack.push(true);
			},
			'TSEnumMember:exit': endIndicator,
			// ─────────────────────────────────────────────────────────────────

			ClassProperty(node: { key: { name: string } }) {
				indicatorStack.push(!!(node.key && shouldSkip(options['class-properties'], node.key.name)));
			},
			'ClassProperty:exit': endIndicator,

			VariableDeclarator(node: { id: { name: string } }) {
				// allow statements like const A_B = "test"
				indicatorStack.push(isUpperCase(node.id.name));
			},
			'VariableDeclarator:exit': endIndicator,

			Property(node: { key: { name: any; value: any } }) {
				// pick up key.name if key is Identifier or key.value if key is Literal
				// dont care whether if this is computed or not
				const result = shouldSkip(options['object-properties'], node.key.name || node.key.value);
				indicatorStack.push(result);
			},
			'Property:exit': endIndicator,

			BinaryExpression(node: { operator: any }) {
				const { operator } = node;
				// allow name === 'Android'
				indicatorStack.push(operator !== '+');
			},
			'BinaryExpression:exit': endIndicator,

			AssignmentPattern(node: any) {
				// allow function bar(input = 'foo') {}
				indicatorStack.push(true);
			},
			'AssignmentPattern:exit': endIndicator,

			NewExpression(node: { callee: any }) {
				indicatorStack.push(isValidFunctionCall(context, options, node));
			},
			'NewExpression:exit': endIndicator,

			CallExpression(node: { callee: any }) {
				indicatorStack.push(isValidFunctionCall(context, options, node));
			},
			'CallExpression:exit': endIndicator,

			'SwitchCase > Literal'(node: any) {
				indicatorStack.push(true);
			},
			'SwitchCase > Literal:exit': endIndicator,

			'AssignmentExpression[left.type="MemberExpression"]'(node: { left: { property: { name: string } } }) {
				// allow Enum['value']
				indicatorStack.push(shouldSkip(options['object-properties'], node.left.property.name));
			},
			'AssignmentExpression[left.type="MemberExpression"]:exit'(node: any) {
				endIndicator();
			},
			'MemberExpression > Literal'(node: any) {
				// allow Enum['value']
				indicatorStack.push(true);
			},
			'MemberExpression > Literal:exit'(node: any) {
				endIndicator();
			},

			TemplateLiteral(node: { quasis?: never[] | undefined }) {
				if (!validateTemplate) {
					return;
				}
				if (isValidScope()) return;
				const { quasis = [] } = node;
				quasis.some(({ value: { raw } }) => {
					if (isValidLiteral(options, { value: raw })) return;
					report(node);
					return true; // break
				});
			},

			'Literal:exit'(node: { parent: { key: any } }) {
				// skip if it only validates jsx
				// checking if a literal is contained in a JSX element is hard to be performant
				// instead, we validate in jsx-related visitors
				if (onlyValidateJSX) return;

				// ignore `var a = { "foo": 123 }`
				if (node.parent.key === node) {
					return;
				}
				// @ts-ignore
				validateBeforeReport(node);
			},
		};

		return (
			(parserServices.defineTemplateBodyVisitor &&
				parserServices.defineTemplateBodyVisitor(
					{
						VText(node: any) {
							scriptVisitor['JSXText'](node);
						},
						'VExpressionContainer CallExpression'(node: any) {
							scriptVisitor['CallExpression'](node);
						},
						'VExpressionContainer CallExpression:exit'(node: any) {
							// @ts-ignore
							scriptVisitor['CallExpression:exit'](node);
						},
						'VExpressionContainer Literal:exit'(node: any) {
							scriptVisitor['Literal:exit'](node);
						},
					},
					scriptVisitor,
				)) ||
			scriptVisitor
		);
	},
};

export = rule
