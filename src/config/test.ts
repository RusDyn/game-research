export const testConfig = {
  database: {
    type: 'sqlite',
    database: ':memory:', // Use in-memory SQLite for tests
    synchronize: true, // Automatically create tables in test environment
    logging: false, // Disable logging in tests
    entities: ['src/entities/**/*.ts'],
  },
  cache: {
    type: 'memory',
    ttl: 300, // 5 minutes cache in tests
  },
  rateLimiting: {
    windowMs: 1000, // 1 second
    maxRequests: 5, // 5 requests per second
  },
  apis: {
    fandom: {
      baseUrl: 'https://api.fandom.com',
      timeout: 5000, // 5 seconds timeout for tests
    },
    ign: {
      baseUrl: 'https://api.ign.com',
      timeout: 5000,
    },
    gamespot: {
      baseUrl: 'https://api.gamespot.com',
      timeout: 5000,
    },
    youtube: {
      baseUrl: 'https://www.googleapis.com/youtube/v3',
      timeout: 5000,
    },
  },
  logging: {
    level: 'error', // Only log errors in tests
    format: 'json',
    transports: ['console'], // Only use console transport in tests
  }
}
