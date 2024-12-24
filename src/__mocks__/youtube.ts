export const validSearchResponse = {
  items: [
    {
      id: {
        kind: "youtube#video",
        videoId: "abc123"
      },
      snippet: {
        publishedAt: "2023-01-01T00:00:00Z",
        channelId: "UC123456",
        title: "Test Game Review - An In-Depth Look",
        description: "A comprehensive review of Test Game...",
        channelTitle: "GameReviewer",
        thumbnails: {
          default: {
            url: "https://i.ytimg.com/vi/abc123/default.jpg"
          }
        }
      },
      contentDetails: {
        duration: "PT15M30S" // 15 minutes 30 seconds
      }
    },
    {
      id: {
        kind: "youtube#video",
        videoId: "def456"
      },
      snippet: {
        publishedAt: "2023-01-15T00:00:00Z",
        channelId: "UC789012",
        title: "Test Game Gameplay Walkthrough",
        description: "Complete walkthrough of Test Game...",
        channelTitle: "GameGuides",
        thumbnails: {
          default: {
            url: "https://i.ytimg.com/vi/def456/default.jpg"
          }
        }
      },
      contentDetails: {
        duration: "PT25M45S" // 25 minutes 45 seconds
      }
    }
  ],
  pageInfo: {
    totalResults: 2,
    resultsPerPage: 10
  }
}

export const validTranscriptResponse = {
  videoId: "abc123",
  transcript: [
    {
      text: "Welcome to our review of Test Game",
      start: 0.0,
      duration: 2.5
    },
    {
      text: "The gameplay mechanics are innovative",
      start: 2.5,
      duration: 3.0
    },
    {
      text: "Graphics are stunning and well optimized",
      start: 5.5,
      duration: 2.8
    }
  ]
}

export const emptySearchResponse = {
  items: [],
  pageInfo: {
    totalResults: 0,
    resultsPerPage: 10
  }
}

export const noTranscriptResponse = {
  error: {
    code: 404,
    message: "No transcript available for this video"
  }
}

export const quotaExceededResponse = {
  error: {
    code: 403,
    message: "The request cannot be completed because you have exceeded your quota."
  }
}

export const invalidApiKeyResponse = {
  error: {
    code: 400,
    message: "API key not valid. Please pass a valid API key."
  }
}
