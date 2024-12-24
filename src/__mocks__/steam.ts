export const validGameResponse = {
  success: true,
  data: {
    game: {
      steam_appid: 12345,
      name: "Test Game",
      detailed_description: "Test Game is an immersive action-adventure experience...",
      about_the_game: "Embark on an epic journey...",
      short_description: "Action-adventure game with stunning visuals",
      supported_languages: "English, Spanish, French, German",
      reviews: {
        review_score: 8,
        review_score_desc: "Very Positive",
        total_reviews: 1500,
        reviews: [
          {
            review: "One of the best games I've played this year...",
            author: "SteamUser123",
            helpful_count: 150,
            timestamp: "2023-05-15T10:30:00Z"
          }
        ]
      },
      categories: [
        {
          id: 1,
          description: "Single-player"
        },
        {
          id: 2,
          description: "Multi-player"
        }
      ],
      genres: [
        {
          id: 1,
          description: "Action"
        },
        {
          id: 2,
          description: "Adventure"
        }
      ],
      release_date: {
        coming_soon: false,
        date: "2023-01-15"
      }
    }
  }
}

export const nonExistentGameResponse = {
  success: false,
  error: {
    code: "not_found",
    message: "No game found with the specified name or ID"
  }
}

export const rateLimitResponse = {
  success: false,
  error: {
    code: "rate_limit_exceeded",
    message: "Too many requests. Please try again later."
  }
}

export const malformedResponse = {
  success: false,
  error: {
    code: "bad_request",
    message: "Invalid request parameters or malformed request"
  }
}
