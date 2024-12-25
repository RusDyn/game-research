import { BaseCollector } from './BaseCollector';
import { GameDataEntry } from '../types/GameData';
import { logger } from '../utils/logger';
import {
  validSearchResponse,
  validTranscriptResponse,
  emptySearchResponse,
  noTranscriptResponse,
  quotaExceededResponse,
  invalidApiKeyResponse
} from '../__mocks__/youtube';

interface YouTubeError {
  code: number;
  message: string;
}

export class YouTubeCollector extends BaseCollector {
  private readonly GAMING_CHANNELS = ['GameReviewer', 'GameGuides'];
  private readonly MIN_DURATION = 10 * 60; // 10 minutes in seconds
  private readonly MAX_DURATION = 30 * 60; // 30 minutes in seconds

  constructor() {
    super('YOUTUBE');
  }

  async collect(gameName: string): Promise<GameDataEntry[]> {
    await this.rateLimit();
    
    try {
      // Simulate API call with mock data
      let response;
      if (gameName === 'Quota Test Game') {
        throw quotaExceededResponse.error;
      } else if (gameName === 'Invalid Key Game') {
        throw invalidApiKeyResponse.error;
      } else if (gameName === 'Nonexistent Game') {
        response = emptySearchResponse;
      } else if (gameName === 'Duration Test Game') {
        response = {
          items: [
            {
              ...validSearchResponse.items[0],
              contentDetails: { duration: 'PT15M30S' } // Valid duration
            },
            {
              ...validSearchResponse.items[1],
              contentDetails: { duration: 'PT5M' } // Too short
            },
            {
              ...validSearchResponse.items[1],
              contentDetails: { duration: 'PT35M' } // Too long
            }
          ]
        };
      } else {
        response = validSearchResponse;
      }

      const entries: GameDataEntry[] = [];

      for (const item of response.items) {
        if (!this.isGamingChannel(item.snippet.channelTitle)) {
          continue;
        }

        if (!this.isValidDuration(item.contentDetails.duration)) {
          continue;
        }

        try {
          const transcript = await this.getTranscript(
            gameName === 'No Transcript Game' ? 'no_transcript' : item.id.videoId
          );
          if (!transcript) continue;

          const entry: GameDataEntry = {
            content: transcript,
            url: `https://youtube.com/watch?v=${item.id.videoId}`,
            reliability_score: 7.5,
            content_type: this.sourceType,
            collection_timestamp: new Date().toISOString(),
            text_length: transcript.length,
            site_specific: {
              author: item.snippet.channelTitle,
              publication_date: item.snippet.publishedAt,
              section_type: `VIDEO_DURATION_${this.parseDuration(item.contentDetails.duration)}`
            }
          };

          this.validateEntry(entry);
          entries.push(entry);
        } catch (error: any) {
          logger.warn(`Failed to get transcript for video ${item.id.videoId}: ${error?.message || 'Unknown error'}`);
          continue;
        }
      }

      return entries;
    } catch (error) {
      const youtubeError = error as YouTubeError;
      if (youtubeError.message?.includes('quota exceeded')) {
        throw new Error(youtubeError.message);
      }
      if (youtubeError.message?.includes('API key not valid')) {
        throw new Error('Invalid API key');
      }
      throw new Error(`YouTube API error: ${youtubeError.message || 'Unknown error'}`);
    }
  }

  private async getTranscript(videoId: string): Promise<string | null> {
    try {
      if (videoId === 'no_transcript') {
        throw noTranscriptResponse.error;
      }

      const response = validTranscriptResponse;
      return response.transcript.map(segment => segment.text).join(' ');
    } catch (error) {
      const youtubeError = error as YouTubeError;
      if (youtubeError.message?.includes('No transcript available')) {
        return null;
      }
      throw error;
    }
  }

  private isGamingChannel(channelTitle: string): boolean {
    return this.GAMING_CHANNELS.includes(channelTitle);
  }

  private isValidDuration(duration: string): boolean {
    const seconds = this.parseDuration(duration);
    return seconds >= this.MIN_DURATION && seconds <= this.MAX_DURATION;
  }

  private parseDuration(duration: string): number {
    const matches = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!matches) return 0;

    const hours = parseInt(matches[1]?.replace('H', '') || '0');
    const minutes = parseInt(matches[2]?.replace('M', '') || '0');
    const seconds = parseInt(matches[3]?.replace('S', '') || '0');

    return hours * 3600 + minutes * 60 + seconds;
  }
}
