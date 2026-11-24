// https://docs.expo.dev/guides/using-eslint/
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const ACCENTS = '/^(brand|live|amber|crimsonAlert)$/';
const ACCENT_TEXT_MESSAGE =
  'Accent is non-text only. Use brandStrong / liveStrong / amberStrong / error (neonOrangeDeep for large orange text).';

const COLOR_LITERAL_RULE = [
  'error',
  {
    selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
    message: 'Use a colour token from @packages/ui/theme (or @/constants/theme) instead of a hex literal.',
  },
  {
    selector: 'Literal[value=/^rgba?\\(/]',
    message: 'Use a colour token from @packages/ui/theme (or @/constants/theme) instead of an rgb(a) literal.',
  },
  {
    // DESIGN.md `primary-container` (#ff5e00) is kept for fidelity only; the user's brand is #FF5500.
    selector: "MemberExpression[object.name='colors'][property.name='primaryContainer']",
    message: 'Use colors.brand (#FF5500) or colors.brandAction',
  },
  // Plan W3/W4: the bright accents are non-text only. Icon `color` props are not restricted.
  {
    selector: `Property[key.name='color'] > MemberExpression[object.name='colors'][property.name=${ACCENTS}]`,
    message: ACCENT_TEXT_MESSAGE,
  },
  {
    selector: `JSXOpeningElement[name.name='AppText'] > JSXAttribute[name.name='color'] MemberExpression[object.name='colors'][property.name=${ACCENTS}]`,
    message: ACCENT_TEXT_MESSAGE,
  },
];

module.exports = defineConfig([
  globalIgnores(['node_modules/*', '.expo/*', 'dist/*', 'docs/*', 'scripts/*']),
  expoConfig,
  {
    files: ['src/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': COLOR_LITERAL_RULE,
    },
  },
  {
    files: ['packages/ui/src/theme/**'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['src/screens/commuters/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/screens/drivers/*', '@/screens/drivers/**', '@/screens/drivers', '**/screens/drivers/**'],
              message: 'Commuter screens must not import driver screens. Move shared code to screens/shared or packages/ui.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/screens/drivers/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/screens/commuters/*', '@/screens/commuters/**', '@/screens/commuters', '**/screens/commuters/**'],
              message: 'Driver screens must not import commuter screens. Move shared code to screens/shared or packages/ui.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['packages/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/*', '@/**', '**/src/app/**', '**/src/screens/**', '**/src/constants/**', '**/src/services/**', '**/src/types/**', '**/src/utils/**', '**/src/hooks/**', '../../../src/**', '../../../../src/**'],
              message: 'Packages must not import app code from src/.',
            },
          ],
        },
      ],
    },
  },
]);
