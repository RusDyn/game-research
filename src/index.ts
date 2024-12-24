import { GameDataResponse, GameDataEntry } from './types/GameData';
import { BaseCollector } from './collectors/BaseCollector';

class GameInformationService {
  private collectors: BaseCollector[] = [];

  registerCollector(collector: BaseCollector): void {
    this.collectors.push(collector);
  }

  async collectGameInformation(gameName: string): Promise<GameDataResponse> {
    const startTime = Date.now();
    let entries: GameDataEntry[] = [];

    // Collect data from all registered collectors
    const collectionPromises = this.collectors.map(collector => 
      collector.collect(gameName)
        .then(collectorEntries => entries.push(...collectorEntries))
        .catch(error => console.error(`Error collecting from ${collector.constructor.name}:`, error))
    );

    await Promise.all(collectionPromises);

    // Remove duplicates before calculating stats
    entries = this.removeDuplicates(entries);

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // Convert to seconds

    // Calculate statistics
    const stats = this.calculateStats(entries, duration);

    return {
      game_name: gameName,
      collection_timestamp: new Date(),
      entries,
      stats
    };
  }

  private removeDuplicates(entries: GameDataEntry[]): GameDataEntry[] {
    // First, remove exact duplicates (same URL)
    const urlMap = new Map<string, GameDataEntry>();
    
    entries.forEach(entry => {
      if (!urlMap.has(entry.url) || entry.reliability_score > urlMap.get(entry.url)!.reliability_score) {
        urlMap.set(entry.url, entry);
      }
    });

    // Then handle same content from different URLs
    const contentMap = new Map<string, GameDataEntry>();
    
    Array.from(urlMap.values()).forEach(entry => {
      if (!contentMap.has(entry.content) || entry.reliability_score > contentMap.get(entry.content)!.reliability_score) {
        contentMap.set(entry.content, entry);
      }
    });

    return Array.from(contentMap.values());
  }

  private calculateStats(entries: GameDataEntry[], duration: number) {
    const entriesByType = entries.reduce((acc, entry) => {
      acc[entry.content_type] = (acc[entry.content_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalReliability = entries.reduce((sum, entry) => sum + entry.reliability_score, 0);

    return {
      total_entries: entries.length,
      entries_by_type: entriesByType,
      average_reliability: entries.length > 0 ? totalReliability / entries.length : 0,
      collection_duration: duration
    };
  }
}

export { GameInformationService };

// Example usage:
// const service = new GameInformationService();
// service.registerCollector(new FandomCollector());
// service.registerCollector(new IGNCollector());
// const result = await service.collectGameInformation("The Last of Us");
