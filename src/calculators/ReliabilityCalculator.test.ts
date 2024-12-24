import { ReliabilityCalculator } from './ReliabilityCalculator';

describe('ReliabilityCalculator', () => {
  let calculator: ReliabilityCalculator;

  beforeEach(() => {
    calculator = new ReliabilityCalculator();
  });

  describe('domain-based scoring', () => {
    it('should give high scores to known reliable gaming domains', () => {
      const reliableUrls = [
        'https://www.ign.com/articles/game-review',
        'https://www.gamespot.com/reviews/game-review',
        'https://www.fandom.com/games/specific-game',
      ];

      reliableUrls.forEach(url => {
        const score = calculator.calculateScore(url);
        expect(score).toBeGreaterThanOrEqual(8);
        expect(score).toBeLessThanOrEqual(10);
      });
    });

    it('should give medium scores to general gaming domains', () => {
      const mediumReliableUrls = [
        'https://www.eurogamer.net/article',
        'https://www.polygon.com/reviews',
        'https://www.rockpapershotgun.com/review',
      ];

      mediumReliableUrls.forEach(url => {
        const score = calculator.calculateScore(url);
        expect(score).toBeGreaterThanOrEqual(6);
        expect(score).toBeLessThanOrEqual(8);
      });
    });

    it('should give lower scores to user-generated content domains', () => {
      const userGeneratedUrls = [
        'https://www.reddit.com/r/gaming/comments',
        'https://steamcommunity.com/app/123/reviews',
        'https://www.youtube.com/watch?v=123',
      ];

      userGeneratedUrls.forEach(url => {
        const score = calculator.calculateScore(url);
        expect(score).toBeGreaterThanOrEqual(4);
        expect(score).toBeLessThanOrEqual(6);
      });
    });

    describe('unknown source handling', () => {
      it('should give exact default score (4) to unknown domains', () => {
        const unknownUrls = [
          'https://www.randomgamesite.com/review',
          'https://www.newgameblog.net/article',
        ];

        unknownUrls.forEach(url => {
          const score = calculator.calculateScore(url);
          expect(score).toBe(4);
        });
      });

      it('should handle unknown domains with subdomains consistently', () => {
        const baseUrl = 'https://randomgamesite.com/review';
        const subdomainUrl = 'https://blog.randomgamesite.com/review';
        
        const baseScore = calculator.calculateScore(baseUrl);
        const subdomainScore = calculator.calculateScore(subdomainUrl);
        
        expect(baseScore).toBe(subdomainScore);
        expect(baseScore).toBe(4);
      });

      it('should apply standard scoring factors to unknown domains', () => {
        const unknownSource = {
          url: 'https://randomgamesite.com/review',
          contentLength: 3000,
          publishDate: new Date()
        };

        const score = calculator.calculateScore(
          unknownSource.url,
          unknownSource.contentLength,
          unknownSource.publishDate
        );

        // Score should be higher than base 4 due to good content length and freshness
        expect(score).toBeGreaterThan(4);
        expect(score).toBeLessThan(7); // But still lower than medium reliability sites
      });

      it('should handle unusual unknown domain formats', () => {
        const unusualDomains = [
          'https://game.reviews.something.co.uk/article',
          'https://my-gaming-blog.io/review',
          'https://gaming.localhost/test',
          'https://127.0.0.1/review',
        ];

        unusualDomains.forEach(url => {
          const score = calculator.calculateScore(url);
          expect(score).toBe(4);
        });
      });
    });

    it('should handle invalid URLs gracefully', () => {
      const invalidUrls = [
        '',
        'not-a-url',
        'http://',
        null,
        undefined,
      ];

      invalidUrls.forEach(url => {
        // @ts-ignore for null/undefined test cases
        const score = calculator.calculateScore(url);
        expect(score).toBe(0);
      });
    });

    it('should consider subdomains when scoring', () => {
      const urls = [
        'https://reviews.ign.com/article',
        'https://games.gamespot.com/review',
        'https://gaming.stackexchange.com/questions',
      ];

      urls.forEach(url => {
        const score = calculator.calculateScore(url);
        expect(score).toBeGreaterThan(0);
      });
    });
  });

  describe('combined score calculation', () => {
    it('should calculate weighted scores based on domain, content length, and freshness', () => {
      const source = {
        url: 'https://www.ign.com/articles/game-review',
        contentLength: 2500,
        publishDate: new Date()
      };

      const score = calculator.calculateScore(
        source.url,
        source.contentLength,
        source.publishDate
      );

      expect(score).toBeGreaterThan(8);
      expect(score).toBeLessThanOrEqual(10);
    });

    it('should calculate average score for multiple sources', () => {
      const sources = [
        {
          url: 'https://www.ign.com/articles/game-review',
          contentLength: 2500,
          publishDate: new Date()
        },
        {
          url: 'https://www.gamespot.com/reviews/game-review',
          contentLength: 3000,
          publishDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days old
        },
        {
          url: 'https://www.reddit.com/r/gaming/comments',
          contentLength: 500,
          publishDate: new Date()
        }
      ];

      const combinedScore = calculator.calculateCombinedScore(sources);
      expect(combinedScore).toBeGreaterThan(5);
      expect(combinedScore).toBeLessThanOrEqual(9);
    });

    it('should handle missing optional parameters', () => {
      const sources = [
        { url: 'https://www.ign.com/articles/game-review' },
        { url: 'https://www.gamespot.com/reviews/game-review' }
      ];

      const combinedScore = calculator.calculateCombinedScore(sources);
      expect(combinedScore).toBeGreaterThan(7);
      expect(combinedScore).toBeLessThanOrEqual(10);
    });

    it('should handle empty source array', () => {
      const combinedScore = calculator.calculateCombinedScore([]);
      expect(combinedScore).toBe(0);
    });

    it('should handle array with all invalid sources', () => {
      const sources = [
        { url: 'invalid-url' },
        { url: '' },
        { url: 'not-a-url' }
      ];

      const combinedScore = calculator.calculateCombinedScore(sources);
      expect(combinedScore).toBe(0);
    });

    it('should penalize old content', () => {
      const oldSource = {
        url: 'https://www.ign.com/articles/game-review',
        contentLength: 2500,
        publishDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000) // 400 days old
      };

      const score = calculator.calculateScore(
        oldSource.url,
        oldSource.contentLength,
        oldSource.publishDate
      );

      const freshSource = {
        url: 'https://www.ign.com/articles/game-review',
        contentLength: 2500,
        publishDate: new Date()
      };

      const freshScore = calculator.calculateScore(
        freshSource.url,
        freshSource.contentLength,
        freshSource.publishDate
      );

      expect(score).toBeLessThan(freshScore);
    });
  });
});
