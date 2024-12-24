import { BaseCollector } from './BaseCollector';
import { GameDataEntry } from '../types/GameData';

interface GamespotArticle {
  id: number;
  title: string;
  deck: string;
  body: string;
  authors: string;
  publish_date: string;
  site_detail_url: string;
  categories: {
    name: string;
  };
}

interface GamespotResponse {
  results: GamespotArticle[];
  limit: number;
  offset: number;
  total: number;
}

export class GamespotCollector extends BaseCollector {
  private readonly ALLOWED_CATEGORIES = ['Reviews', 'Previews'];

  private isGamespotResponse(data: any): data is GamespotResponse {
    return (
      typeof data === 'object' &&
      data !== null &&
      Array.isArray(data.results) &&
      typeof data.limit === 'number' &&
      typeof data.offset === 'number' &&
      typeof data.total === 'number'
    );
  }

  constructor() {
    super('GAMESPOT');
  }

  async collect(gameName: string): Promise<GameDataEntry[]> {
    await this.rateLimit();

    const encodedGame = encodeURIComponent(gameName);
    const response = await fetch(`https://www.gamespot.com/api/articles/?q=${encodedGame}`);

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('API rate limit exceeded');
      }
      throw new Error(`Internal server error`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!this.isGamespotResponse(data)) {
      throw new Error('Invalid Gamespot API response format');
    }

    const entries: GameDataEntry[] = [];

    for (const article of data.results) {
      // Filter out articles that aren't reviews or previews
      if (!this.ALLOWED_CATEGORIES.includes(article.categories.name)) {
        continue;
      }

      const entry: GameDataEntry = {
        content: article.body,
        url: article.site_detail_url,
        reliability_score: 7.5, // Gamespot is a well-established gaming site
        content_type: this.sourceType,
        collection_timestamp: new Date().toISOString(),
        text_length: article.body.length,
        site_specific: {
          author: article.authors,
          publication_date: article.publish_date,
          section_type: article.categories.name
        }
      };

      this.validateEntry(entry);
      entries.push(entry);
    }

    return entries;
  }
}
