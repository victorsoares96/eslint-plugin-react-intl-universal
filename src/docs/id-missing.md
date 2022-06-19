# Enforce react-intl message ids to be in locale file (id-missing)

This rule checks ids used in methods `get` and `getHTML` from **react-intl-universal** library, they are located in the locale files.

By default, the locales is set to `['locales/en-US.json']`, but can be changed this way:

## Rule Details

Given an example locale file whose content looks like:

```json
{
  "foo": "bar"
}
```

Examples of **incorrect** code for this rule:

```js
intl.get('lorem')
```

```js
intl.getHTML('lorem')
```

Examples of **correct** code for this rule:

```js
intl.get('foo')
```

```js
intl.getHTML('foo')
```

### Options

```json
{
  "react-intl-universal/id-missing": [
    "error",
    {
      "locales": ["locales/en-US.json"]
    }
  ]
}
```

`locales`: list of locale files, defaults to `['locales/en-US.json']`

## When Not To Use It

Disable this rule if the module does not have locale files.
