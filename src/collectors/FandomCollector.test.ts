import { FandomCollector } from './FandomCollector'
import { testLogCapture } from '../__tests__/setup'
import * as fandomMocks from '../__mocks__/fandom'

describe('FandomCollector', () => {
  let collector: FandomCollector

  beforeEach(() => {
    collector = new FandomCollector()
  })

  describe('collect', () => {
    it('should successfully collect data for a valid game', async () => {
      const result = await collector.collect('Test Game')
      
      expect(result).toBeDefined()
      expect(result.entries).toHaveLength(1)
      expect(result.entries[0]).toMatchObject({
        content: expect.stringContaining('Test Game is an action-adventure video game'),
        url: expect.stringContaining('gaming.fandom.com'),
        reliability_score: expect.any(Number),
        content_type: 'FANDOM',
        text_length: expect.any(Number),
        site_specific: {
          section_type: 'abstract',
          publication_date: expect.any(String)
        }
      })
    })

    it('should handle non-existent games', async () => {
      const result = await collector.collect('NonExistentGame')
      
      expect(result.entries).toHaveLength(0)
      expect(testLogCapture.containsMessage('No pages found for game: NonExistentGame')).toBe(true)
    })

    it('should handle rate limiting', async () => {
      // Mock rate limit response
      server.use(
        http.get('https://api.fandom.com/*', () => {
          return HttpResponse.json(fandomMocks.rateLimitResponse, { status: 429 })
        })
      )

      const result = await collector.collect('Test Game')
      
      expect(result.entries).toHaveLength(0)
      expect(testLogCapture.containsError('Rate limit exceeded for Fandom API')).toBe(true)
    })

    it('should extract sections correctly', async () => {
      const result = await collector.collect('Test Game')
      
      // Check if all sections are extracted
      const sections = ['Gameplay', 'Story', 'Development']
      sections.forEach(section => {
        const sectionEntry = result.entries.find(
          entry => entry.site_specific.section_type === section.toLowerCase()
        )
        expect(sectionEntry).toBeDefined()
        expect(sectionEntry?.content).toBeTruthy()
      })
    })

    it('should handle malformed responses', async () => {
      // Mock malformed response
      server.use(
        http.get('https://api.fandom.com/*', () => {
          return HttpResponse.json(fandomMocks.malformedResponse, { status: 400 })
        })
      )

      const result = await collector.collect('Test Game')
      
      expect(result.entries).toHaveLength(0)
      expect(testLogCapture.containsError('Invalid request to Fandom API')).toBe(true)
    })

    it('should respect rate limiting configuration', async () => {
      // Make multiple requests in quick succession
      const promises = Array(6).fill(null).map(() => collector.collect('Test Game'))
      const results = await Promise.all(promises)
      
      // The 6th request should be rate limited
      expect(results[5].entries).toHaveLength(0)
      expect(testLogCapture.containsError('Rate limit exceeded for Fandom API')).toBe(true)
    })
  })

  describe('calculateReliability', () => {
    it('should calculate reliability score based on content', async () => {
      const result = await collector.collect('Test Game')
      
      result.entries.forEach(entry => {
        expect(entry.reliability_score).toBeGreaterThan(0)
        expect(entry.reliability_score).toBeLessThanOrEqual(10)
      })
    })

    it('should give higher scores to longer, well-structured content', async () => {
      const result = await collector.collect('Test Game')
      
      // Sort entries by length
      const sortedEntries = [...result.entries].sort(
        (a, b) => b.text_length - a.text_length
      )
      
      // Longer entries should have higher reliability scores
      expect(sortedEntries[0].reliability_score)
        .toBeGreaterThan(sortedEntries[sortedEntries.length - 1].reliability_score)
    })
  })
})
