# Game Content Discovery Service - Phase 1 Test Implementation TODO

## 1. Remove/Update Existing Tests
- [ ] Review existing collector tests
- [ ] Remove API-specific tests (since we're using FireCrawl)
- [ ] Remove browser-specific tests
- [ ] Update reliability calculator tests to match new approach

## 2. Base FireCrawl Tests
- [ ] Test basic FireCrawl configuration
  * Test initialization
  * Test basic URL processing
  * Test response format (HTML, markdown, metadata, links)
- [ ] Test rate limiting
  * Test delay between requests
  * Test concurrent requests handling
- [ ] Test error scenarios
  * Test network errors
  * Test invalid URLs
  * Test timeout handling

## 3. Fandom Wiki Discovery Tests
- [ ] Test wiki domain finder
  * Test exact match (game-name.fandom.com)
  * Test with spaces ("God of War" → "godofwar.fandom.com")
  * Test with special characters ("Assassin's Creed" variations)
  * Test non-existent wiki handling
  * Test redirects
  * Test alternate naming patterns
- [ ] Test wiki content discovery
  * Test main page link extraction
  * Test Special:AllPages processing
  * Test navigation through sections
  * Test handling of different page types
  * Test pagination processing

## 4. Search Results Tests (IGN, Gamespot, YouTube)
- [ ] Test Google search results processing
  * Test query construction
  * Test result extraction
  * Test URL validation
  * Test site-specific filtering
- [ ] Test URL pattern matching
  * Test IGN article patterns
  * Test Gamespot article patterns
  * Test YouTube video patterns

## 5. Results Processing Tests
- [ ] Test URL deduplication
  * Test exact duplicates
  * Test similar URLs
  * Test different protocols (http/https)
- [ ] Test URL categorization
  * Test priority assignment
  * Test content type detection
  * Test relevance scoring

## 6. Integration Tests
- [ ] Test complete discovery flow
  * Test with known game
  * Test with non-existent game
  * Test with game having multiple wikis
- [ ] Test error handling
  * Test partial failures
  * Test recovery scenarios
  * Test timeout handling

## Test Data Needed
```
games_test_data = [
    {
        "name": "God of War",
        "expected_wiki": "godofwar.fandom.com",
        "expected_sections": ["wiki", "category"],
        "alternative_names": ["GOW", "God of War (2018)"]
    },
    {
        "name": "Assassin's Creed",
        "expected_wiki": "assassinscreed.fandom.com",
        "expected_sections": ["wiki", "category"],
        "special_characters": true
    }
    // Add more test cases
]
```

## Mock Data Needed
- [ ] Sample Fandom HTML pages
- [ ] Sample Google search results
- [ ] Sample article pages
- [ ] Error response samples

## Test Environment Setup
- [ ] Configure test timeouts
- [ ] Set up rate limiting parameters
- [ ] Configure mock responses
- [ ] Set up error simulation

## Success Criteria for Tests
- [ ] All tests should be independent
- [ ] Tests should handle async operations correctly
- [ ] Tests should cover edge cases
- [ ] Tests should validate error handling
- [ ] Tests should verify rate limiting
- [ ] Tests should check data integrity
