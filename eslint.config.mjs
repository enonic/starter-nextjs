import nextVitals from 'eslint-config-next/core-web-vitals'
import {defineConfig, globalIgnores} from 'eslint/config'

const eslintConfig = defineConfig([
    ...nextVitals,
    {
        rules: {
            "@next/next/no-img-element": "off",
            "eol-last": "warn"
        }
    },
    // Override default ignores of eslint-config-next.
    globalIgnores([
        '.delta/**',
        // Default ignores of eslint-config-next:
        '.next/**',
        'out/**',
        'build/**',
        'next-env.d.ts'
    ])
])

export default eslintConfig
