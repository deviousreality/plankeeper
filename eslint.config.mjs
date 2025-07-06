import { defineConfig } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import parser from "vue-eslint-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([{
    extends: compat.extends(
        "plugin:vue/vue3-recommended",
        "plugin:nuxt/recommended",
    ),

    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        globals: {
            // Browser globals
            document: "readonly",
            navigator: "readonly",
            window: "readonly",
            console: "readonly",
            // Node.js globals
            process: "readonly",
            __dirname: "readonly",
            __filename: "readonly",
            module: "readonly",
            require: "readonly",
        },

        parser: parser,
        ecmaVersion: 2020,
        sourceType: "module",

        parserOptions: {
            parser: "@typescript-eslint/parser",
        },
    },

    rules: {
        "@typescript-eslint/no-explicit-any": "warn",

        "@typescript-eslint/explicit-function-return-type": ["warn", {
            allowExpressions: true,
            allowTypedFunctionExpressions: true,
        }],

        "@typescript-eslint/no-unused-vars": ["error", {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
        }],

        "@typescript-eslint/consistent-type-definitions": ["error", "type"],
        "@typescript-eslint/prefer-interface": "off",
        "no-console": "off",
        "vue/multi-word-component-names": "off",
        "vue/no-v-html": "error",
        "vue/require-default-prop": "error",
        "vue/require-prop-types": "error",
    },
}]);