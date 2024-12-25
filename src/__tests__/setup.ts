import { http } from 'msw'
import { setupServer } from 'msw/node'
import * as fandomMocks from '../__mocks__/fandom'
import * as ignMocks from '../__mocks__/ign'
import * as gamespotMocks from '../__mocks__/gamespot'
import * as youtubeMocks from '../__mocks__/youtube'
import { logger, TestLogCapture } from '../utils/logger'
import { testConfig } from '../config/test'

// Initialize test log capture
const testLogCapture = new TestLogCapture()

// Define handlers for different API endpoints
const handlers = [
  // Fandom API handlers
  http.get('https://api.fandom.com/*', async ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('query')
    
    if (!query) {
      return new Response(JSON.stringify(fandomMocks.malformedResponse), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (query.toLowerCase().includes('test game')) {
      return new Response(JSON.stringify(fandomMocks.validGameResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(fandomMocks.nonExistentGameResponse), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  // IGN API handlers
  http.get('https://api.ign.com/*', async ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('q')
    
    if (search?.toLowerCase().includes('test game')) {
      return new Response(JSON.stringify(ignMocks.validGameResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(ignMocks.emptyGameResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  // Gamespot API handlers
  http.get('https://api.gamespot.com/*', async ({ request }) => {
    const url = new URL(request.url)
    const filter = url.searchParams.get('filter')
    
    if (filter?.toLowerCase().includes('test game')) {
      return new Response(JSON.stringify(gamespotMocks.validGameResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(gamespotMocks.emptyGameResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  // YouTube API handlers
  http.get('https://www.googleapis.com/youtube/v3/search', async ({ request }) => {
    const url = new URL(request.url)
    const q = url.searchParams.get('q')
    
    if (q?.toLowerCase().includes('test game')) {
      return new Response(JSON.stringify(youtubeMocks.validSearchResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(youtubeMocks.emptySearchResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }),

  http.get('https://www.googleapis.com/youtube/v3/captions/*', async ({ request }) => {
    const url = new URL(request.url)
    const videoId = url.pathname.split('/').pop()
    
    if (videoId === 'abc123') {
      return new Response(JSON.stringify(youtubeMocks.validTranscriptResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(youtubeMocks.noTranscriptResponse), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  })
]

// Create MSW server instance
const server = setupServer(...handlers)

// Setup for Jest
beforeAll(async () => {
  // Start the MSW interception
  server.listen()
  
  // Start log capture
  testLogCapture.start()
  
  logger.info('Test environment setup started', { config: testConfig })
})

beforeEach(() => {
  // Clear captured logs before each test
  testLogCapture.clear()
})

afterEach(() => {
  // Reset handlers between tests
  server.resetHandlers()
  
  // Log any errors that occurred during the test
  const logs = testLogCapture.getLogs()
  const errors = logs.filter(log => log.level === 'error')
  if (errors.length > 0) {
    console.error('Errors occurred during test:', errors)
  }
})

afterAll(async () => {
  // Clean up after tests are complete
  server.close()
  
  // Stop log capture
  testLogCapture.stop()
  
  logger.info('Test environment teardown complete')
})

export { server, http, testLogCapture }
