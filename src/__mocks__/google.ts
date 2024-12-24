export const validSearchResponse = {
  kind: "customsearch#search",
  items: [
    {
      kind: "customsearch#result",
      title: "Test Game - Reviews, News, and Features | GameSpot",
      link: "https://www.gamespot.com/games/test-game/",
      snippet: "Test Game is an action-adventure game that redefines the genre with its innovative mechanics and stunning visuals...",
      pagemap: {
        metatags: [
          {
            "og:type": "article",
            "article:published_time": "2023-01-15T08:00:00Z"
          }
        ]
      }
    },
    {
      kind: "customsearch#result",
      title: "Test Game Review - IGN",
      link: "https://www.ign.com/games/test-game/review",
      snippet: "Our verdict on Test Game, the latest blockbuster release that combines storytelling mastery with engaging gameplay...",
      pagemap: {
        metatags: [
          {
            "og:type": "article",
            "article:published_time": "2023-01-20T10:30:00Z"
          }
        ]
      }
    },
    {
      kind: "customsearch#result",
      title: "Test Game Wiki | Gaming Database",
      link: "https://gaming.fandom.com/wiki/Test_Game",
      snippet: "Everything you need to know about Test Game, including gameplay mechanics, story details, and development history...",
      pagemap: {
        metatags: [
          {
            "og:type": "website",
            "article:modified_time": "2023-02-01T15:45:00Z"
          }
        ]
      }
    }
  ],
  searchInformation: {
    searchTime: 0.3,
    totalResults: "15400",
    formattedTotalResults: "15,400"
  }
}

export const nonExistentGameResponse = {
  kind: "customsearch#search",
  items: [],
  searchInformation: {
    searchTime: 0.2,
    totalResults: "0",
    formattedTotalResults: "0"
  }
}

export const rateLimitResponse = {
  error: {
    code: 429,
    message: "Quota exceeded for quota metric 'Queries' and limit 'Queries per day'",
    errors: [
      {
        message: "Quota exceeded for quota metric 'Queries' and limit 'Queries per day'",
        domain: "usageLimits",
        reason: "quotaExceeded"
      }
    ],
    status: "RESOURCE_EXHAUSTED"
  }
}

export const malformedResponse = {
  error: {
    code: 400,
    message: "Invalid search request",
    errors: [
      {
        message: "Invalid search request",
        domain: "global",
        reason: "invalid"
      }
    ],
    status: "INVALID_ARGUMENT"
  }
}
