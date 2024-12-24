import { ContentType, GameDataEntry } from '../types/GameData';

export abstract class BaseCollector {
  protected sourceType: ContentType;
  private lastRequestTime: number = 0;
  private readonly minRequestInterval: number = 200; // 5 requests per second = 200ms between requests

  constructor(sourceType: ContentType) {
    this.sourceType = sourceType;
  }

  protected async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
  }

  protected validateEntry(entry: GameDataEntry): void {
    if (!entry.content) throw new Error('Entry must have content');
    if (!entry.url) throw new Error('Entry must have URL');
    if (entry.reliability_score < 0 || entry.reliability_score > 10) {
      throw new Error('Reliability score must be between 0 and 10');
    }
    if (entry.content_type !== this.sourceType) {
      throw new Error('Entry content type must match collector source type');
    }
  }

  abstract collect(gameName: string): Promise<GameDataEntry[]>;
}
