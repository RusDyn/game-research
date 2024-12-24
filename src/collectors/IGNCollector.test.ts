import { IGNCollector } from './IGNCollector';
import { validGameResponse, emptyGameResponse, errorResponse } from '../__mocks__/ign';
import { GameDataEntry } from '../types/GameData';

// Mock the fetch function
global.fetch = jest.fn();

describe('IGNCollector', () => {
  let collector: IGNCollector;

  beforeEach(() => {
    collector = new IGNCollector();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should collect and transform IGN articles', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => validGameResponse
    });

    const results = await collector.collect('Test Game');

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      content: 'Test Game brings innovative gameplay mechanics...',
      url: 'https://www.ign.com/articles/test-game-review',
      content_type: 'IGN',
      site_specific: {
        author: 'John Doe',
        publication_date: '2023-01-01T00:00:00Z'
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

  it('should handle API errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => errorResponse
    });

    await expect(collector.collect('Error Game')).rejects.toThrow();
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

    const startTime = Date.now();
    await collector.collect('Game 1');
    await collector.collect('Game 2');
    const endTime = Date.now();

    // Should have at least 200ms between requests (from BaseCollector)
    expect(endTime - startTime).toBeGreaterThanOrEqual(200);
  });

  it('should validate entries before returning', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        articles: [{
          // Missing required fields to test validation
          metadata: {},
          content: {}
        }]
      })
    });

    await expect(collector.collect('Invalid Game')).rejects.toThrow();
  });
});
