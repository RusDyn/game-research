export const validGameResponse = {
  success: true,
  data: {
    pages: [
      {
        id: 12345,
        title: "Test Game",
        abstract: "Test Game is an action-adventure video game...",
        url: "https://gaming.fandom.com/wiki/Test_Game",
        sections: [
          {
            title: "Gameplay",
            level: 1,
            content: "The game features an open world environment..."
          },
          {
            title: "Story",
            level: 1,
            content: "The story follows the main character..."
          },
          {
            title: "Development",
            level: 1,
            content: "Development began in 2020..."
          }
        ]
      }
    ]
  }
}

export const nonExistentGameResponse = {
  success: false,
  error: {
    code: "not_found",
    message: "No pages found matching the query"
  }
}

export const rateLimitResponse = {
  success: false,
  error: {
    code: "rate_limit_exceeded",
    message: "API rate limit has been exceeded"
  }
}

export const malformedResponse = {
  success: false,
  error: {
    code: "bad_request",
    message: "Invalid request parameters"
  }
}
