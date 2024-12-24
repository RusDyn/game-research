import { BaseCollector } from './BaseCollector';
import { GameDataEntry } from '../types/GameData';

interface IGNArticle {
  articleId: string;
  metadata: {
    title: string;
    slug: string;
    publishDate: string;
    author: string;
  };
  content: {
    body: string;
    snippets: string[];
  };
  url: string;
}

interface IGNResponse {
  articles: IGNArticle[];
  pagination: {
    total: number;
    currentPage: number;
    totalPages: number;
  };
}

export class IGNCollector extends BaseCollector {
  private isIGNResponse(data: any): data is IGNResponse {
    return (
      typeof data === 'object' &&
      data !== null &&
      Array.isArray(data.articles) &&
      typeof data.pagination === 'object' &&
      data.pagination !== null &&
      typeof data.pagination.total === 'number' &&
      typeof data.pagination.currentPage === 'number' &&
      typeof data.pagination.totalPages === 'number'
    );
  }

  constructor() {
    super('IGN');
  }

  async collect(gameName: string): Promise<GameDataEntry[]> {
    await this.rateLimit();

    const encodedGame = encodeURIComponent(gameName);
    const response = await fetch(`https://api.ign.com/v1/articles?q=${encodedGame}`);

    if (!response.ok) {
      throw new Error(`IGN API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!this.isIGNResponse(data)) {
      throw new Error('Invalid IGN API response format');
    }

    const entries: GameDataEntry[] = [];

    for (const article of data.articles) {
      const entry: GameDataEntry = {
        content: article.content.body,
        url: article.url,
        reliability_score: 8, // IGN is a reputable gaming news source
        content_type: this.sourceType,
        collection_timestamp: new Date().toISOString(),
        text_length: article.content.body.length,
        site_specific: {
          author: article.metadata.author,
          publication_date: article.metadata.publishDate
        }
      };

      this.validateEntry(entry);
      entries.push(entry);
    }

    return entries;
  }
}
