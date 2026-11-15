import { vi } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.CRON_SECRET = 'test-cron-secret-16chars-minimum-token';
process.env.FIREBASE_PROJECT_ID = 'silversync-test';

// Global test teardown or mocks if needed
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));
