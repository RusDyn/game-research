# Game Information Collector Microservice - Developer TODO

## Overview
Microservice that collects game information from multiple sources and returns structured data with reliability scores.

## Input/Output
- **Input**: Game name (string)
- **Output**: JSON with collected texts, sources, reliability scores, and metadata

## Development Approach
Test-Driven Development (TDD) - implement tests first, then features.

## Phase 1: Test Implementation

### 1. Set Up Test Environment
- [ ] Configure test framework
- [ ] Set up mock server
- [ ] Create test database configuration
- [ ] Prepare logging for tests

### 2. Create Mock Data
- [ ] Fandom API responses
- [ ] IGN API responses
- [ ] Gamespot API responses
- [ ] YouTube API responses
- [ ] Steam content responses
- [ ] Google Search results
- [ ] Error response scenarios

### 3. Implement Unit Tests

#### Source Collector Tests
- [ ] Fandom Collector tests
  - Valid game scenarios
  - Non-existent game handling
  - Section extraction verification
  - Rate limiting tests
  - Error handling tests

- [ ] IGN Collector tests
  - Article retrieval tests
  - Content filtering tests
  - API error handling

- [ ] Gamespot Collector tests
  - Article retrieval tests
  - Content type filtering
  - Rate limiting tests

- [ ] YouTube Collector tests
  - Transcript extraction tests
  - Channel filtering tests
  - Duration filtering tests

#### Reliability Calculator Tests
- [ ] Domain-based scoring tests
- [ ] Combined score calculation tests
- [ ] Unknown source handling tests

### 4. Implement Integration Tests
- [ ] Multi-source collection tests
- [ ] Duplicate removal tests
- [ ] Rate limiting integration tests
- [ ] Error cascade tests

### 5. Performance Tests
- [ ] Response time tests (60s limit)
- [ ] Concurrent request handling
- [ ] Memory usage tests
- [ ] Cache effectiveness tests

## Phase 2: Feature Implementation

### 1. Core Collectors
- [ ] Implement Fandom collector
  - API integration
  - Content extraction
  - Rate limiting

- [ ] Implement IGN collector
  - API integration
  - Article filtering
  - Content extraction

- [ ] Implement Gamespot collector
  - Search implementation
  - Content filtering
  - Rate limiting

- [ ] Implement YouTube collector
  - API integration
  - Transcript extraction
  - Channel filtering

### 2. Support Systems
- [ ] Implement reliability calculator
- [ ] Set up rate limiting system
- [ ] Create caching layer
- [ ] Implement error handling

### 3. API Response Handler
- [ ] Create response formatter
- [ ] Implement statistics calculator
- [ ] Add source attribution
- [ ] Set up content validation

## Technical Requirements

### Rate Limits
- Maximum 5 requests per second per source
- Cache responses for 24 hours
- Maximum collection time: 60 seconds

### Response Format
```json
{
    "game_name": "string",
    "collection_timestamp": "datetime",
    "entries": [
        {
            "content": "string",
            "url": "string",
            "reliability_score": float,
            "content_type": "enum",
            "collection_timestamp": "datetime",
            "text_length": int,
            "site_specific": {
                "section_type": "string",
                "author": "string",
                "publication_date": "datetime"
            }
        }
    ],
    "stats": {
        "total_entries": int,
        "entries_by_type": {
            "FANDOM": int,
            "IGN": int,
            "GAMESPOT": int,
            "POLYGON": int,
            "STEAM": int,
            "OTHER": int
        },
        "average_reliability": float,
        "collection_duration": float
    }
}
```

### Success Criteria
- All tests passing
- 90%+ test coverage
- 50+ unique sources per game
- Average reliability score > 7
- Response time < 60 seconds
- < 1% error rate
- No duplicate content
- 30%+ content from high-reliability sources

## Notes
- Start with test implementation
- Use mock data for development
- Document all assumptions
- Track API quotas
- Implement proper error logging
