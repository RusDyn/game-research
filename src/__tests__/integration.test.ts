import { GameInformationService } from '../index';
import { FandomCollector } from '../collectors/FandomCollector';
import { IGNCollector } from '../collectors/IGNCollector';
import { GamespotCollector } from '../collectors/GamespotCollector';
import { YouTubeCollector } from '../collectors/YouTubeCollector';
import { BaseCollector } from '../collectors/BaseCollector';
import { ContentType, GameDataEntry } from '../types/GameData';
import { testLogCapture } from './setup';

describe('Game Information Service Integration', () => {
  let service: GameInformationService;

  beforeEach(() => {
    service = new GameInformationService();
    // Register all collectors
    service.registerCollector(new FandomCollector());
    service.registerCollector(new IGNCollector());
    service.registerCollector(new GamespotCollector());
    service.registerCollector(new YouTubeCollector());
  });

  it('should collect data from multiple sources simultaneously', async () => {
    const result = await service.collectGameInformation('test game');

    // Verify we got entries from multiple sources
    expect(result.entries.length).toBeGreaterThan(0);
    
    // Check if we have entries from different collectors
    const contentTypes = new Set(result.entries.map(entry => entry.content_type));
    expect(contentTypes.size).toBeGreaterThan(1);

    // Verify stats are calculated correctly
    expect(result.stats.total_entries).toBe(result.entries.length);
    expect(result.stats.collection_duration).toBeLessThan(60); // Under 60s requirement
    expect(result.stats.average_reliability).toBeGreaterThan(0);

    // Check entries_by_type matches actual entry distribution
    for (const type of contentTypes) {
      const typeCount = result.entries.filter(e => e.content_type === type).length;
      expect(result.stats.entries_by_type[type as keyof typeof result.stats.entries_by_type]).toBe(typeCount);
    }
  });

  it('should handle failed collectors gracefully', async () => {
    // Request data for a non-existent game to trigger 404s
    const result = await service.collectGameInformation('nonexistent game');

    // Service should complete despite errors
    expect(result).toBeDefined();
    expect(result.game_name).toBe('nonexistent game');
    
    // Check logs for error messages
    const logs = testLogCapture.getLogs();
    const errorLogs = logs.filter(log => log.level === 'error');
    expect(errorLogs.length).toBeGreaterThan(0);
  });

  it('should maintain response format even with mixed success/failure', async () => {
    // Some collectors will succeed with 'test game' while others might fail
    const result = await service.collectGameInformation('test game partial');

    // Verify response structure is maintained
    expect(result).toMatchObject({
      game_name: expect.any(String),
      collection_timestamp: expect.any(Date),
      entries: expect.any(Array),
      stats: {
        total_entries: expect.any(Number),
        entries_by_type: expect.any(Object),
        average_reliability: expect.any(Number),
        collection_duration: expect.any(Number)
      }
    });

    // Verify stats calculations are correct even with partial data
    const actualTotal = result.entries.length;
    expect(result.stats.total_entries).toBe(actualTotal);

    const totalFromTypes = (Object.values(result.stats.entries_by_type) as number[])
      .reduce((sum: number, count: number) => sum + count, 0);
    expect(totalFromTypes).toBe(actualTotal);
  });

  it('should complete collection within time limit', async () => {
    const startTime = Date.now();
    
    await service.collectGameInformation('test game');
    
    const duration = (Date.now() - startTime) / 1000;
    expect(duration).toBeLessThan(60);
  });

  it('should handle duplicate content appropriately', async () => {
    // Create a collector that returns duplicate entries
    class DuplicateTestCollector extends BaseCollector {
      constructor() {
        super('TEST');
      }

      async collect(gameName: string): Promise<GameDataEntry[]> {
        await this.rateLimit();
        return [
          {
            content: 'Test content 1',
            url: 'http://test1.com',
            reliability_score: 7.5,
            content_type: 'TEST',
            collection_timestamp: new Date().toISOString(),
            text_length: 100,
            site_specific: {}
          },
          {
            // Exact duplicate
            content: 'Test content 1',
            url: 'http://test1.com',
            reliability_score: 6.5,
            content_type: 'TEST',
            collection_timestamp: new Date().toISOString(),
            text_length: 100,
            site_specific: {}
          },
          {
            // Same content, different URL
            content: 'Test content 1',
            url: 'http://test2.com',
            reliability_score: 8.5,
            content_type: 'TEST',
            collection_timestamp: new Date().toISOString(),
            text_length: 100,
            site_specific: {}
          },
          {
            // Unique content
            content: 'Test content 2',
            url: 'http://test3.com',
            reliability_score: 7.0,
            content_type: 'TEST',
            collection_timestamp: new Date().toISOString(),
            text_length: 100,
            site_specific: {}
          }
        ];
      }
    }

    service.registerCollector(new DuplicateTestCollector());

    const result = await service.collectGameInformation('test game');

    // Should remove exact duplicates (same URL and content)
    const urlCounts = result.entries.reduce((acc, entry) => {
      acc[entry.url] = (acc[entry.url] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.values(urlCounts).forEach(count => {
      expect(count).toBe(1); // Each URL should appear only once
    });

    // Should keep entry with highest reliability score for same content
    const contentEntries = result.entries.filter(e => e.content === 'Test content 1');
    expect(contentEntries.length).toBe(1);
    expect(contentEntries[0].reliability_score).toBe(8.5);

    // Should keep unique content
    const uniqueContent = result.entries.find(e => e.content === 'Test content 2');
    expect(uniqueContent).toBeDefined();
  });

  it('should enforce rate limits across multiple requests', async () => {
    // Create a test collector that tracks request times
    class RateLimitTestCollector extends BaseCollector {
      public requestTimes: number[] = [];

      constructor() {
        super('TEST');
      }

      async collect(gameName: string): Promise<GameDataEntry[]> {
        await this.rateLimit();
        this.requestTimes.push(Date.now());
        return [{
          content: `Test content for ${gameName}`,
          url: 'http://test.com',
          reliability_score: 7.5,
          content_type: 'TEST',
          collection_timestamp: new Date().toISOString(),
          text_length: 100,
          site_specific: {}
        }];
      }
    }

    const testCollector = new RateLimitTestCollector();
    service.registerCollector(testCollector);

    // Make 10 concurrent requests
    const requests = Array(10).fill('test game').map(game => 
      service.collectGameInformation(game)
    );

    await Promise.all(requests);

    // Verify rate limiting
    const intervals = [];
    for (let i = 1; i < testCollector.requestTimes.length; i++) {
      intervals.push(testCollector.requestTimes[i] - testCollector.requestTimes[i-1]);
    }

    // Each interval should be at least 200ms (5 requests per second)
    intervals.forEach(interval => {
      expect(interval).toBeGreaterThanOrEqual(200);
    });
  });

  it('should maintain separate rate limits per collector', async () => {
    // Create two test collectors that track request times
    class RateLimitCollector extends BaseCollector {
      public requestTimes: number[] = [];

      constructor(sourceType: ContentType) {
        super(sourceType);
      }

      async collect(gameName: string): Promise<GameDataEntry[]> {
        await this.rateLimit();
        this.requestTimes.push(Date.now());
        return [{
          content: `Test content for ${gameName} from ${this.sourceType}`,
          url: `http://${this.sourceType.toLowerCase()}.com`,
          reliability_score: 7.5,
          content_type: this.sourceType,
          collection_timestamp: new Date().toISOString(),
          text_length: 100,
          site_specific: {}
        }];
      }
    }

    const collector1 = new RateLimitCollector('TEST1' as ContentType);
    const collector2 = new RateLimitCollector('TEST2' as ContentType);
    
    // Create new service with just our test collectors
    const testService = new GameInformationService();
    testService.registerCollector(collector1);
    testService.registerCollector(collector2);

    // Make concurrent requests
    const startTime = Date.now();
    await testService.collectGameInformation('test game');

    // Calculate total duration for each collector
    const duration1 = collector1.requestTimes[collector1.requestTimes.length - 1] - collector1.requestTimes[0];
    const duration2 = collector2.requestTimes[collector2.requestTimes.length - 1] - collector2.requestTimes[0];

    // Total execution time should be less than sum of individual durations
    // indicating collectors ran in parallel with separate rate limits
    const totalDuration = Date.now() - startTime;
    expect(totalDuration).toBeLessThan(duration1 + duration2);

    // Verify each collector maintained its own rate limit
    const verifyRateLimit = (times: number[]) => {
      for (let i = 1; i < times.length; i++) {
        const interval = times[i] - times[i-1];
        expect(interval).toBeGreaterThanOrEqual(200);
      }
    };

    verifyRateLimit(collector1.requestTimes);
    verifyRateLimit(collector2.requestTimes);
  });

  it('should handle error cascades across collectors', async () => {
    // Create test collectors with different error behaviors
    class ErrorCollector extends BaseCollector {
      constructor(sourceType: ContentType, errorBehavior: 'immediate' | 'delayed' | 'resource-leak') {
        super(sourceType);
        this.errorBehavior = errorBehavior;
      }

      private errorBehavior: 'immediate' | 'delayed' | 'resource-leak';
      private resources: string[] = [];

      async collect(gameName: string): Promise<GameDataEntry[]> {
        await this.rateLimit();
        
        // Simulate allocating resources
        this.resources.push(`Resource for ${gameName}`);

        if (this.errorBehavior === 'immediate') {
          // Clean up before throwing
          this.resources = [];
          throw new Error(`Immediate error from ${this.sourceType}`);
        }

        if (this.errorBehavior === 'delayed') {
          // Simulate async operation that fails
          await new Promise(resolve => setTimeout(resolve, 100));
          // Clean up before throwing
          this.resources = [];
          throw new Error(`Delayed error from ${this.sourceType}`);
        }

        if (this.errorBehavior === 'resource-leak') {
          // Simulate a collector that fails without cleaning up
          throw new Error(`Resource leak error from ${this.sourceType}`);
          // Resources intentionally not cleaned up
        }

        return [];
      }

      getResourceCount(): number {
        return this.resources.length;
      }
    }

    // Create new service with error-generating collectors
    const testService = new GameInformationService();
    const immediateErrorCollector = new ErrorCollector('TEST1' as ContentType, 'immediate');
    const delayedErrorCollector = new ErrorCollector('TEST2' as ContentType, 'delayed');
    const resourceLeakCollector = new ErrorCollector('TEST3' as ContentType, 'resource-leak');
    const normalCollector = new FandomCollector(); // Regular collector for comparison

    testService.registerCollector(immediateErrorCollector);
    testService.registerCollector(delayedErrorCollector);
    testService.registerCollector(resourceLeakCollector);
    testService.registerCollector(normalCollector);

    // Collect data and capture logs
    const result = await testService.collectGameInformation('test game');
    const logs = testLogCapture.getLogs();

    // Verify error logging
    const errorLogs = logs.filter(log => log.level === 'error');
    expect(errorLogs.length).toBe(3); // One for each error collector
    expect(errorLogs.some(log => log.message.includes('Immediate error'))).toBe(true);
    expect(errorLogs.some(log => log.message.includes('Delayed error'))).toBe(true);
    expect(errorLogs.some(log => log.message.includes('Resource leak error'))).toBe(true);

    // Verify normal collector still completed
    expect(result.entries.length).toBeGreaterThan(0);
    expect(result.entries.some(e => e.content_type === 'FANDOM')).toBe(true);

    // Verify rate limiting still worked
    expect(result.stats.collection_duration).toBeLessThan(60);

    // Check resource cleanup
    expect(immediateErrorCollector.getResourceCount()).toBe(0);
    expect(delayedErrorCollector.getResourceCount()).toBe(0);
    // Resource leak collector intentionally leaves resources
    expect(resourceLeakCollector.getResourceCount()).toBe(1);

    // Verify system stability by making another request
    const secondResult = await testService.collectGameInformation('another test game');
    expect(secondResult.entries.some(e => e.content_type === 'FANDOM')).toBe(true);
  });
});
