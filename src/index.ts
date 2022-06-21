import noLiteralString from './rules/no-literal-string/no-literal-string';
import noUseIntl from './rules/no-use-intl/no-use-intl';
import idMissing from './rules/id-missing/id-missing';

export = {
	rules: {
		'no-literal-string': noLiteralString,
		'no-use-intl': noUseIntl,
		'id-missing': idMissing,
	},
	configs: {
		recommended: {
			plugins: [
				'react-intl-universal'
			],
			rules: {
				'react-intl-universal/no-literal-string': 'error',
				'react-intl-universal/id-missing': 'error',
			},
		},
	},
}
