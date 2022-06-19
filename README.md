eslint-plugin-react-intl-universal
===================

[react-intl-universal](https://github.com/alibaba/react-intl-universal) linting rules for Alibaba React Intl Universal internationalization library.

## Installation

```sh
$ npm install eslint-plugin-react-intl-universal
```
```sh
$ yarn add eslint-plugin-react-intl-universal
```

## Usage

Add `react-intl-universal` to the plugins section of your `.eslintrc` configuration file.

```json
{
  "plugins": ["react-intl-universal"]
}
```

Then configure the rules you want to use under the rules section.

```json
{
  "rules": {
    "react-intl-universal/no-literal-string": "error",
    "react-intl-universal/id-missing": ["error", { "locales": ["src/locales/en-US.json"] }]
  }
}
```

or

```json
{
  "extends": ["plugin:react-intl-universal/recommended"]
}
```

## Supported Rules

* [id-missing](docs/rules/id-missing.md) - This rule was based on the rule in this repository.
* [no-literal-string](docs/rules/no-literal-string.md) - This rule aims to avoid developers to display literal string directly to users without translating them.

## Thanks
* [eslint-plugin-react-intl](https://github.com/godaddy/eslint-plugin-react-intl) by [GoDaddy](https://github.com/godaddy), many parts of my project were based on yours.
* [eslint-plugin-i18next](https://github.com/edvardchen/eslint-plugin-i18next) by [edvardchen](https://github.com/edvardchen), i made an adaptation of the **no-literal-string** created by him in my project.

## License

eslint-plugin-react-intl-universal is licensed under the [MIT License](http://www.opensource.org/licenses/mit-license.php).
