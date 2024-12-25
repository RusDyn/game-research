import { YouTubeCollector } from './YouTubeCollector';
import 'jest'; // Add this import

jest.mock('../utils/logger');

describe('YouTubeCollector', () => {
  let collector: YouTubeCollector;

  beforeEach(() => {
    collector = new YouTubeCollector();
    jest.clearAllMocks();
  });

  describe('Transcript Extraction', () => {
    it('should extract and combine transcript segments into content', async () => {
      const entries = await collector.collect('Test Game');
      
      expect(entries.length).toBeGreaterThan(0);
      expect(entries[0].content).toContain('Welcome to our review of Test Game');
      expect(entries[0].content).toContain('The gameplay mechanics are innovative');
      expect(entries[0].content).toContain('Graphics are stunning and well optimized');
    });

    it('should handle videos with no available transcript', async () => {
      // Mock implementation would return noTranscriptResponse
      const entries = await collector.collect('No Transcript Game');
      expect(entries).toHaveLength(0);
    });
  });

  describe('Channel Filtering', () => {
    it('should include content from verified gaming channels', async () => {
      const entries = await collector.collect('Test Game');
      
      expect(entries.some(entry => 
        entry.site_specific.author === 'GameReviewer'
      )).toBeTruthy();
    });

    it('should filter out content from non-gaming channels', async () => {
      const entries = await collector.collect('Test Game');
      
      expect(entries.every(entry => 
        ['GameReviewer', 'GameGuides'].includes(entry.site_specific.author as string)
      )).toBeTruthy();
    });
  });

  describe('Duration Filtering', () => {
    it('should include videos within acceptable duration range', async () => {
      const entries = await collector.collect('Test Game');
      
      // Both mock videos are between 10-30 minutes
      expect(entries.length).toBeGreaterThan(0);
    });

    it('should filter out videos that are too short or too long', async () => {
      // Implementation would filter videos outside 10-30 minute range
      const entries = await collector.collect('Duration Test Game');
      
      entries.forEach(entry => {
        // Duration should be stored in the section_type field as "VIDEO_DURATION_XXX"
        const durationMatch = entry.site_specific.section_type?.match(/VIDEO_DURATION_(\d+)/);
        expect(durationMatch).toBeTruthy();
        const duration = parseInt(durationMatch![1]);
        expect(duration).toBeGreaterThanOrEqual(10 * 60); // 10 minutes in seconds
        expect(duration).toBeLessThanOrEqual(30 * 60); // 30 minutes in seconds
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API quota exceeded errors', async () => {
      // Mock implementation would return quotaExceededResponse
      await expect(collector.collect('Quota Test Game')).rejects.toThrow('The request cannot be completed because you have exceeded your quota');
    });

    it('should handle invalid API key errors', async () => {
      // Mock implementation would return invalidApiKeyResponse
      await expect(collector.collect('Invalid Key Game')).rejects.toThrow('Invalid API key');
    });

    it('should handle empty search results gracefully', async () => {
      // Mock implementation would return emptySearchResponse
      const entries = await collector.collect('Nonexistent Game');
      expect(entries).toHaveLength(0);
    });
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

    it('should respect rate limits', async () => {
      const requests = ['Game1', 'Game2', 'Game3', 'Game4', 'Game5', 'Game6'].map(game => {
        currentTime += 200; // Simulate time passing
        return collector.collect(game);
      });
      
      await Promise.all(requests);
      expect(dateNowSpy).toHaveBeenCalledTimes(12); // Each request calls Date.now() twice
    });
  });

  describe('Data Structure', () => {
    it('should return properly structured GameDataEntry objects', async () => {
      const entries = await collector.collect('Test Game');
      
      entries.forEach(entry => {
        expect(entry).toMatchObject({
          content: expect.any(String),
          url: expect.any(String),
          reliability_score: expect.any(Number),
          content_type: 'YOUTUBE',
          collection_timestamp: expect.any(String),
          text_length: expect.any(Number),
          site_specific: {
            author: expect.any(String),
            publication_date: expect.any(String)
          }
        });
      });
    });
  });
});
