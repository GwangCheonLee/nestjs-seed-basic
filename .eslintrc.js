module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'eslint:recommended',
    'google',
    'prettier',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    'require-jsdoc': [
      'error',
      {
        require: {
          FunctionDeclaration: true,
          MethodDefinition: false,
          ClassDeclaration: false,
          ArrowFunctionExpression: true,
          FunctionExpression: true,
        },
      },
    ],
    'new-cap': 0,
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {argsIgnorePattern: '^_', varsIgnorePattern: '^_'}, // _로 시작하는 변수 무시
    ],
    'no-unused-vars': [
      'warn',
      {argsIgnorePattern: '^_', varsIgnorePattern: '^_'}, // _로 시작하는 변수 무시
    ],

    // 네이밍 컨벤션
    // - 헝가리안 표기법 금지
    // - 기본 변수는 camelCase, PascalCase, UPPER_CASE 허용
    // 근거: IDE 기능이 발전하여 헝가리안 표기법을 이용한 타입 표기는 현재 시점에서 무의미함
    '@typescript-eslint/naming-convention': [
      'warn',
      // camelCase 변수, PascalCase 변수, UPPER_CASE 변수 허용
      {
        selector: 'variable',
        format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
      },
      // camelCase 함수, PascalCase 함수 허용
      {
        selector: 'function',
        format: ['camelCase', 'PascalCase'],
      },
      // PascalCase 클래스, interfaces, type aliases, enums 허용
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
      // interface 앞에 I 사용 불가
      {
        selector: 'interface',
        format: ['PascalCase'],
        custom: {
          regex: '^I[A-Z]',
          match: false,
        },
      },
      // typeAlias 앞에 T 사용 불가
      {
        selector: 'typeAlias',
        format: ['PascalCase'],
        custom: {
          regex: '^T[A-Z]',
          match: false,
        },
      },
      // typeParameter 앞에 T 사용 불가
      {
        selector: 'typeParameter',
        format: ['PascalCase'],
        custom: {
          regex: '^T[A-Z]',
          match: false,
        },
      },
    ],
  },
};
