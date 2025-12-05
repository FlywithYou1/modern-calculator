import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import prettier from 'eslint-plugin-prettier';
import vitestPlugin from 'eslint-plugin-vitest';
import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['dist', 'node_modules', 'src-tauri/target', 'coverage', '*.log'],
  },
  {
    files: ['**/*.{ts,tsx,vue,js}'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
    plugins: {
      vue,
      prettier,
      vitest: vitestPlugin,
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...vue.configs['vue3-recommended']?.rules,
      ...tseslint.configs.recommended.rules,
      'prettier/prettier': 'warn',
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/*.spec.{ts,tsx,js}'],
    plugins: {
      vitest: vitestPlugin,
    },
    rules: {
      'vitest/expect-expect': 'warn',
    },
  },
];