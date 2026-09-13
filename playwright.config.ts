import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  use: {baseURL: 'http://127.0.0.1:3065'},
  webServer: {
    command: 'npm run serve -- --host 127.0.0.1 --port 3065 --no-open',
    url: 'http://127.0.0.1:3065',
    reuseExistingServer: false,
  },
});
