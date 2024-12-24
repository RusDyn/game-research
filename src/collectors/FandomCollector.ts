import { BaseCollector } from './BaseCollector'
import { GameData } from '../types/GameData'
import { logger } from '../utils/logger'

interface FandomResponse {
  success: boolean
  data?: {
    pages: Array<{
      id: number
      title: string
      abstract: string
      url: string
      sections: Array<{
        title: string
        level: number
        content: string
      }>
    }>
  }
  error?: {
    code: string
    message: string
  }
}

export class FandomCollector extends BaseCollector {
  constructor() {
    super('FANDOM')
  }

  async collect(gameName: string): Promise<GameDataEntry[]> {
    const data = await this.fetchData(gameName)
    return data.entries
  }

  protected async fetchData(gameName: string): Promise<GameData> {
    try {
      const response = await fetch(`https://api.fandom.com/api/v1/search?query=${encodeURIComponent(gameName)}`)
      
      if (!response.ok) {
        if (response.status === 429) {
          logger.error('Rate limit exceeded for Fandom API')
          return { entries: [] }
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json() as FandomResponse

      if (!data.success || !data.data) {
        if (data.error?.code === 'not_found') {
          logger.info(`No pages found for game: ${gameName}`)
        } else {
          logger.error('Invalid request to Fandom API', { error: data.error })
        }
        return { entries: [] }
      }

      const entries = []

      // Process each page
      for (const page of data.data.pages) {
        // Add abstract entry
        entries.push({
          content: page.abstract,
          url: page.url,
          reliability_score: this.calculateReliability(page.abstract),
          content_type: this.sourceType,
          collection_timestamp: new Date().toISOString(),
          text_length: page.abstract.length,
          site_specific: {
            section_type: 'abstract',
            publication_date: new Date().toISOString() // Fandom doesn't provide publication dates
          }
        })

        // Process sections
        for (const section of page.sections) {
          entries.push({
            content: section.content,
            url: `${page.url}#${section.title.toLowerCase().replace(/\s+/g, '_')}`,
            reliability_score: this.calculateReliability(section.content),
            content_type: this.sourceType,
            collection_timestamp: new Date().toISOString(),
            text_length: section.content.length,
            site_specific: {
              section_type: section.title.toLowerCase(),
              publication_date: new Date().toISOString()
            }
          })
        }
      }

      return { entries }
    } catch (error) {
      logger.error('Error fetching data from Fandom API', { error })
      return { entries: [] }
    }
  }

  protected calculateReliability(content: string): number {
    // Base score starts at 7 (Fandom is generally reliable for game info)
    let score = 7

    // Adjust based on content length
    if (content.length > 1000) score += 1
    if (content.length > 2000) score += 1

    // Adjust based on content structure
    if (content.includes('\n\n')) score += 0.5 // Well-formatted paragraphs
    if (/\[\[.*?\]\]/.test(content)) score += 0.5 // Contains wiki links

    // Cap at 10
    return Math.min(10, score)
  }
}
