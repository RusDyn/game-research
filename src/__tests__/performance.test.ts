import { GameInformationService } from '../index';
import { GameDataResponse } from '../types/GameData';
import { FandomCollector } from '../collectors/FandomCollector';
import { IGNCollector } from '../collectors/IGNCollector';
import { GamespotCollector } from '../collectors/GamespotCollector';
import { YouTubeCollector } from '../collectors/YouTubeCollector';
import { server, http } from './setup';
import * as fandomMocks from '../__mocks__/fandom';
import * as ignMocks from '../__mocks__/ign';
import * as gamespotMocks from '../__mocks__/gamespot';
import * as youtubeMocks from '../__mocks__/youtube';

jest.setTimeout(70000); // Set higher timeout for performance tests

describe('Performance Tests', () => {
  let service: GameInformationService;

  beforeEach(() => {
    service = new GameInformationService();
    // Register all collectors
    service.registerCollector(new FandomCollector());
    service.registerCollector(new IGNCollector());
    service.registerCollector(new GamespotCollector());
    service.registerCollector(new YouTubeCollector());

    // Reset MSW handlers to default behavior
    server.resetHandlers(
      http.get('https://api.fandom.com/*', () => {
        return new Response(JSON.stringify(fandomMocks.validGameResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }),
      http.get('https://api.ign.com/*', () => {
        return new Response(JSON.stringify(ignMocks.validGameResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }),
      http.get('https://api.gamespot.com/*', () => {
        return new Response(JSON.stringify(gamespotMocks.validGameResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }),
      http.get('https://www.googleapis.com/youtube/v3/search', () => {
        return new Response(JSON.stringify(youtubeMocks.validSearchResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }),
      http.get('https://www.googleapis.com/youtube/v3/captions/*', () => {
        return new Response(JSON.stringify(youtubeMocks.validTranscriptResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
  });

  describe('Response Time Tests', () => {
    it('should complete data collection within 60 seconds', async () => {
      const startTime = Date.now();
      
      const result: GameDataResponse = await service.collectGameInformation('The Witcher 3');
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000; // Convert to seconds
      
      expect(duration).toBeLessThanOrEqual(60);
      expect(result).toBeDefined();
      expect(result.stats.collection_duration).toBeLessThanOrEqual(60);
    });

    it('should complete data collection within 60 seconds for multiple concurrent requests', async () => {
      const gameNames = [
        'The Witcher 3',
        'Red Dead Redemption 2',
        'God of War'
      ];
      
      const startTime = Date.now();
      
      const results = await Promise.all(
        gameNames.map(game => service.collectGameInformation(game))
      );
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      expect(duration).toBeLessThanOrEqual(60);
      
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.stats.collection_duration).toBeLessThanOrEqual(60);
      });
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should maintain rate limits during concurrent requests', async () => {
      const gameNames = Array(10).fill('The Witcher 3'); // Create multiple requests for same game
      
      const startTime = Date.now();
      const results = await Promise.all(
        gameNames.map(game => service.collectGameInformation(game))
      );
      const endTime = Date.now();
      
      // Verify each request succeeded
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.entries.length).toBeGreaterThan(0);
      });

      // Calculate requests per second
      const durationSeconds = (endTime - startTime) / 1000;
      const requestsPerSecond = results.length / durationSeconds;
      
      // Should not exceed 5 requests per second per source (from requirements)
      expect(requestsPerSecond).toBeLessThanOrEqual(5);
    });

    it('should isolate errors between concurrent requests', async () => {
      const games = [
        'The Witcher 3', // Valid game
        'ThisGameDefinitelyDoesNotExist123', // Invalid game
        'Red Dead Redemption 2' // Valid game
      ];

      const results = await Promise.allSettled(
        games.map(game => service.collectGameInformation(game))
      );

      // Valid games should succeed
      expect(results[0].status).toBe('fulfilled');
      expect(results[2].status).toBe('fulfilled');
      
      // Invalid game should fail but not affect others
      expect(results[1].status).toBe('rejected');
      
      if (results[0].status === 'fulfilled' && results[2].status === 'fulfilled') {
        expect(results[0].value.entries.length).toBeGreaterThan(0);
        expect(results[2].value.entries.length).toBeGreaterThan(0);
      }
    });

    it('should handle rapid sequential requests efficiently', async () => {
      const game = 'The Witcher 3';
      const requests: Promise<GameDataResponse>[] = [];
      
      // Make 5 rapid sequential requests
      for (let i = 0; i < 5; i++) {
        requests.push(service.collectGameInformation(game));
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between requests
      }
      
      const results = await Promise.all(requests);
      
      // Verify all requests succeeded and returned valid data
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.entries.length).toBeGreaterThan(0);
        expect(result.stats.collection_duration).toBeLessThanOrEqual(60);
      });
      
      // Check for response consistency
      const entryCounts = results.map(r => r.entries.length);
      const maxDiff = Math.max(...entryCounts) - Math.min(...entryCounts);
      expect(maxDiff).toBeLessThanOrEqual(5); // Allow small variance in results
    });
  });

  describe('Memory Usage Tests', () => {
    const getMemoryUsage = () => {
      const usage = process.memoryUsage();
      return {
        heapUsed: usage.heapUsed / 1024 / 1024, // Convert to MB
        heapTotal: usage.heapTotal / 1024 / 1024,
        rss: usage.rss / 1024 / 1024
      };
    };

    it('should maintain reasonable memory usage for single request', async () => {
      const initialMemory = getMemoryUsage();
      
      await service.collectGameInformation('The Witcher 3');
      
      const finalMemory = getMemoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be less than 100MB for a single request
      expect(memoryIncrease).toBeLessThan(100);
    });

    it('should efficiently handle memory during concurrent requests', async () => {
      const initialMemory = getMemoryUsage();
      
      const gameNames = [
        'The Witcher 3',
        'Red Dead Redemption 2',
        'God of War',
        'Cyberpunk 2077',
        'Elden Ring'
      ];
      
      await Promise.all(
        gameNames.map(game => service.collectGameInformation(game))
      );
      
      const finalMemory = getMemoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be less than 200MB for 5 concurrent requests
      expect(memoryIncrease).toBeLessThan(200);
    });

    it('should cleanup memory after requests complete', async () => {
      const initialMemory = getMemoryUsage();
      
      // Run a batch of requests
      await Promise.all([
        service.collectGameInformation('The Witcher 3'),
        service.collectGameInformation('Red Dead Redemption 2')
      ]);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Wait a short period for any cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const finalMemory = getMemoryUsage();
      const memoryDiff = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory should return close to initial state (within 50MB)
      expect(Math.abs(memoryDiff)).toBeLessThan(50);
    });
  });

  describe('Cache Effectiveness Tests', () => {
    it('should return cached data for repeated requests within 24 hours', async () => {
      // First request - should hit the API
      const startTime1 = Date.now();
      const result1 = await service.collectGameInformation('The Witcher 3');
      const duration1 = Date.now() - startTime1;

      // Second request - should use cache
      const startTime2 = Date.now();
      const result2 = await service.collectGameInformation('The Witcher 3');
      const duration2 = Date.now() - startTime2;

      // Cache should make second request significantly faster
      expect(duration2).toBeLessThan(duration1 * 0.5);
      
      // Results should be identical when using cache
      expect(result2).toEqual(result1);
    });

    it('should maintain data integrity in cached responses', async () => {
      const result1 = await service.collectGameInformation('Red Dead Redemption 2');
      const result2 = await service.collectGameInformation('Red Dead Redemption 2');

      // Verify all important fields are preserved in cached response
      expect(result2.game_name).toBe(result1.game_name);
      expect(result2.entries.length).toBe(result1.entries.length);
      expect(result2.stats.total_entries).toBe(result1.stats.total_entries);
      expect(result2.stats.average_reliability).toBe(result1.stats.average_reliability);
      
      // Deep check first entry to ensure all data is preserved
      expect(result2.entries[0]).toEqual(result1.entries[0]);
    });

    it('should expire cache after 24 hours', async () => {
      // Mock Date.now to control time
      const realDateNow = Date.now;
      const startTime = 1672531200000; // Jan 1, 2023 00:00:00
      Date.now = jest.fn(() => startTime);

      // First request
      const result1 = await service.collectGameInformation('God of War');
      
      // Move time forward 23 hours (should still use cache)
      Date.now = jest.fn(() => startTime + 23 * 60 * 60 * 1000);
      const result2 = await service.collectGameInformation('God of War');
      expect(result2).toEqual(result1);

      // Move time forward 25 hours (should bypass cache)
      Date.now = jest.fn(() => startTime + 25 * 60 * 60 * 1000);
      const result3 = await service.collectGameInformation('God of War');
      expect(result3.collection_timestamp).not.toBe(result1.collection_timestamp);

      // Restore original Date.now
      Date.now = realDateNow;
    });

    it('should handle cache for concurrent requests efficiently', async () => {
      // First request to populate cache
      await service.collectGameInformation('Elden Ring');

      // Multiple concurrent requests for same game
      const startTime = Date.now();
      const results = await Promise.all(
        Array(5).fill(null).map(() => service.collectGameInformation('Elden Ring'))
      );
      const duration = Date.now() - startTime;

      // All concurrent requests should be fast due to cache
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second

      // All results should be identical
      const firstResult = results[0];
      results.forEach(result => {
        expect(result).toEqual(firstResult);
      });
    });
  });
});
