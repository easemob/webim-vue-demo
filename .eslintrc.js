module.exports = {
    root: true,
    env: {
        node: true
    },
    'extends': [
        'plugin:vue/vue3-essential',
        'eslint:recommended'
    ],
    parserOptions: {
        parser: '@babel/eslint-parser'
    },
    rules: {
        'arrow-parens': 0,
        'generator-star-spacing': 0,
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        //强制不使用分号结尾
        semi: [
            'error',
            'never'
        ],
        //强制使用单引号
        quotes: ['error', 'single'],
        indent: [
            'error',
            4
        ],
        'space-before-function-paren': 0,
        'eol-last': 0,
        'no-useless-escape': 'off',
        'max-len': [
            2,
            300,
            4,
            {
                ignoreUrls: true
            }
        ],
        'prefer-const': [
            'error',
            {
                destructuring: 'all',
                ignoreReadBeforeAssign: false
            }
        ],
        'guard-for-in': 'error',
        'vue/multi-word-component-names': 0 // 取消组件名称校验
    }
}
