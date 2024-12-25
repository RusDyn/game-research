export type ContentType = 'FANDOM' | 'IGN' | 'GAMESPOT' | 'YOUTUBE' | 'STEAM' | 'OTHER' | 'TEST' | 'TEST1' | 'TEST2';

export interface GameDataEntry {
  content: string
  url: string
  reliability_score: number
  content_type: ContentType
  collection_timestamp: string
  text_length: number
  site_specific: {
    section_type?: string
    author?: string
    publication_date?: string
  }
}

export interface GameDataResponse {
  game_name: string
  collection_timestamp: string
  entries: GameDataEntry[]
  stats: {
    total_entries: number
    entries_by_type: Record<string, number>
    average_reliability: number
    collection_duration: number
  }
}

export interface GameData {
  entries: GameDataEntry[]
}
