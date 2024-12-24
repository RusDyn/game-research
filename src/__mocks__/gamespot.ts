export const validGameResponse = {
  results: [
    {
      id: 123,
      title: "Test Game Review",
      deck: "A comprehensive review of Test Game",
      body: "Test Game sets new standards for the genre...",
      authors: "Mike Johnson",
      publish_date: "2023-01-15T12:00:00Z",
      site_detail_url: "https://www.gamespot.com/reviews/test-game-review/1900-1234567/",
      categories: {
        name: "Reviews"
      }
    },
    {
      id: 456,
      title: "Test Game Preview",
      deck: "First look at Test Game",
      body: "Our early impressions of Test Game show promise...",
      authors: "Sarah Williams",
      publish_date: "2022-12-15T12:00:00Z",
      site_detail_url: "https://www.gamespot.com/previews/test-game-preview/1900-1234568/",
      categories: {
        name: "Previews"
      }
    }
  ],
  limit: 10,
  offset: 0,
  total: 2
}

export const emptyGameResponse = {
  results: [],
  limit: 10,
  offset: 0,
  total: 0
}

export const rateLimitResponse = {
  error: "API rate limit exceeded",
  status: 429
}

export const serverErrorResponse = {
  error: "Internal server error",
  status: 500
}
