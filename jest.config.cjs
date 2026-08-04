const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

/** @type {import('jest').Config} */
const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/utils/**/*.ts',
    'src/schemas/**/*.ts',
    'src/services/**/*.ts',
    'src/components/StatusBadge.tsx',
    'src/components/EmptyState.tsx',
    'src/components/PageHeader.tsx',
    'src/components/ConfirmDialog.tsx',
    'src/components/SidePanel.tsx',
    'src/components/Breadcrumbs.tsx',
    'src/components/DataTable.tsx',
    'src/components/MasterDataTable.tsx',
  ],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 80,
      functions: 85,
      lines: 95,
    },
  },
}

module.exports = createJestConfig(config)
