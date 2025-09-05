// ABOUTME: Vitest configuration for testing Bakul API without external dependencies
// ABOUTME: Uses node environment to test business logic without real database

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true
  }
})