export const validGameResponse = {
  articles: [
    {
      articleId: "abc123",
      metadata: {
        title: "Test Game Review",
        slug: "test-game-review",
        publishDate: "2023-01-01T00:00:00Z",
        author: "John Doe"
      },
      content: {
        body: "Test Game brings innovative gameplay mechanics...",
        snippets: ["Stunning visuals", "Engaging story"]
      },
      url: "https://www.ign.com/articles/test-game-review"
    },
    {
      articleId: "def456",
      metadata: {
        title: "Test Game Preview",
        slug: "test-game-preview",
        publishDate: "2022-12-01T00:00:00Z",
        author: "Jane Smith"
      },
      content: {
        body: "Our first hands-on with Test Game reveals...",
        snippets: ["Promising mechanics", "Beautiful world design"]
      },
      url: "https://www.ign.com/articles/test-game-preview"
    }
  ],
  pagination: {
    total: 2,
    currentPage: 1,
    totalPages: 1
  }
}

export const emptyGameResponse = {
  articles: [],
  pagination: {
    total: 0,
    currentPage: 1,
    totalPages: 0
  }
}

export const errorResponse = {
  error: {
    code: 500,
    message: "Internal server error"
  }
}

export const rateLimitResponse = {
  error: {
    code: 429,
    message: "Too many requests. Please try again later.",
    details: {
      retryAfter: 60 // seconds
    }
  }
}

export const malformedRequestResponse = {
  error: {
    code: 400,
    message: "Invalid request parameters",
    details: {
      errors: ["Invalid game name format", "Missing required fields"]
    }
  }
}

export const authenticationErrorResponse = {
  error: {
    code: 401,
    message: "Authentication failed",
    details: {
      reason: "Invalid or expired API key"
    }
  }
}

export const timeoutErrorResponse = {
  error: {
    code: 504,
    message: "Request timed out",
    details: {
      timeout: 30, // seconds
      suggestion: "Try again with a more specific query"
    }
  }
}
