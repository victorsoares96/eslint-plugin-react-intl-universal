import { RuleTester } from 'eslint';
import rule from './id-missing';

const tester = new RuleTester({
	parserOptions: { ecmaVersion: 2015 },
});

jest.mock('./defaultOptions.json', () => ({
	locales: ['src/rules/id-missing/mocks/locales/en-US.json'],
}));

tester.run('id-missing', rule, {
	valid: [{ code: 'intl.get(\'ready\')' }, { code: 'intl.getHTML(\'cancel\')' }],
	invalid: [
		{
			code: 'intl.get(\'foo\')',
			errors: [{ message: 'Missing id: foo' }],
		},
		{
			code: 'intl.getHTML(\'foo\')',
			errors: [{ message: 'Missing id: foo' }],
		},
	],
});
