export class ReliabilityCalculator {
  // Weight factors for different aspects of reliability
  private readonly weightFactors = {
    domainScore: 0.7,    // Domain reputation weight
    contentLength: 0.15,  // Content length weight
    freshness: 0.15      // Content freshness weight
  };

  private readonly domainScores: Map<string, number> = new Map([
    // High reliability gaming sites
    ['ign.com', 9],
    ['gamespot.com', 9],
    ['fandom.com', 8],
    
    // Medium reliability gaming sites
    ['eurogamer.net', 7],
    ['polygon.com', 7],
    ['rockpapershotgun.com', 7],
    
    // User-generated content sites
    ['reddit.com', 5],
    ['steamcommunity.com', 5],
    ['youtube.com', 5],
  ]);

  private readonly defaultScore = 4;
  private readonly minContentLength = 100;   // Minimum content length for full score
  private readonly maxContentLength = 5000;  // Maximum content length considered
  private readonly maxAgeDays = 365;        // Maximum age in days for freshness score

  calculateScore(url: string, contentLength?: number, publishDate?: Date): number {
    if (!url) return 0;

    try {
      const urlObj = new URL(url);
      const domain = this.extractDomain(urlObj.hostname);
      const domainScore = this.domainScores.get(domain) ?? this.defaultScore;
      
      // If no additional parameters, return pure domain score
      if (!contentLength && !publishDate) {
        return domainScore;
      }
      
      // Calculate content length score if provided
      const lengthScore = contentLength ? this.calculateLengthScore(contentLength) : 1;
      
      // Calculate freshness score if publish date provided
      const freshnessScore = publishDate ? this.calculateFreshnessScore(publishDate) : 1;

      // Combine scores using weight factors only when additional parameters are provided
      return (
        domainScore * this.weightFactors.domainScore +
        lengthScore * this.weightFactors.contentLength +
        freshnessScore * this.weightFactors.freshness
      ) * (10 / 7); // Scale back up to 10-point scale since weights sum to 0.7
    } catch (error) {
      return 0;
    }
  }

  calculateCombinedScore(sources: Array<{ url: string, contentLength?: number, publishDate?: Date }>): number {
    if (!sources.length) return 0;

    const validScores = sources
      .map(source => this.calculateScore(source.url, source.contentLength, source.publishDate))
      .filter(score => score > 0);

    if (!validScores.length) return 0;

    return validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
  }

  private calculateLengthScore(length: number): number {
    if (length < this.minContentLength) return 0.5;
    if (length > this.maxContentLength) return 1;
    return 0.5 + (0.5 * (length - this.minContentLength) / (this.maxContentLength - this.minContentLength));
  }

  private calculateFreshnessScore(publishDate: Date): number {
    const ageInDays = (new Date().getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays > this.maxAgeDays) return 0.5;
    return 1 - (0.5 * ageInDays / this.maxAgeDays);
  }

  private extractDomain(hostname: string): string {
    // Extract base domain from hostname (e.g., "reviews.ign.com" -> "ign.com")
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      return parts.slice(-2).join('.');
    }
    return hostname;
  }
}
