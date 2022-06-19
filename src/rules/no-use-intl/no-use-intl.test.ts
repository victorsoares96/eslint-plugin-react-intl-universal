import { RuleTester } from 'eslint';

import rule from './no-use-intl';

const tester = new RuleTester({ parserOptions: { ecmaVersion: 2015 } });

tester.run('no-use-intl', rule, {
	valid: [{ code: 'intl' }],
	invalid: [
		{
			code: 'intl.get(\'foo\')',
			errors: [{ message: 'Don\'t use intl' }],
		},
		{
			code: 'intl.getHTML(\'foo\')',
			errors: [{ message: 'Don\'t use intl' }],
		},
	],
});
