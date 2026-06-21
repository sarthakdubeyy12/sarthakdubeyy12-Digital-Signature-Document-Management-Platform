module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
    'plugin:node/recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['prettier'],
  rules: {
    // Prettier
    'prettier/prettier': 'error',
    
    // General
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-underscore-dangle': ['error', { allow: ['_id', '__v'] }],
    
    // Import
    'import/prefer-default-export': 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    
    // Node
    'node/no-unsupported-features/es-syntax': ['error', { ignores: ['modules'] }],
    'node/no-missing-import': 'off',
    'node/no-unpublished-require': 'off',
    
    // Functions
    'func-names': 'off',
    'consistent-return': 'off',
    
    // Classes
    'class-methods-use-this': 'off',
    
    // Async
    'no-await-in-loop': 'warn',
    
    // Error handling
    'no-throw-literal': 'error',
  },
};
