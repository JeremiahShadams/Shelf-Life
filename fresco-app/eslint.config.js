// ESLint flat config — extends the shared Expo config.
// `expo lint` and `npx eslint src` both pick this up.
// See: https://github.com/expo/expo/tree/main/packages/eslint-config-expo
const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    ignores: ["dist/*", "node_modules/*", ".expo/*"],
  },
];
