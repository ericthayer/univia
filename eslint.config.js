import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="item"]',
          message: 'Do not use the "item" prop on Grid. Use the new MUI v7 Grid syntax with "size" prop instead. See: https://mui.com/material-ui/react-grid/',
        },
        {
          selector: 'JSXAttribute[name.name="xs"][value.type!="JSXExpressionContainer"]',
          message: 'Do not use xs/sm/md/lg/xl as direct props on Grid. Use the new MUI v7 Grid syntax with size={{ xs: 12, md: 6 }} instead. See: https://mui.com/material-ui/react-grid/',
        },
      ],
    },
  }
);
