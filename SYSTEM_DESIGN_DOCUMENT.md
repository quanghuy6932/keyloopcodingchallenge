# SYSTEM DESIGN DOCUMENT
## Unified Document Viewer - Scenario D

**Document Version:** 1.0  
**Date:** 2026-07-16  
**Status:** Design Phase Complete  
**Project Name:** Keyloop Unified Document Viewer  
**Domain:** Operate (Operations)

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Requirement Analysis](#requirement-analysis)
3. [Assumptions & Clarifications](#assumptions--clarifications)
4. [High-Level Architecture](#high-level-architecture)
5. [Component Diagram](#component-diagram)
6. [Data Flow Diagrams](#data-flow-diagrams)
7. [Sequence Diagrams](#sequence-diagrams)
8. [Database Design](#database-design)
9. [API Design & Contracts](#api-design--contracts)
10. [Technology Stack & Justifications](#technology-stack--justifications)
11. [Implementation Architecture](#implementation-architecture)
12. [Scalability Strategy](#scalability-strategy)
13. [Reliability & Resilience](#reliability--resilience)
14. [Performance Optimization](#performance-optimization)
15. [Security Considerations](#security-considerations)
16. [Observability Strategy](#observability-strategy)
17. [Testing Strategy](#testing-strategy)
18. [Error Handling & Validation](#error-handling--validation)
19. [Deployment & DevOps](#deployment--devops)
20. [AI Design Collaboration](#ai-design-collaboration)
21. [Implementation Roadmap](#implementation-roadmap)
22. [Future Extensions](#future-extensions)

---

## EXECUTIVE SUMMARY

### Problem Statement
Dealership staff struggle with fragmented document management across multiple systems:
- **Sales System** stores sales-related documents (quotations, contracts, registration docs)
- **Service System** stores service-related documents (maintenance records, invoices, warranty claims)
- **Current Pain Point:** Users must search both systems separately using Vehicle Identification Number (VIN)
- **Result:** Time-consuming, error-prone, poor user experience

### Solution Overview
Build a **Unified Document Viewer** that:
1. Accepts a single VIN input
2. Simultaneously queries two external APIs (mocked)
3. Aggregates documents from both sources
4. Displays unified results with source attribution
5. Designed for future expansion to additional systems

### Business Value
- **Efficiency:** Single search instead of two
- **Accuracy:** Consolidated view prevents missed documents
- **User Experience:** Seamless multi-system query
- **Extensibility:** Architecture supports adding more systems
- **Foundation:** Can integrate real APIs when dealership systems are ready

### Scope
- **In Scope:** VIN search, parallel API aggregation, unified document display, error handling, logging
- **Out of Scope:** Document download/preview, authentication/authorization (MVP), document storage, advanced filtering (v2)
- **Implementation:** Backend (REST API) with mock API harness + OpenAPI documentation

---

## REQUIREMENT ANALYSIS

### Functional Requirements

| ID | Requirement | Priority | Type | Acceptance Criteria |
|----|---|---|---|---|
| F1 | Unified Search Interface | MUST | API Endpoint | `POST /api/v1/documents/search` accepts VIN parameter |
| F2 | Parallel API Calls | MUST | Backend Logic | Sales & Service APIs called concurrently, not sequential |
| F3 | Document Aggregation | MUST | Business Logic | Results merged into single list, duplicates handled |
| F4 | Source Attribution | MUST | Data Model | Each document includes `source` field (SALES/SERVICE) |
| F5 | Error Handling | MUST | Fault Tolerance | Graceful degradation if one API fails |
| F6 | VIN Validation | SHOULD | Input Validation | Basic format check (17 chars, alphanumeric) |
| F7 | Search Result Pagination | SHOULD | API Feature | Support offset/limit for large result sets |
| F8 | Response Caching | COULD | Performance | Cache results for 5 min (optional v2) |

### Non-Functional Requirements

| ID | Attribute | Target | Rationale |
|----|---|---|---|
| NF1 | Response Time | ≤ 5 seconds | Acceptable for user-facing search |
| NF2 | API Timeout | 5 sec per service | Prevent hanging requests |
| NF3 | Availability | Graceful ≥99% | Partial results if one service down |
| NF4 | Concurrency | 100+ req/sec | Handle typical dealership load |
| NF5 | Code Coverage | ≥75% | Unit + integration tests |
| NF6 | Maintainability | SOLID + Clean Code | Dependency injection, <80 lines per method |
| NF7 | Observability | Structured logging | Every API call logged with trace ID |
| NF8 | Security | Input validation + SQL injection prevention | Parameterized queries, no hardcoded credentials |

### Acceptance Criteria from Specification

✅ **Acceptance Criteria 1: Unified Search**
- Single endpoint accepting VIN
- Returns consolidated document list
- User enters VIN, gets unified results

✅ **Acceptance Criteria 2: Parallel Execution**
- Backend makes simultaneous calls to Sales System API
- Backend makes simultaneous calls to Service System API
- Both calls execute in parallel (Promise.all), not sequential

✅ **Acceptance Criteria 3: Aggregated View**
- UI/API returns single list of documents
- No separate sections per system
- Clear source indication for each document

✅ **Acceptance Criteria 4: Source System Indication**
- Each document has source field
- Values: "SALES_SYSTEM" or "SERVICE_SYSTEM"
- Clear to end user which system provided the document

---

## ASSUMPTIONS & CLARIFICATIONS

### Critical Assumptions (Documented for Traceability)

#### 1. Mocked External API Contracts
**Assumption:** Both mocked APIs return standardized JSON response format
```json
{
  "documents": [
    {
      "id": "string (UUID or system ID)",
      "documentId": "string (unique within source system)",
      "title": "string",
      "type": "string (CONTRACT, INVOICE, MAINTENANCE_RECORD, etc)",
      "createdDate": "ISO8601 timestamp",
      "modifiedDate": "ISO8601 timestamp",
      "contentUrl": "string (mock file path or S3 URL)",
      "size": "integer (bytes)",
      "vin": "string (for validation)"
    }
  ],
  "metadata": {
    "total": "integer",
    "returned": "integer"
  }
}
```

#### 2. Parallel Execution Strategy
**Assumption:** Use JavaScript Promise.all() to execute both API calls simultaneously
- Timeout: 5 seconds per API
- If both succeed: merge and return
- If one fails: return results from working API + error notification
- If both fail: return error response

#### 3. Error Handling Policy
**Assumption:** Graceful degradation approach
- 200 OK with partial results if one API fails
- 500 error if both APIs fail
- Log all failures with VIN, timestamp, error details

#### 4. No Caching (MVP)
**Assumption:** Every search queries fresh data
- Rationale: Real-time data accuracy > performance
- Future v2: Implement Redis cache with 5-min TTL
- Cache invalidation: Manual or time-based

#### 5. VIN Format Validation
**Assumption:** Basic format check only (17 alphanumeric characters)
- No industry-specific validation (check digit)
- Reject if: length ≠ 17 or contains non-alphanumeric
- Forward validation to external APIs

#### 6. Document Deduplication
**Assumption:** No deduplication required
- Each system owns its documents
- No cross-system document overlap assumed
- If duplicates exist, both shown with different source

#### 7. No Authentication (MVP)
**Assumption:** No user authentication required
- Rationale: Assessment context (demo environment)
- Future: Add OAuth 2.0 / API Key auth
- All requests are "public" in MVP

#### 8. Timeout Strategy
**Assumption:** 
- Individual API call timeout: 5 seconds
- Overall search request timeout: 10 seconds (includes aggregation)
- Return results if at least one API succeeds within timeout

#### 9. Database Requirements
**Assumption:**
- Store search history (audit log)
- Log VINs searched, results returned, errors
- No document content storage (APIs are source of truth)
- Retention: 90 days

#### 10. Pagination
**Assumption:**
- API supports offset/limit (page-based, not cursor)
- Default: limit=100, offset=0
- Max limit: 1000
- Metadata: total, returned, offset, limit

---

## HIGH-LEVEL ARCHITECTURE

### Architectural Paradigm
- **Clean Architecture** with Dependency Injection
- **Layered Pattern:** Controller → Service → Repository/External API Client
- **Resilience Pattern:** Parallel execution with graceful degradation
- **Event-Driven:** (Future) Search events published to audit log

### Architecture Diagram (Text)

```
┌─────────────────────────────────────────────────────────────┐
│                   CLIENT LAYER                              │
│  (REST API Consumer via Swagger UI / cURL / Frontend App)   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP Request
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                   API GATEWAY LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐
│  │ • Request Validation Middleware                          │
│  │ • CORS Middleware                                        │
│  │ • Morgan (HTTP Logging)                                  │
│  │ • Global Error Handler                                   │
│  └──────────────────────────────────────────────────────────┘
└──────────────────────┬──────────────────────────────────────┘
                       │ Validated Request
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              CONTROLLER LAYER (Express Routes)               │
│  ┌──────────────────────────────────────────────────────────┐
│  │ DocumentSearchController                                 │
│  │  • POST /api/v1/documents/search                         │
│  │  • GET /api/v1/documents/search-history                  │
│  └──────────────────────────────────────────────────────────┘
└──────────────────────┬──────────────────────────────────────┘
                       │ Dependency Injection
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              SERVICE LAYER (Business Logic)                  │
│  ┌──────────────────────────────────────────────────────────┐
│  │ DocumentSearchService                                    │
│  │  • searchByVin(vin): Promise<AggregatedDocuments>        │
│  │  • validateVin(vin): boolean                             │
│  │  • aggregateResults(salesDocs, serviceDocs)              │
│  │  • handlePartialFailure(error)                           │
│  │                                                           │
│  │ ExternalAPIService (Abstract)                            │
│  │  • callSalesSystemAPI(vin)                               │
│  │  • callServiceSystemAPI(vin)                             │
│  └──────────────────────────────────────────────────────────┘
└──────────────────────┬──────────────────────────────────────┘
                       │ Database & External APIs
                       ▼
┌──────────────────────────────────────────────────────────────┐
│        REPOSITORY & EXTERNAL CLIENT LAYER                    │
│  ┌──────────────────────────────────────────────────────────┐
│  │ SearchHistoryRepository (PostgreSQL)                     │
│  │                                                           │
│  │ SalesSystemAPIClient (HTTP Client)                       │
│  │  • timeout: 5s                                           │
│  │  • base_url: process.env.SALES_API_URL                   │
│  │                                                           │
│  │ ServiceSystemAPIClient (HTTP Client)                     │
│  │  • timeout: 5s                                           │
│  │  • base_url: process.env.SERVICE_API_URL                 │
│  └──────────────────────────────────────────────────────────┘
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        ▼                             ▼
   ┌─────────────┐            ┌────────────────┐
   │ PostgreSQL  │            │ External APIs  │
   │ Search Logs │            │ (Mocked HTTP)  │
   └─────────────┘            └────────────────┘
```

### Key Design Principles
1. **Dependency Inversion:** Services depend on abstractions, not concrete HTTP clients
2. **Single Responsibility:** Each class has one reason to change
3. **Open/Closed:** Easy to add new API sources without modifying existing code
4. **Separation of Concerns:** Controllers → Services → Repository/Clients
5. **Error Handling:** Centralized error handler, custom error classes
6. **Testability:** All business logic injectable and mockable

---

## COMPONENT DIAGRAM

```
┌────────────────────────────────────────────────────────────────────┐
│                        Backend Service (Node.js)                   │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  HTTP Layer (Express)                                        │ │
│  │  ├─ Middleware (CORS, Logging, Validation)                  │ │
│  │  ├─ Router                                                   │ │
│  │  │  └─ DocumentSearchController                             │ │
│  │  └─ GlobalErrorHandler                                       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                             ▲                                      │
│                             │ DI Container (tsyringe)             │
│                             ▼                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Service Layer                                               │ │
│  │  ├─ DocumentSearchService                                   │ │
│  │  │  ├─ searchByVin()                                        │ │
│  │  │  ├─ validateVin()                                        │ │
│  │  │  ├─ aggregateResults()                                   │ │
│  │  │  └─ logSearchHistory()                                   │ │
│  │  │                                                           │ │
│  │  ├─ ExternalAPIOrchestrator                                │ │
│  │  │  └─ callAPIsInParallel()                                │ │
│  │  │                                                           │ │
│  │  └─ ValidationService                                       │ │
│  │     └─ validateVinFormat()                                 │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                             ▲                                      │
│                             │                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │  Repository & External Client Layer                          │ │
│  │  ├─ SearchHistoryRepository                                 │ │
│  │  │  ├─ create(searchLog)                                    │ │
│  │  │  ├─ findByVin(vin)                                       │ │
│  │  │  └─ deleteOlderThan(days)                                │ │
│  │  │                                                           │ │
│  │  ├─ ISalesSystemAPIClient (Interface)                      │ │
│  │  │  └─ search(vin): Promise<Document[]>                    │ │
│  │  │                                                           │ │
│  │  ├─ IServiceSystemAPIClient (Interface)                    │ │
│  │  │  └─ search(vin): Promise<Document[]>                    │ │
│  │  │                                                           │ │
│  │  ├─ SalesSystemAPIClient (Impl)                            │ │
│  │  │  └─ HTTP call to mock Sales API                         │ │
│  │  │                                                           │ │
│  │  └─ ServiceSystemAPIClient (Impl)                          │ │
│  │     └─ HTTP call to mock Service API                       │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                             ▼                                      │
└─────────────────────────┬──────────────────────────────────────────┘
                          │
                ┌─────────┴─────────┐
                ▼                   ▼
          ┌──────────┐       ┌─────────────┐
          │PostgreSQL│       │Mock APIs    │
          │(Logs)    │       │(HTTP Mocks) │
          └──────────┘       └─────────────┘
```

### Component Responsibilities

| Component | Responsibility | Key Methods |
|---|---|---|
| **DocumentSearchController** | HTTP endpoint handling, request/response mapping | searchByVin(), getSearchHistory() |
| **DocumentSearchService** | Core business logic, orchestration | searchByVin(), validateVin(), aggregateResults() |
| **ExternalAPIOrchestrator** | Parallel API execution, timeout mgmt | callAPIsInParallel(), handleTimeout() |
| **SalesSystemAPIClient** | Sales API HTTP calls | search(vin) |
| **ServiceSystemAPIClient** | Service API HTTP calls | search(vin) |
| **SearchHistoryRepository** | Database persistence for audit log | create(), findByVin(), delete() |
| **ValidationService** | Input validation | validateVinFormat() |
| **ErrorHandler** | Global error catching & formatting | handle(error) |

---

## DATA FLOW DIAGRAMS

### Primary Flow: VIN Search

```
User / Client
     │
     │ POST /api/v1/documents/search
     │ { "vin": "1HGBH41JXMN109186" }
     ▼
┌──────────────────────────────┐
│ DocumentSearchController     │
│ - Extract VIN from request   │
│ - Call service.searchByVin() │
└──────────────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ DocumentSearchService        │
│ - validateVin()              │
│   └─ if invalid: throw 400  │
└──────────────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ ExternalAPIOrchestrator      │
│ - Promise.all([              │
│   salesAPI.search(vin),       │
│   serviceAPI.search(vin)      │
│ ])                            │
│                              │
│ Timeout: 5s per API          │
│ Total timeout: 10s           │
└──────────────────────────────┘
     │
     ├──────────────────┬───────────────────┐
     ▼                  ▼                   ▼
┌─────────────┐   ┌──────────────┐   ┌──────────────┐
│ Sales API   │   │ Service API  │   │ Timeout      │
│ HTTP Call   │   │ HTTP Call    │   │ Handler      │
│             │   │              │   │              │
│ Returns:    │   │ Returns:     │   │ If timeout:  │
│ {docs[]}    │   │ {docs[]}     │   │ log error    │
└─────────────┘   └──────────────┘   └──────────────┘
     │                  │                   │
     └──────────────────┴───────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ aggregateResults()    │
            │ - Merge two arrays    │
            │ - Add source field    │
            │ - Deduplicate (none)  │
            │ - Sort by date        │
            │ - Paginate            │
            └───────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ logSearchHistory()    │
            │ - Store in DB         │
            │ - VIN, count, errors  │
            └───────────────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │ 200 OK Response       │
            │ {                     │
            │   documents: [...],   │
            │   metadata: {...},    │
            │   _links: {...}       │
            │ }                     │
            └───────────────────────┘
                        │
                        ▼
                   Client Receives
```

### Error Handling Flow

```
API Call Fails (timeout/error)
     │
     ▼
┌──────────────────────────────┐
│ Catch error in Promise.all() │
└──────────────────────────────┘
     │
     ▼
┌──────────────────────────────┐
│ Determine error type:        │
│ - Timeout                    │
│ - Network error              │
│ - Malformed response         │
│ - Invalid JSON               │
└──────────────────────────────┘
     │
     ├─────────────────────────────────────┐
     ▼                                     ▼
┌─────────────────────┐        ┌──────────────────────┐
│ One API failed      │        │ Both APIs failed     │
│                     │        │                      │
│ Action:             │        │ Action:              │
│ - Return working    │        │ - Return 500 error   │
│ - Include error msg │        │ - Log all errors     │
│ - 200 OK status     │        │ - Alert monitoring   │
│                     │        │                      │
│ Response:           │        │ Response:            │
│ {                   │        │ {                    │
│   documents: [...], │        │   error: "...",      │
│   partial: true,    │        │   status: 500        │
│   errors: [...]     │        │ }                    │
│ }                   │        │                      │
└─────────────────────┘        └──────────────────────┘
```

---

## SEQUENCE DIAGRAMS

### Happy Path: Successful Search with Both APIs

```
Client              Controller           Service           API Clients          DB
  │                    │                   │                    │                │
  │─ POST search ─────>│                   │                    │                │
  │                    │                   │                    │                │
  │                    │─ validateVin() ──>│                    │                │
  │                    │                   │─ ✓ valid          │                │
  │                    │<──────────────────│                    │                │
  │                    │                   │                    │                │
  │                    │─ searchByVin()───>│                    │                │
  │                    │                   │                    │                │
  │                    │                   │─ callAPIsInParallel()              │
  │                    │                   │  ┌─ salesAPI.search()              │
  │                    │                   │  │  └─────────────────────────────>│
  │                    │                   │  │  Promise 1 ◄─────────────────────│
  │                    │                   │  │  (doc[], [Sales])               │
  │                    │                   │  │                                 │
  │                    │                   │  └─ serviceAPI.search()            │
  │                    │                   │     └──────────────────────────────>│
  │                    │                   │     Promise 2 ◄──────────────────────│
  │                    │                   │     (doc[], [Service])             │
  │                    │                   │                                    │
  │                    │                   │ Promise.all([P1, P2]) ✓            │
  │                    │                   │ │                                   │
  │                    │                   │ └─ aggregateResults()              │
  │                    │                   │    (combine, add source, sort)     │
  │                    │                   │    │                               │
  │                    │                   │    └─ logSearchHistory() ─────────>│
  │                    │                   │       (INSERT audit log)           │
  │                    │                   │<──────────────────────────────────│
  │                    │<──────────────────│                                   │
  │                    │ AggregatedResult  │                                   │
  │                    │                   │                                   │
  │<── 200 OK Response ─│                   │                                   │
│  {documents[...]}  │                   │                                   │
```

### Partial Failure: One API Timeout

```
Client              Controller           Service           API Clients
  │                    │                   │                    │
  │─ POST search ─────>│                   │                    │
  │                    │─ validateVin() ──>│                    │
  │                    │                   │<── ✓                │
  │                    │                   │                    │
  │                    │─ searchByVin()───>│                    │
  │                    │                   │                    │
  │                    │                   │─ callAPIsInParallel()
  │                    │                   │  ┌─ salesAPI.search()
  │                    │                   │  │  └─ [Sales Docs] ✓
  │                    │                   │  │
  │                    │                   │  └─ serviceAPI.search()
  │                    │                   │     └─ TIMEOUT ✗
  │                    │                   │
  │                    │                   │ Promise.all() REJECTED
  │                    │                   │ └─ Catch error block
  │                    │                   │    ├─ One failed, one succeeded
  │                    │                   │    ├─ aggregateResults(salesDocs, [])
  │                    │                   │    ├─ Add error info
  │                    │                   │    └─ logSearchHistory()
  │                    │<──────────────────│
  │                    │  AggregatedResult │
  │                    │  (partial: true)  │
  │                    │                   │
  │<── 200 OK Response ─│                   │
│  {                   │                   │
│    documents: [...], │                   │
│    partial: true,    │                   │
│    errors: [...]     │                   │
│  }                   │                   │
```

---

## DATABASE DESIGN

### PostgreSQL Schema

#### Table: search_history (Audit Log)

```sql
CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vin VARCHAR(17) NOT NULL,
  vin_normalized VARCHAR(17) NOT NULL, -- uppercase
  
  -- Results summary
  total_documents_found INT NOT NULL DEFAULT 0,
  sales_documents_found INT NOT NULL DEFAULT 0,
  service_documents_found INT NOT NULL DEFAULT 0,
  
  -- Execution metrics
  execution_time_ms INT,
  sales_api_response_time_ms INT,
  service_api_response_time_ms INT,
  
  -- Error tracking
  sales_api_success BOOLEAN,
  sales_api_error_message TEXT,
  service_api_success BOOLEAN,
  service_api_error_message TEXT,
  
  -- User info (optional for future)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_ip_address INET,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes for query performance
  CONSTRAINT vin_format CHECK (vin ~ '^[A-Z0-9]{17}$')
);

CREATE INDEX idx_search_history_vin_created 
  ON search_history(vin_normalized, created_at DESC);
CREATE INDEX idx_search_history_created 
  ON search_history(created_at DESC);
```

#### Table: document_cache (Future v2)

```sql
-- Reserved for future caching feature
CREATE TABLE document_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vin VARCHAR(17) NOT NULL,
  source_system VARCHAR(50) NOT NULL, -- 'SALES_SYSTEM' or 'SERVICE_SYSTEM'
  
  -- Cached document
  documents JSONB NOT NULL,
  
  -- Metadata
  total_count INT,
  cached_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  
  CONSTRAINT valid_source CHECK (source_system IN ('SALES_SYSTEM', 'SERVICE_SYSTEM'))
);

CREATE INDEX idx_document_cache_vin_source_expires 
  ON document_cache(vin, source_system, expires_at DESC);
```

### Data Models

#### SearchLog Entity
```typescript
interface SearchLog {
  id: string; // UUID
  vin: string;
  vinNormalized: string;
  totalDocumentsFound: number;
  salesDocumentsFound: number;
  serviceDocumentsFound: number;
  executionTimeMs: number;
  salesApiResponseTimeMs?: number;
  serviceApiResponseTimeMs?: number;
  salesApiSuccess: boolean;
  salesApiErrorMessage?: string;
  serviceApiSuccess: boolean;
  serviceApiErrorMessage?: string;
  userId?: string;
  userIpAddress?: string;
  createdAt: Date;
}
```

#### Document Entity
```typescript
interface Document {
  id: string; // Unique per source system
  documentId: string; // System-specific ID
  vin: string;
  title: string;
  type: 'CONTRACT' | 'INVOICE' | 'MAINTENANCE_RECORD' | 'REGISTRATION' | 'WARRANTY_CLAIM' | 'QUOTATION' | 'OTHER';
  source: 'SALES_SYSTEM' | 'SERVICE_SYSTEM';
  createdDate: Date;
  modifiedDate: Date;
  contentUrl: string; // Mock file path or S3 URL
  size: number; // bytes
  metadata?: Record<string, unknown>;
}
```

#### AggregatedSearchResult
```typescript
interface AggregatedSearchResult {
  documents: Document[];
  metadata: {
    total: number;
    returned: number;
    offset: number;
    limit: number;
    partial: boolean; // true if one API failed
  };
  errors?: {
    salesSystemError?: string;
    serviceSystemError?: string;
  };
  _links?: {
    self: string;
    next?: string;
    prev?: string;
  };
  executionTimeMs: number;
}
```

---

## API DESIGN & CONTRACTS

### Base URL
```
http://localhost:3000/api/v1
```

### Endpoint 1: Search Documents by VIN

#### Request
```
POST /documents/search
Content-Type: application/json

{
  "vin": "1HGBH41JXMN109186",
  "pagination": {
    "limit": 50,
    "offset": 0
  }
}
```

#### Request Validation Rules
- `vin`: Required, string, exactly 17 characters, alphanumeric only
- `pagination.limit`: Optional, integer, default 100, max 1000
- `pagination.offset`: Optional, integer, default 0

#### Response 200 (Success - Both APIs)
```json
{
  "documents": [
    {
      "id": "doc_123",
      "documentId": "SALES_2024_001",
      "vin": "1HGBH41JXMN109186",
      "title": "Sales Contract",
      "type": "CONTRACT",
      "source": "SALES_SYSTEM",
      "createdDate": "2024-01-15T10:30:00Z",
      "modifiedDate": "2024-01-15T10:30:00Z",
      "contentUrl": "/mock-files/sales/contract_001.pdf",
      "size": 256000
    },
    {
      "id": "doc_124",
      "documentId": "SERVICE_2024_005",
      "vin": "1HGBH41JXMN109186",
      "title": "Maintenance Service Record",
      "type": "MAINTENANCE_RECORD",
      "source": "SERVICE_SYSTEM",
      "createdDate": "2024-02-20T14:45:00Z",
      "modifiedDate": "2024-02-20T14:45:00Z",
      "contentUrl": "/mock-files/service/service_005.pdf",
      "size": 128000
    }
  ],
  "metadata": {
    "total": 2,
    "returned": 2,
    "offset": 0,
    "limit": 50,
    "partial": false
  },
  "executionTimeMs": 1234,
  "_links": {
    "self": "/api/v1/documents/search?vin=1HGBH41JXMN109186&offset=0&limit=50"
  }
}
```

#### Response 200 (Partial Success - One API Failed)
```json
{
  "documents": [
    {
      "id": "doc_123",
      "documentId": "SALES_2024_001",
      "vin": "1HGBH41JXMN109186",
      "title": "Sales Contract",
      "type": "CONTRACT",
      "source": "SALES_SYSTEM",
      "createdDate": "2024-01-15T10:30:00Z",
      "modifiedDate": "2024-01-15T10:30:00Z",
      "contentUrl": "/mock-files/sales/contract_001.pdf",
      "size": 256000
    }
  ],
  "metadata": {
    "total": 1,
    "returned": 1,
    "offset": 0,
    "limit": 50,
    "partial": true
  },
  "errors": {
    "serviceSystemError": "Request timeout after 5000ms"
  },
  "executionTimeMs": 5123,
  "_links": {
    "self": "/api/v1/documents/search?vin=1HGBH41JXMN109186"
  }
}
```

#### Response 400 (Bad Request - Invalid VIN)
```json
{
  "error": "Validation Error",
  "message": "VIN must be exactly 17 alphanumeric characters",
  "code": "VIN_FORMAT_INVALID",
  "details": {
    "field": "vin",
    "value": "invalid-vin",
    "constraint": "length=17 && alphanumeric=true"
  },
  "timestamp": "2026-07-16T10:30:00Z"
}
```

#### Response 500 (Internal Server Error - Both APIs Failed)
```json
{
  "error": "Service Unavailable",
  "message": "Unable to retrieve documents from available systems",
  "code": "EXTERNAL_API_FAILURE",
  "details": {
    "salesSystemError": "Connection refused",
    "serviceSystemError": "Request timeout after 5000ms"
  },
  "timestamp": "2026-07-16T10:30:00Z",
  "requestId": "req_12345"
}
```

---

### Endpoint 2: Get Search History (Audit Log)

#### Request
```
GET /documents/search-history?limit=20&offset=0
```

#### Response 200
```json
{
  "searches": [
    {
      "id": "search_001",
      "vin": "1HGBH41JXMN109186",
      "totalDocumentsFound": 3,
      "salesDocumentsFound": 1,
      "serviceDocumentsFound": 2,
      "executionTimeMs": 1234,
      "salesApiSuccess": true,
      "serviceApiSuccess": true,
      "createdAt": "2026-07-16T10:30:00Z"
    }
  ],
  "metadata": {
    "total": 150,
    "returned": 20,
    "offset": 0,
    "limit": 20
  }
}
```

---

### Mocked External API Contracts

#### Sales System API Mock
```
GET /api/sales/documents?vin=1HGBH41JXMN109186

Response 200:
{
  "documents": [
    {
      "id": "SALES_2024_001",
      "title": "Sales Contract",
      "type": "CONTRACT",
      "createdDate": "2024-01-15T10:30:00Z",
      "modifiedDate": "2024-01-15T10:30:00Z",
      "contentUrl": "/mock-files/sales/contract_001.pdf",
      "size": 256000
    }
  ],
  "metadata": {
    "total": 1,
    "returned": 1
  }
}
```

#### Service System API Mock
```
GET /api/service/documents?vin=1HGBH41JXMN109186

Response 200:
{
  "documents": [
    {
      "id": "SERVICE_2024_005",
      "title": "Maintenance Service Record",
      "type": "MAINTENANCE_RECORD",
      "createdDate": "2024-02-20T14:45:00Z",
      "modifiedDate": "2024-02-20T14:45:00Z",
      "contentUrl": "/mock-files/service/service_005.pdf",
      "size": 128000
    }
  ],
  "metadata": {
    "total": 1,
    "returned": 1
  }
}
```

---

## TECHNOLOGY STACK & JUSTIFICATIONS

### Backend Framework
**Chosen: Node.js + Express + TypeScript**

| Technology | Alternative | Why Chosen |
|---|---|---|
| **Node.js** | Java Spring, Python Django, Go Gin | Lightweight, excellent for I/O-heavy operations (parallel API calls), JavaScript ecosystem, fast to develop |
| **Express** | Fastify, NestJS, Koa | Mature, minimal overhead, easy to understand, perfect for REST APIs, not over-engineered |
| **TypeScript** | JavaScript | Type safety, catches errors at compile time, better IDE support, professional codebase, maintainability |

### Database
**Chosen: PostgreSQL**

| Technology | Alternative | Why Chosen |
|---|---|---|
| **PostgreSQL** | MySQL, MongoDB, Redis | ACID compliance (critical for audit logs), JSON support (for flexible metadata), excellent indexing, production-grade reliability, free & open source |

### ORM / Data Access
**Chosen: TypeORM**

| Technology | Alternative | Why Chosen |
|---|---|---|
| **TypeORM** | Prisma, Sequelize, Mikro ORM | TypeScript-first design, decorator-based (clean code), repository pattern support, query builder, migrations |

### HTTP Client
**Chosen: axios + retry logic (custom)**

| Technology | Alternative | Why Chosen |
|---|---|---|
| **axios** | node-fetch, got, request-promise | Promise-based, timeout support, interceptors, modern syntax, well-maintained |

### Dependency Injection
**Chosen: tsyringe**

| Technology | Alternative | Why Chosen |
|---|---|---|
| **tsyringe** | InversifyJS, Awilix, TypeDI | Lightweight, TypeScript-native, decorator-based, minimal boilerplate |

### Validation
**Chosen: class-validator + class-transformer**

| Technology | Alternative | Why Chosen |
|---|---|---|
| **class-validator** | Joi, Yup, Zod | Works seamlessly with TypeORM, decorator-based, comprehensive validators, good TypeScript integration |

### Testing
**Chosen: Jest**

| Technology | Alternative | Why Chosen |
|---|---|---|
| **Jest** | Mocha, Vitest, Jasmine | Zero-config, excellent code coverage reporting, snapshot testing, built-in mocking, industry standard |

### Logging
**Chosen: Winston + Morgan**

| Technology | Alternative | Why Chosen |
|---|---|---|
| **Winston** | Bunyan, Pino, Log4js | Structured logging (JSON), transport support (file, console), levels, metadata, production-ready |
| **Morgan** | custom middleware | HTTP request logging, standard format, integrates with Winston |

### API Documentation
**Chosen: Swagger/OpenAPI 3.0 + swagger-ui-express**

| Technology | Alternative | Why Chosen |
|---|---|---|
| **Swagger UI** | Redoc, AsyncAPI | Interactive API exploration, generates from code, client SDK generation, industry standard |

### Containerization
**Chosen: Docker + Docker Compose**

| Technology | Alternative | Why Chosen |
|---|---|---|
| **Docker** | Podman, Kubernetes | Consistency across environments (dev, test, prod), easy deployment, industry standard |

### Configuration Management
**Chosen: dotenv + joi**

| Technology | Alternative | Why Chosen |
|---|---|---|
| **dotenv** | nconf, config | Simple file-based for local dev, environment variables for cloud, secure by default |
| **joi** | yup | Environment variable schema validation, comprehensive, detailed error messages |

### Development Tools
- **typescript**: Type safety
- **ts-node**: Execute TS directly
- **nodemon**: Auto-restart on changes
- **ESLint + Prettier**: Code quality & formatting
- **husky + lint-staged**: Pre-commit hooks

---

## IMPLEMENTATION ARCHITECTURE

### Clean Architecture Layers

#### 1. Entity Layer (Core Business Rules)
```typescript
// src/domain/entities/SearchLog.ts
class SearchLog {
  id: string;
  vin: string;
  executionTimeMs: number;
  
  // Business logic
  isSuccessful(): boolean { ... }
  hasErrors(): boolean { ... }
}
```

#### 2. Use Case Layer (Application Business Rules)
```typescript
// src/usecases/SearchDocumentsByVin.ts
class SearchDocumentsByVinUseCase {
  execute(vin: string): Promise<AggregatedSearchResult>
}
```

#### 3. Interface Adapter Layer (Controllers, Repositories, External API Clients)
```typescript
// src/interface-adapters/controllers/DocumentSearchController.ts
// src/interface-adapters/repositories/SearchHistoryRepository.ts
// src/interface-adapters/external-clients/SalesSystemAPIClient.ts
```

#### 4. Framework & Drivers Layer (Express, PostgreSQL, HTTP Client)
```typescript
// src/frameworks/express/app.ts
// src/frameworks/database/connection.ts
```

### Folder Structure
```
project-root/
├── src/
│   ├── domain/                    # Business entities
│   │   ├── entities/
│   │   │   ├── Document.ts
│   │   │   ├── SearchLog.ts
│   │   │   └── AggregatedSearchResult.ts
│   │   └── constants/
│   │       └── DocumentTypes.ts
│   │
│   ├── application/               # Use cases & services
│   │   ├── services/
│   │   │   ├── DocumentSearchService.ts
│   │   │   ├── ExternalAPIOrchestrator.ts
│   │   │   └── ValidationService.ts
│   │   ├── dto/
│   │   │   ├── SearchDocumentRequest.ts
│   │   │   ├── SearchDocumentResponse.ts
│   │   │   └── DocumentDTO.ts
│   │   └── errors/
│   │       ├── AppError.ts
│   │       ├── ValidationError.ts
│   │       ├── APIError.ts
│   │       └── TimeoutError.ts
│   │
│   ├── interface-adapters/        # Controllers, repos, external clients
│   │   ├── controllers/
│   │   │   └── DocumentSearchController.ts
│   │   ├── repositories/
│   │   │   └── SearchHistoryRepository.ts
│   │   ├── external-clients/
│   │   │   ├── ISalesSystemAPIClient.ts
│   │   │   ├── SalesSystemAPIClient.ts
│   │   │   ├── IServiceSystemAPIClient.ts
│   │   │   └── ServiceSystemAPIClient.ts
│   │   └── middleware/
│   │       ├── errorHandler.ts
│   │       ├── validateRequest.ts
│   │       └── requestLogger.ts
│   │
│   ├── frameworks/                # Database, Express, HTTP
│   │   ├── express/
│   │   │   ├── app.ts
│   │   │   ├── routes.ts
│   │   │   └── server.ts
│   │   ├── database/
│   │   │   ├── connection.ts
│   │   │   ├── migrations/
│   │   │   └── seeders/
│   │   └── http/
│   │       └── axiosInstance.ts
│   │
│   ├── config/
│   │   ├── environment.ts
│   │   ├── logger.ts
│   │   └── di-container.ts
│   │
│   ├── utils/
│   │   ├── vinValidator.ts
│   │   ├── timeoutHelper.ts
│   │   └── metrics.ts
│   │
│   └── index.ts                   # Entry point
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   ├── utils/
│   │   └── repositories/
│   ├── integration/
│   │   ├── api/
│   │   └── database/
│   └── fixtures/
│       └── mockData.ts
│
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── .env.example
├── jest.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## SCALABILITY STRATEGY

### 1. Horizontal Scaling (Multiple Instances)
- **Stateless design**: No session state, each instance is identical
- **Load Balancer**: NGINX/HAProxy to distribute requests
- **Database**: PostgreSQL with connection pooling (pgBouncer)
- **Caching Layer**: Redis (future) for frequently searched VINs

### 2. Vertical Scaling (Instance Resources)
- **Node.js Clustering**: Use OS-level concurrency (pm2 cluster mode)
- **Worker Threads**: For CPU-intensive tasks (future)

### 3. Database Scalability
- **Read Replicas**: For read-heavy audit logs
- **Partitioning**: By VIN hash for very large search_history tables
- **Archiving**: Move old logs (>90 days) to cold storage

### 4. API Client Optimization
- **Connection Pooling**: Reuse HTTP connections to external APIs
- **Caching**: Short-lived cache (Redis) for frequently accessed VINs
- **Rate Limiting**: Respect external API rate limits with token bucket algorithm

### 5. Monitoring & Auto-Scaling
- **Metrics**: CPU, memory, request latency, API call duration
- **Alerts**: Trigger scale-up if CPU > 70% or latency > 2s
- **Auto-Scaling**: Kubernetes HPA or cloud provider (AWS Auto Scaling Group)

---

## RELIABILITY & RESILIENCE

### 1. Timeout Management
```
┌─ Individual API Timeout: 5 seconds
├─ Overall Request Timeout: 10 seconds
├─ Database Query Timeout: 3 seconds
└─ Connection Timeout: 2 seconds
```

### 2. Error Handling Strategy

**Transient Errors (Retry)**
- Network timeout → Retry with exponential backoff
- API 503 Service Unavailable → Retry after delay
- Connection refused → Retry up to 3 times

**Permanent Errors (Fail-Fast)**
- VIN format invalid → Reject immediately (400)
- API 404 Not Found → Return empty results
- Database connection lost → Return 500 with error details

### 3. Circuit Breaker Pattern (Future)
```
Closed State:
- Normal operation
- Forward all requests

Open State:
- Too many failures detected
- Block requests for 30 seconds
- Return fallback response

Half-Open State:
- Test if service recovered
- If succeeds, go to Closed
- If fails, go to Open
```

### 4. Graceful Degradation
- One API fails? Return results from other + error notification (200)
- Both fail? Return 500 with clear error message
- Database down? Return 503 Service Unavailable

### 5. Health Checks
```
GET /health
```
Returns:
```json
{
  "status": "healthy",
  "database": "connected",
  "uptime": 3600,
  "version": "1.0.0"
}
```

---

## PERFORMANCE OPTIMIZATION

### 1. Parallel Execution
- Use `Promise.all()` for simultaneous API calls
- Expected response time: ~2-3 seconds (not 5-6 seconds sequential)

### 2. Connection Pooling
- PostgreSQL: Connection pool size 20
- HTTP: Keep-alive connections to external APIs

### 3. Caching Strategy (Future v2)
- Cache key: `search:{vin_normalized}`
- TTL: 5 minutes
- Invalidation: Manual invalidation when vehicle details updated

### 4. Database Query Optimization
- Index on `search_history(vin_normalized, created_at DESC)`
- Index on `created_at DESC` for time-range queries
- Use LIMIT/OFFSET for pagination

### 5. Response Compression
- GZIP compression for responses >1KB
- Streaming for large result sets (future)

### 6. Request/Response Size
- Only return necessary fields (no sensitive data)
- Pagination defaults: limit=100, max=1000
- Response size estimate: 2-10 KB per request

---

## SECURITY CONSIDERATIONS

### 1. Input Validation
- VIN format: Exactly 17 alphanumeric characters
- Reject malformed input immediately (400)
- Use prepared statements to prevent SQL injection

### 2. No Sensitive Data Logging
- ✅ Log: VIN search queries, API latencies, error types
- ❌ Don't log: Full API responses, customer info, file contents

### 3. Environment Variables
- Never hardcode API URLs, database credentials, secrets
- Use `.env` file locally, secrets management in production (AWS Secrets Manager, Vault)

### 4. Rate Limiting (Future)
- Limit: 100 requests per minute per IP address
- Implement via middleware (express-rate-limit)

### 5. CORS Policy
- Allow requests from known frontend domains only
- In MVP: Allow all (localhost for testing)

### 6. HTTPS in Production
- All API calls must use HTTPS
- Certificate management: Let's Encrypt

### 7. API Authentication (Future)
- API Key or OAuth 2.0 for external access
- Not required for MVP (internal only)

---

## OBSERVABILITY STRATEGY

### 1. Logging

**Structured Logging with Winston:**
```typescript
// Example log entries
logger.info('Document search started', {
  vin: 'normalized-vin',
  timestamp: new Date().toISOString(),
  traceId: 'trace_12345'
});

logger.error('Sales API call failed', {
  error: error.message,
  code: 'SALES_API_TIMEOUT',
  duration: 5000,
  vin: 'vin',
  traceId: 'trace_12345'
});
```

**Log Levels:**
- ERROR: Failures, timeouts, exceptions
- WARN: Partial failures, retries
- INFO: Search requests, API responses
- DEBUG: SQL queries, intermediate steps

**Log Destinations:**
- Console: Development
- File: Production (daily rotation)
- Cloud Logging: Stackdriver (GCP) or CloudWatch (AWS)

### 2. Metrics & Monitoring

**Key Metrics:**
- Request rate (req/sec)
- Response time (p50, p99, max)
- Error rate (%)
- API call success rate
- Database query latency
- Active connections
- Cache hit rate (future)

**Tools:**
- Prometheus: Metrics collection
- Grafana: Visualization
- StatsD: Metrics forwarding

### 3. Distributed Tracing

**Implementation:**
- Generate unique `traceId` for each request
- Pass `traceId` through all service calls
- Log `traceId` in every log entry
- Use Jaeger or Zipkin for trace visualization

**Example Trace Path:**
```
Request #1
  ├─ DocumentSearchController.search() [trace_001]
  ├─ DocumentSearchService.searchByVin() [trace_001]
  ├─ ExternalAPIOrchestrator.callAPIsInParallel() [trace_001]
  │  ├─ SalesSystemAPIClient.search() [trace_001, span_sales]
  │  └─ ServiceSystemAPIClient.search() [trace_001, span_service]
  └─ SearchHistoryRepository.create() [trace_001]
```

### 4. Health Checks
```
GET /health → Returns database status, external API connectivity
GET /ready → Returns readiness for requests
```

### 5. Error Tracking
- Send errors to Sentry for aggregation & alerts
- Group errors by type, service, API
- Alert on error rate > 5%

---

## TESTING STRATEGY

### 1. Unit Tests
**Target:** >80% code coverage for business logic

**Tests for:**
- `DocumentSearchService.searchByVin()`
- `ValidationService.validateVinFormat()`
- Error handling edge cases
- VIN normalization

**Example:**
```typescript
describe('DocumentSearchService', () => {
  describe('searchByVin', () => {
    it('should aggregate documents from both APIs', async () => {
      // Arrange
      const mockSalesResponse = [{ id: '1', source: 'SALES_SYSTEM' }];
      const mockServiceResponse = [{ id: '2', source: 'SERVICE_SYSTEM' }];
      
      // Act
      const result = await service.searchByVin('1HGBH41JXMN109186');
      
      // Assert
      expect(result.documents).toHaveLength(2);
      expect(result.partial).toBe(false);
    });
    
    it('should handle Sales API timeout gracefully', async () => {
      // Arrange
      mockSalesClient.search.mockRejectedValueOnce(new TimeoutError());
      
      // Act
      const result = await service.searchByVin('1HGBH41JXMN109186');
      
      // Assert
      expect(result.partial).toBe(true);
      expect(result.errors.salesSystemError).toBeDefined();
    });
    
    it('should reject invalid VIN format', async () => {
      // Act & Assert
      await expect(service.searchByVin('invalid')).rejects.toThrow(ValidationError);
    });
  });
});
```

### 2. Integration Tests
**Tests for:**
- End-to-end API call (happy path)
- Database persistence (search_history insert)
- Error responses (400, 500)
- Pagination

**Example:**
```typescript
describe('DocumentSearchController - Integration', () => {
  it('should return aggregated documents with 200 OK', async () => {
    const response = await request(app)
      .post('/api/v1/documents/search')
      .send({ vin: '1HGBH41JXMN109186' })
      .expect(200);
    
    expect(response.body.documents).toBeDefined();
    expect(response.body.metadata.total).toBeGreaterThanOrEqual(0);
    expect(response.body.executionTimeMs).toBeDefined();
  });
  
  it('should return 400 for invalid VIN', async () => {
    const response = await request(app)
      .post('/api/v1/documents/search')
      .send({ vin: 'invalid-vin' })
      .expect(400);
    
    expect(response.body.error).toBe('Validation Error');
  });
});
```

### 3. Contract Tests
- Test mocked external API contracts
- Verify request/response format matches spec
- Test timeout scenarios

### 4. Performance Tests (Benchmarks)
- Measure response time with 100+ documents
- Verify parallel execution is faster than sequential
- Database query performance

### 5. Security Tests
- SQL injection attempts (prepared statements should prevent)
- XSS in response (JSON responses are inherently safe)
- CORS headers validation

---

## ERROR HANDLING & VALIDATION

### Custom Error Hierarchy
```typescript
// src/application/errors/AppError.ts
class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

class APIError extends AppError {
  constructor(message: string, details?: any) {
    super('EXTERNAL_API_ERROR', message, 500, details);
  }
}

class TimeoutError extends AppError {
  constructor(message: string) {
    super('TIMEOUT_ERROR', message, 503);
  }
}
```

### Global Error Handler
```typescript
// src/interface-adapters/middleware/errorHandler.ts
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      code: err.code,
      details: err.details,
      timestamp: new Date().toISOString()
    });
  }
  
  // Unknown error
  return res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});
```

### Request Validation Middleware
```typescript
app.post('/documents/search', 
  validateRequest(SearchDocumentRequest), // DTO validation
  documentSearchController.search
);
```

---

## DEPLOYMENT & DEVOPS

### Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY dist ./dist
COPY .env.example .env
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://user:pass@db:5432/keyloop
      NODE_ENV: production
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: keyloop
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Environment-Based Configuration

**.env files:**
- `.env.local` - Local development
- `.env.test` - Testing
- `.env.production` - Production (secrets manager)

---

## AI DESIGN COLLABORATION

### How AI Was Used in This Design

#### Phase 1: Requirement Analysis
- **Human:** Reviewed specification document, identified ambiguities
- **AI:** Helped structure requirement analysis, filled in missing details
- **Review:** Developer verified all requirements against original spec

#### Phase 2: Architecture Design
- **Human:** Defined architectural principles (Clean Architecture, SOLID)
- **AI:** Generated component diagrams, data flow diagrams, sequence diagrams
- **Review:** Developer validated diagrams against requirements, made adjustments

#### Phase 3: Technology Selection
- **Human:** Set selection criteria (production-ready, type-safe, scalable)
- **AI:** Compared alternatives with justifications
- **Review:** Developer verified stack aligns with project needs

#### AI Output Verification Checklist
✅ All requirements addressed
✅ Architecture follows Clean Architecture principles
✅ No over-engineering or unnecessary complexity
✅ Database design covers all data needs
✅ API contracts are clear and consistent
✅ Error handling covers all scenarios
✅ Scalability & reliability strategies are sound

#### Where AI Excelled
- Generating diagram structures (text-based)
- Comparing technology alternatives
- Creating boilerplate structure
- Writing consistent documentation

#### Where Human Review Was Critical
- Validating against original requirements
- Making architectural trade-off decisions
- Ensuring simplicity (avoiding over-engineering)
- Adapting generic solutions to specific context

---

## IMPLEMENTATION ROADMAP

### Phase 1: Project Setup (Day 1)
- [ ] Initialize Node.js project with TypeScript
- [ ] Set up folder structure
- [ ] Configure ESLint, Prettier, Husky
- [ ] Set up Docker & PostgreSQL
- [ ] Initialize database with migrations

### Phase 2: Domain & Entities (Day 1)
- [ ] Define Document, SearchLog, AggregatedSearchResult entities
- [ ] Create domain constants
- [ ] Define DTOs & API contracts

### Phase 3: Core Service Logic (Day 2)
- [ ] Implement ValidationService (VIN format)
- [ ] Implement DocumentSearchService
- [ ] Implement ExternalAPIOrchestrator (parallel calls)
- [ ] Implement error handling & custom errors

### Phase 4: Data Access Layer (Day 2)
- [ ] Implement SearchHistoryRepository
- [ ] Configure TypeORM with PostgreSQL
- [ ] Create database migrations
- [ ] Add seed data for testing

### Phase 5: API Controller & Routes (Day 2)
- [ ] Implement DocumentSearchController
- [ ] Create Express routes
- [ ] Implement request validation middleware
- [ ] Implement global error handler

### Phase 6: External API Clients (Day 3)
- [ ] Create ISalesSystemAPIClient interface
- [ ] Implement SalesSystemAPIClient (mock)
- [ ] Create IServiceSystemAPIClient interface
- [ ] Implement ServiceSystemAPIClient (mock)
- [ ] Implement timeout & error handling

### Phase 7: Observability (Day 3)
- [ ] Set up Winston logger
- [ ] Integrate Morgan for HTTP logging
- [ ] Add trace IDs to requests
- [ ] Implement health check endpoints

### Phase 8: API Documentation (Day 3)
- [ ] Create Swagger/OpenAPI definitions
- [ ] Integrate swagger-ui-express
- [ ] Document all endpoints with examples

### Phase 9: Testing (Day 4)
- [ ] Write unit tests for services
- [ ] Write integration tests for API endpoints
- [ ] Set up Jest configuration
- [ ] Achieve >75% code coverage

### Phase 10: Review & Refactoring (Day 4)
- [ ] Code review & cleanup
- [ ] Performance testing
- [ ] Security validation
- [ ] Documentation review

---

## FUTURE EXTENSIONS

### Version 2.0 Features
1. **API Caching**: Redis cache for frequently searched VINs
2. **Database Pagination**: More efficient large result set handling
3. **Advanced Filtering**: Filter by document type, date range
4. **Document Preview**: Basic document preview in UI
5. **Search Analytics**: Dashboard showing popular VINs, search trends
6. **Authentication**: OAuth 2.0 / API Key for external access
7. **Rate Limiting**: Per-user/IP request limits
8. **Audit Trail**: Detailed logging of who searched what
9. **Additional Systems**: Support for financing, insurance, parts inventory APIs
10. **Webhook Support**: Notify systems when vehicle documents updated

### Version 3.0 (Long-term)
1. **Event-Driven Architecture**: Pub/Sub for document updates
2. **Microservices**: Split into separate services (search, aggregation, logging)
3. **ML Features**: Predict document types, anomaly detection
4. **GraphQL**: In addition to REST API
5. **Full-Text Search**: Elasticsearch for document content search

---

## SIGN-OFF & REVIEW

### Design Review Checklist

✅ **Requirements Coverage**
- All functional requirements mapped to design
- All non-functional requirements addressed
- Acceptance criteria achievable with this design

✅ **Architecture Quality**
- Clean Architecture principles followed
- Separation of concerns clear
- No tight coupling between components
- Easy to test and maintain

✅ **Scalability**
- Parallel execution avoids sequential bottleneck
- Stateless design enables horizontal scaling
- Database indexes planned
- Future extensibility considered

✅ **Reliability**
- Error handling for all scenarios
- Graceful degradation if APIs fail
- Timeout management defined
- Health checks included

✅ **Security**
- Input validation enforced
- No hardcoded secrets
- SQL injection prevention with parameterized queries
- Logging excludes sensitive data

✅ **Observability**
- Structured logging strategy defined
- Distributed tracing (trace IDs) planned
- Metrics & monitoring approach outlined
- Health check endpoints designed

✅ **Testing**
- Unit test strategy clear
- Integration test scenarios identified
- Contract testing for external APIs
- >75% code coverage target

✅ **Documentation**
- Architecture clear to new developers
- API contracts documented
- Configuration management explained
- Deployment procedure clear

---

## CONCLUSION

This System Design Document provides a comprehensive blueprint for implementing the Unified Document Viewer backend service. The design emphasizes:

1. **Clarity**: Every component, data flow, and interaction is documented
2. **Scalability**: Parallel execution, stateless design, extensible architecture
3. **Reliability**: Graceful degradation, comprehensive error handling, health checks
4. **Maintainability**: Clean Architecture, SOLID principles, testable design
5. **Production-Readiness**: Docker deployment, monitoring, logging, security

The proposed technology stack is mature, battle-tested, and well-suited for the requirements. The design is ready for implementation, and the roadmap provides clear milestones for development.

---

**Document Status:** ✅ Ready for Implementation  
**Last Updated:** 2026-07-16  
**Next Step:** Proceed to Phase 5 - Implementation

