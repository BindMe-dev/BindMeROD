const js = require("@eslint/js")

module.exports = [
  {
    ignores: [
      "**/.next/**",
      "**/.vercel/**",
      "**/Next.js/**",
      "**/node_modules/**",
      "**/build/**",
      "**/dist/**",
      "drizzle/**",
      "scripts/**",
      "server.js",
      "delete-agreements.js",
      "jest.config.js",
    ],
  },
  {
    files: [
      "app/**/*.{js,jsx,mjs,cjs}",
      "components/**/*.{js,jsx,mjs,cjs}",
      "lib/**/*.{js,jsx,mjs,cjs}",
      "hooks/**/*.{js,jsx,mjs,cjs}",
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    ...js.configs.recommended,
  },
]
