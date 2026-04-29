import { defineConfig } from "eslint/config";
import next from "eslint-config-next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default defineConfig([
  ...next,
  firebaseRulesPlugin.configs['flat/recommended']
]);
