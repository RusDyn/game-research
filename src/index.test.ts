import { GameInformationService } from './index';
import { BaseCollector } from './collectors/BaseCollector';
import { GameDataEntry, ContentType } from './types/GameData';

class MockCollector extends BaseCollector {
  constructor(private mockData: GameDataEntry[]) {
    super('FANDOM' as ContentType);
  }

  async collect(): Promise<GameDataEntry[]> {
    await this.rateLimit();
    return this.mockData;
  }
}

describe('GameInformationService', () => {
  let service: GameInformationService;
  let mockEntry: GameDataEntry;

  beforeEach(() => {
    service = new GameInformationService();
    mockEntry = {
      content: 'Test game content',
      url: 'https://test.com/game',
      reliability_score: 8.5,
      content_type: 'FANDOM',
      collection_timestamp: new Date(),
      text_length: 100,
      site_specific: {
        section_type: 'overview',
        author: 'test_author'
      }
    };
  });

  it('should register collectors', () => {
    const collector = new MockCollector([mockEntry]);
    service.registerCollector(collector);
    expect(service['collectors']).toHaveLength(1);
  });

  it('should collect game information from all registered collectors', async () => {
    const collector1 = new MockCollector([mockEntry]);
    const collector2 = new MockCollector([
      {
        ...mockEntry,
        content: 'Different content',
        url: 'https://test.com/game2'
      }
    ]);

    service.registerCollector(collector1);
    service.registerCollector(collector2);

    const result = await service.collectGameInformation('Test Game');

    expect(result.entries).toHaveLength(2);
    expect(result.game_name).toBe('Test Game');
    expect(result.stats.total_entries).toBe(2);
    expect(result.stats.average_reliability).toBe(8.5);
    expect(result.stats.entries_by_type.FANDOM).toBe(2);
  });

  it('should handle empty collector list', async () => {
    const result = await service.collectGameInformation('Test Game');

    expect(result.entries).toHaveLength(0);
    expect(result.stats.total_entries).toBe(0);
    expect(result.stats.average_reliability).toBe(0);
  });

  it('should handle collector errors gracefully', async () => {
    const workingCollector = new MockCollector([mockEntry]);
    const failingCollector = new MockCollector([]);
    failingCollector.collect = async () => {
      throw new Error('Collection failed');
    };

    service.registerCollector(workingCollector);
    service.registerCollector(failingCollector);

    const result = await service.collectGameInformation('Test Game');

    // Should still get results from working collector
    expect(result.entries).toHaveLength(1);
    expect(result.stats.total_entries).toBe(1);
  });
});
