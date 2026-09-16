import js from "@eslint/js";

export default [
  {
    ignores: ["node_modules/**", "coverage/**", "dist/**"],
  },

  js.configs.recommended,

  {
    files: ["**/*.js"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },

    rules: {
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
];
