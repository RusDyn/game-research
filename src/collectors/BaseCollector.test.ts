import { BaseCollector } from './BaseCollector';
import { GameDataEntry, ContentType } from '../types/GameData';
import 'jest'; // Add this import

class TestCollector extends BaseCollector {
  constructor() {
    super('TEST' as ContentType);
  }

  async collect(gameName: string): Promise<GameDataEntry[]> {
    await this.rateLimit();
    const entry: GameDataEntry = {
      content: `Test content for ${gameName}`,
      url: `https://test.com/games/${gameName}`,
      reliability_score: 8.5,
      content_type: this.sourceType,
      collection_timestamp: new Date().toISOString(),
      text_length: 20,
      site_specific: {
        section_type: 'test',
        author: 'test_author'
      }
    };
    return [entry];
  }
}

describe('BaseCollector', () => {
  let collector: TestCollector;

  beforeEach(() => {
    collector = new TestCollector();
  });

  it('should initialize with correct source type', () => {
    // Test through the collect method since sourceType is protected
    return collector.collect('test').then(entries => {
      expect(entries[0].content_type).toBe('TEST');
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

    it('should implement rate limiting', async () => {
      const requests = ['game1', 'game2', 'game3', 'game4', 'game5', 'game6'].map(game => {
        currentTime += 200; // Simulate time passing
        return collector.collect(game);
      });
      
      await Promise.all(requests);
      expect(dateNowSpy).toHaveBeenCalledTimes(12); // Each request calls Date.now() twice
    });
  });

  it('should return valid game data entries', async () => {
    const gameName = 'TestGame';
    const entries = await collector.collect(gameName);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      content: expect.any(String),
      url: expect.any(String),
      reliability_score: expect.any(Number),
      content_type: 'TEST',
      collection_timestamp: expect.any(String),
      text_length: expect.any(Number),
      site_specific: expect.any(Object)
    });
  });
});
