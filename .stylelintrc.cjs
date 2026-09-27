module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-config-standard-scss'],
  ignoreFiles: ['dist/**', 'build/**', 'node_modules/**'],
  rules: {
    'no-descending-specificity': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'property-no-vendor-prefix': null,
    'media-feature-range-notation': null,
    'import-notation': null,
    'value-keyword-case': null,
    'color-hex-length': null,
    'color-function-notation': null,
    'alpha-value-notation': null,
    'selector-class-pattern': [
      '^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$',
      { message: 'Expected BEM class name (block__element--modifier)' },
    ],
  },
};
