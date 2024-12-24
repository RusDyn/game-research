import { http, HttpResponse, PathParams } from 'msw'
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
  http.get('https://api.fandom.com/*', async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('query')
    
    if (!query) {
      return HttpResponse.json(fandomMocks.malformedResponse, { status: 400 })
    }

    if (query.toLowerCase().includes('test game')) {
      return HttpResponse.json(fandomMocks.validGameResponse)
    }

    return HttpResponse.json(fandomMocks.nonExistentGameResponse, { status: 404 })
  }),

  // IGN API handlers
  http.get('https://api.ign.com/*', async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('q')
    
    if (search?.toLowerCase().includes('test game')) {
      return HttpResponse.json(ignMocks.validGameResponse)
    }

    return HttpResponse.json(ignMocks.emptyGameResponse)
  }),

  // Gamespot API handlers
  http.get('https://api.gamespot.com/*', async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const filter = url.searchParams.get('filter')
    
    if (filter?.toLowerCase().includes('test game')) {
      return HttpResponse.json(gamespotMocks.validGameResponse)
    }

    return HttpResponse.json(gamespotMocks.emptyGameResponse)
  }),

  // YouTube API handlers
  http.get('https://www.googleapis.com/youtube/v3/search', async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const q = url.searchParams.get('q')
    
    if (q?.toLowerCase().includes('test game')) {
      return HttpResponse.json(youtubeMocks.validSearchResponse)
    }

    return HttpResponse.json(youtubeMocks.emptySearchResponse)
  }),

  http.get('https://www.googleapis.com/youtube/v3/captions/*', async ({ request }: { request: Request }) => {
    const url = new URL(request.url)
    const videoId = url.pathname.split('/').pop()
    
    if (videoId === 'abc123') {
      return HttpResponse.json(youtubeMocks.validTranscriptResponse)
    }

    return HttpResponse.json(youtubeMocks.noTranscriptResponse, { status: 404 })
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
