import { BaseCollector } from './BaseCollector';
import { GameDataEntry, ContentType } from '../types/GameData';

class TestCollector extends BaseCollector {
  constructor() {
    super('TEST' as ContentType);
  }

  async collect(gameName: string): Promise<GameDataEntry[]> {
    const entry: GameDataEntry = {
      content: `Test content for ${gameName}`,
      url: `https://test.com/games/${gameName}`,
      reliability_score: 8.5,
      content_type: this.sourceType,
      collection_timestamp: new Date(),
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

  it('should implement rate limiting', async () => {
    const startTime = Date.now();
    await Promise.all([
      collector.collect('game1'),
      collector.collect('game2'),
      collector.collect('game3'),
      collector.collect('game4'),
      collector.collect('game5'),
      collector.collect('game6')
    ]);
    const duration = Date.now() - startTime;
    
    // With 5 requests per second rate limit, 6 requests should take at least 1 second
    expect(duration).toBeGreaterThanOrEqual(1000);
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
      collection_timestamp: expect.any(Date),
      text_length: expect.any(Number),
      site_specific: expect.any(Object)
    });
  });
});
