import { GamespotCollector } from './GamespotCollector';
import { validGameResponse, emptyGameResponse, rateLimitResponse, serverErrorResponse } from '../__mocks__/gamespot';
import 'jest'; // Add this import

// Mock the fetch function
global.fetch = jest.fn();

describe('GamespotCollector', () => {
  let collector: GamespotCollector;

  beforeEach(() => {
    collector = new GamespotCollector();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should collect and transform Gamespot articles', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => validGameResponse
    });

    const results = await collector.collect('Test Game');

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      content: 'Test Game sets new standards for the genre...',
      url: 'https://www.gamespot.com/reviews/test-game-review/1900-1234567/',
      content_type: 'GAMESPOT',
      site_specific: {
        author: 'Mike Johnson',
        publication_date: '2023-01-15T12:00:00Z',
        section_type: 'Reviews'
      }
    });
    
    // Verify reliability score is within valid range
    expect(results[0].reliability_score).toBeGreaterThanOrEqual(0);
    expect(results[0].reliability_score).toBeLessThanOrEqual(10);
    
    // Verify text length is calculated
    expect(results[0].text_length).toBe(results[0].content.length);
    
    // Verify collection timestamp is present
    expect(results[0].collection_timestamp).toBeDefined();
  });

  it('should handle empty responses', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => emptyGameResponse
    });

    const results = await collector.collect('Nonexistent Game');
    expect(results).toHaveLength(0);
  });

  it('should handle rate limiting errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => rateLimitResponse
    });

    await expect(collector.collect('Rate Limited Game')).rejects.toThrow('API rate limit exceeded');
  });

  it('should handle server errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => serverErrorResponse
    });

    await expect(collector.collect('Error Game')).rejects.toThrow('Internal server error');
  });

  describe('Rate Limiting', () => {
    let dateNowSpy: jest.SpyInstance;
    let currentTime: number;

    beforeEach(() => {
      currentTime = 0;
      dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => currentTime);
    });

    afterEach(() => {
      dateNowSpy.mockRestore();
    });

    it('should respect rate limiting', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => validGameResponse
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => validGameResponse
        });

      await collector.collect('Game 1');
      currentTime += 200; // Simulate time passing
      await collector.collect('Game 2');
      
      expect(dateNowSpy).toHaveBeenCalledTimes(4); // Each request calls Date.now() twice
    });
  });

  it('should filter content by type', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            ...validGameResponse.results[0],
            categories: { name: 'News' } // Should be filtered out
          },
          {
            ...validGameResponse.results[1],
            categories: { name: 'Reviews' } // Should be included
          }
        ],
        limit: 10,
        offset: 0,
        total: 2
      })
    });

    const results = await collector.collect('Test Game');
    expect(results).toHaveLength(1);
    expect(results[0].site_specific.section_type).toBe('Reviews');
  });

  it('should validate entries before returning', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [{
          // Missing required fields to test validation
          id: 123,
          categories: { name: 'Reviews' }
        }]
      })
    });

    await expect(collector.collect('Invalid Game')).rejects.toThrow();
  });
});
