# Keyloop Unified Document Viewer - Video Submission Script

**Total Duration**: 5-10 minutes  
**Target Audience**: Technical assessment reviewers

---

## 📋 Video Structure & Timing

| Section | Duration | Content |
|---------|----------|---------|
| 1. Introduction | 0:30 - 1:00 | Personal intro + scenario |
| 2. System Design | 1:00 - 2:30 | Architecture walkthrough |
| 3. Live Demo | 2:30 - 5:00 | Application demonstration |
| 4. Code Highlights | 5:00 - 7:00 | Implementation walkthrough |
| 5. AI Collaboration | 7:00 - 8:30 | How AI helped + learnings |
| 6. Conclusion | 8:30 - 9:00 | Summary + challenges |

---

## 🎙️ Script - Introduction (0:30 - 1:00)

### Voiceover:
```
"Hello, I'm [Your Name]. Today, I'm presenting the Keyloop Unified Document 
Viewer - a backend API solution for a technical assessment project.

The scenario I chose is: 'Build a service that searches and retrieves vehicle 
documents from multiple document management systems.' This involves aggregating 
results from both Sales and Service APIs, handling partial failures gracefully, 
and maintaining a searchable audit trail.

Let me walk you through the design, implementation, and how I leveraged AI 
collaboration to build this production-ready solution."
```

### What you show on screen:
- Your face/webcam (2-3 seconds)
- Project repository name visible
- README.md open in VS Code

---

## 🏗️ Script - System Design (1:00 - 2:30)

### Voiceover:
```
"The system is built using Clean Architecture principles with 4 distinct layers:

First, the Domain Layer contains our core business entities - Document, SearchLog, 
and AggregatedSearchResult. This keeps business logic independent of frameworks.

Second, the Application Layer handles orchestration. The DocumentSearchService 
coordinates searches across multiple APIs, while ValidationService ensures input 
integrity.

Third, the Interface Adapters layer bridges our application with the outside world 
through Controllers, Repositories, and API Clients.

Finally, the Frameworks layer provides Express.js, Winston logging, and database 
connectivity.

Key architectural decisions:
- Used Dependency Injection with tsyringe for loose coupling and testability
- Implemented graceful degradation - if one API fails, we still return partial 
  results with a 206 Partial Content response
- Added comprehensive error handling with custom error hierarchy
- Structured JSON logging for production observability"
```

### What you show on screen:
- Open DESIGN.md or SYSTEM_DESIGN_DOCUMENT.md
- Show architecture diagram (if available)
- Show folder structure: src/domain, src/application, src/interface-adapters, src/frameworks
- Highlight key files in tree view

---

## 🚀 Script - Live Demo (2:30 - 5:00)

### Part 1: Start the Server (2:30 - 3:00)

**Voiceover:**
```
"Let's start the development server."
```

**What you do:**
1. Open terminal in VS Code
2. Run: `npm run dev`
3. Show the startup message:
```
═════════════════════════════════════════════════════
  Keyloop Unified Document Viewer
═════════════════════════════════════════════════════
  Environment:       DEVELOPMENT
  Server:            http://localhost:3000
  API Docs:          http://localhost:3000/api-docs
  Health Check:      http://localhost:3000/health
═════════════════════════════════════════════════════

✅ Server is ready and listening for requests!
```

---

### Part 2: Test Health Check (3:00 - 3:15)

**Voiceover:**
```
"First, let's verify the server is healthy by checking the health endpoint."
```

**What you do:**
1. Open browser
2. Navigate to: `http://localhost:3000/health`
3. Show JSON response:
```json
{
  "status": "healthy",
  "uptime": 12.34,
  "timestamp": "2026-07-16T10:00:00.000Z",
  "version": "1.0.0"
}
```

**Commentary:**
"The health check responds with server status, uptime, and version. This is 
crucial for monitoring and container orchestration."

---

### Part 3: Swagger API Documentation (3:15 - 3:45)

**Voiceover:**
```
"Now let's look at the Swagger API documentation. This provides interactive 
documentation for all our endpoints."
```

**What you do:**
1. Navigate to: `http://localhost:3000/api-docs`
2. Show Swagger UI with all endpoints:
   - `/health` - Health check
   - `/documents/search` - POST
   - `/documents/search-history` - GET
3. Expand `/documents/search` to show request/response schema

**Commentary:**
"The Swagger documentation shows all available endpoints with their schemas, 
parameters, and response formats. This makes it easy for API consumers to 
integrate with our service."

---

### Part 4: Test Document Search (3:45 - 4:30)

**Voiceover:**
```
"Let's test the core functionality - searching for vehicle documents by VIN."
```

**What you do:**

#### Option A: Using Swagger UI
1. In Swagger, click on `POST /documents/search`
2. Click "Try it out"
3. Paste example VIN: `1HGBH41JXMN109186`
4. Click "Execute"
5. Show response:
```json
{
  "documents": [],
  "metadata": {
    "total": 0,
    "returned": 0,
    "offset": 0,
    "limit": 100,
    "partial": false
  },
  "executionTimeMs": 56,
  "_links": {
    "self": "/api/v1/documents/search?vin=1HGBH41JXMN109186&offset=0&limit=100"
  }
}
```

#### Option B: Using PowerShell/Browser Console
```bash
$body = @{ vin = "1HGBH41JXMN109186" } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3000/api/v1/documents/search" `
  -Method POST -ContentType "application/json" -Body $body
```

**Commentary:**
"The API returns an empty document list because we haven't set up mock data for 
this VIN. However, notice the response structure:
- The metadata shows pagination info
- ExecutionTimeMs tracks performance
- _links provides HATEOAS navigation
- If one API fails, we'd still show partial: true with the successful results"

---

### Part 5: Test Search History (4:30 - 4:45)

**Voiceover:**
```
"The system also maintains a search audit log. Let's check the search history."
```

**What you do:**
1. Navigate to: `http://localhost:3000/api/v1/documents/search-history`
2. Show response with the search we just made:
```json
{
  "searches": [
    {
      "id": "d3fcd36d-3caa-4469-9e7a-1eddcc8ffd68",
      "vin": "1HGBH41JXMN109186",
      "totalDocumentsFound": 0,
      "salesDocumentsFound": 0,
      "serviceDocumentsFound": 0,
      "executionTimeMs": 56,
      "salesApiSuccess": true,
      "serviceApiSuccess": true,
      "createdAt": "2026-07-16T09:49:08.681Z"
    }
  ],
  "metadata": {
    "total": 1,
    "returned": 1,
    "offset": 0,
    "limit": 20
  }
}
```

**Commentary:**
"The search history endpoint shows every search performed. We can see:
- Which APIs succeeded or failed
- Execution time
- Number of documents found from each system
- Timestamps for audit purposes

This audit trail is essential for compliance and debugging."

---

### Part 6: Test Root Endpoint (4:45 - 5:00)

**Voiceover:**
```
"Finally, let's check the root endpoint, which provides an overview of all 
available API endpoints."
```

**What you do:**
1. Navigate to: `http://localhost:3000/`
2. Show welcome JSON:
```json
{
  "name": "Keyloop Unified Document Viewer",
  "version": "1.0.0",
  "status": "running",
  "message": "Welcome to Keyloop Document Viewer API",
  "endpoints": {
    "health": "GET /health",
    "api_docs": "GET /api-docs",
    "search": "POST /api/v1/documents/search",
    "history": "GET /api/v1/documents/search-history"
  },
  "documentation": "http://localhost:3000/api-docs"
}
```

**Commentary:**
"The root endpoint serves as a discovery mechanism, helping API consumers 
understand what endpoints are available."

---

## 💻 Script - Code Highlights (5:00 - 7:00)

### Part 1: Architecture Layers (5:00 - 5:30)

**Voiceover:**
```
"Let me walk you through the key implementation files that showcase the 
architecture."
```

**What you show:**
1. Open file explorer in VS Code
2. Navigate to: `src/domain/entities/Document.ts`
   - Show the Document entity class
   - Highlight properties and methods
   
**Commentary:**
"In the Domain Layer, we define pure business entities. The Document class 
contains only business logic, with no framework dependencies. This makes it 
testable and maintainable."

---

### Part 2: Service Layer (5:30 - 6:00)

**Voiceover:**
```
"The Application Layer contains our business logic orchestration."
```

**What you show:**
1. Open: `src/application/services/DocumentSearchService.ts`
2. Highlight:
   - Constructor with @inject decorators (dependency injection)
   - searchByVin() method
   - How it calls the ExternalAPIOrchestrator
   - Logging statements

**Commentary:**
"DocumentSearchService orchestrates the search across multiple APIs. Notice 
how dependencies are injected - this allows us to swap implementations for 
testing. We also log extensively for debugging and monitoring."

---

### Part 3: Error Handling (6:00 - 6:30)

**Voiceover:**
```
"Error handling is critical in a system that integrates multiple external APIs."
```

**What you show:**
1. Open: `src/application/errors/AppError.ts`
2. Show error hierarchy:
   - AppError (base class)
   - ValidationError
   - APIError
3. Show error handler middleware: `src/interface-adapters/middleware/errorHandler.ts`

**Commentary:**
"We have a custom error hierarchy. ValidationError handles input issues, APIError 
handles external API failures, and the global error handler ensures consistent 
error responses. This gives clients clear error codes and messages."

---

### Part 4: Testing (6:30 - 7:00)

**Voiceover:**
```
"Quality assurance is built in through comprehensive testing."
```

**What you show:**
1. Show terminal: `npm run test:coverage`
2. Display coverage report:
```
────────────────────────────────────────────────────────────────
File                     | % Stmts | % Branch | % Funcs | % Lines
────────────────────────────────────────────────────────────────
All files                |  75.51  |   68.4   |  72.85  |  75.51
 src/application         |  97.25  |   85.3   |  95.24  |  97.25
 src/interface-adapters  |  100    |   100    |  100    |  100
────────────────────────────────────────────────────────────────
```

3. Run tests: Show `npm run test` output:
```
PASS  tests/unit/services/DocumentSearchService.test.ts
PASS  tests/unit/services/ValidationService.test.ts
PASS  tests/unit/middleware/errorHandler.test.ts
...
Test Suites: 6 passed, 6 total
Tests:       96 passed, 96 total
Time:        12.5s
```

**Commentary:**
"We have 96 tests covering unit, integration, and middleware testing. The 75% 
code coverage focuses on critical business logic, ensuring the core 
functionality is robust."

---

## 🤖 Script - AI Collaboration (7:00 - 8:30)

### Voiceover:
```
"Let me share my experience collaborating with AI to build this solution.

My Strategy:
I approached this as a partnership where AI handled implementation details while 
I focused on architecture and design decisions. I started by having AI generate 
code based on my system design document, then I rigorously tested and refined it.

Process for Verification:
1. First, I validated that the generated code matched the architecture design
2. Then I ran comprehensive tests to catch errors early
3. I manually tested all APIs to ensure they work correctly
4. I reviewed error cases and edge cases
5. I verified that logging and monitoring were comprehensive

Key Refinements:
- Fixed dependency injection setup to resolve issues early
- Added graceful shutdown handling for production readiness
- Improved error messages for better debugging
- Enhanced logging for production observability
- Added comprehensive API documentation

Quality Assurance:
- All 96 tests pass successfully
- 75% code coverage achieved
- Zero linting errors with TypeScript strict mode
- Full type safety throughout
- Clean Architecture principles maintained

Challenges and Solutions:
1. Challenge: Dependency injection initialization order
   Solution: Structured DI container setup with proper registration order

2. Challenge: Handling partial failures from multiple APIs
   Solution: Implemented graceful degradation returning partial results with 206 status

3. Challenge: Comprehensive error handling
   Solution: Custom error hierarchy with specific error codes

What I Learned:
- AI is excellent at generating boilerplate and implementation details
- Human judgment is crucial for architecture and design decisions
- Testing early and often catches issues before they become problems
- Clear specifications and requirements lead to better AI-generated code
- Iterative refinement produces better results than one-shot generation
- Documentation is as important as code for maintainability

The combination of AI-assisted implementation with human-guided architecture 
proved very effective. AI accelerated the development process while maintaining 
code quality standards."
```

**What you show on screen:**
1. Open README.md - show the AI Collaboration Narrative section
2. Show test results
3. Show code quality metrics
4. Show git commit history (if available) showing iterative improvements

---

## 🎯 Script - Conclusion (8:30 - 9:00)

### Voiceover:
```
"In summary, the Keyloop Unified Document Viewer demonstrates:

✓ Clean Architecture principles applied in practice
✓ Production-ready error handling and logging
✓ Comprehensive testing (96 tests, 75% coverage)
✓ Docker containerization for deployment
✓ Complete API documentation
✓ Effective AI collaboration process

The solution is ready for deployment and can handle real-world scenarios 
including API failures, concurrent searches, and audit requirements.

Key Takeaways:
1. Architecture first, implementation second
2. Test-driven quality assurance
3. Comprehensive documentation and logging
4. AI is a tool to accelerate development, not replace judgment
5. Iteration and refinement lead to quality

Thank you for reviewing this submission."
```

**What you show:**
- Final terminal output showing server running
- README.md with clear build/run instructions
- Project statistics

---

## 📝 Detailed Demo Commands Reference

### Terminal Commands for Demo:

```bash
# Start the server
npm run dev

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Build the project
npm run build

# Run linting
npm run lint

# Build Docker image (optional)
docker build -t keyloop-app -f Dockerfile .

# Run with Docker (optional)
docker-compose up --build
```

### API Endpoints for Testing:

```bash
# Health check
curl http://localhost:3000/health

# Root endpoint
curl http://localhost:3000/

# Search API (with VIN)
curl -X POST http://localhost:3000/api/v1/documents/search \
  -H "Content-Type: application/json" \
  -d '{"vin":"1HGBH41JXMN109186"}'

# Search history
curl http://localhost:3000/api/v1/documents/search-history

# Swagger UI
# Open browser to: http://localhost:3000/api-docs
```

### Browser URLs to Demo:

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | Root welcome page |
| http://localhost:3000/health | Health check |
| http://localhost:3000/api-docs | Swagger UI |
| http://localhost:3000/api/v1/documents/search-history | Search history |

---

## 🎬 Recording Tips

### Technical Setup:
- **Resolution**: 1920x1080 or higher
- **Frame Rate**: 30fps or 60fps
- **Audio**: Clear microphone, minimal background noise
- **Screen Sharing**: Use VS Code with zoom level 110-120% for readability

### During Recording:
- Speak clearly and at moderate pace
- Pause between sections for clarity
- Use mouse to highlight important code
- Keep terminal visible for output
- Minimize distractions

### Timing Tips:
- Practice the script beforehand
- Use visual cues (comments in code) to guide narration
- Keep demo steps simple and sequential
- Have backup URLs/commands if something fails

### If Something Goes Wrong:
- Keep recording, edit in post-production
- Restart the server and continue
- Have a second terminal ready
- Save screenshots of key outputs as backup

---

## 📋 Pre-Recording Checklist

- [ ] Server built and tested: `npm run build`
- [ ] All tests passing: `npm run test`
- [ ] Server starts correctly: `npm run dev`
- [ ] API endpoints responding: `curl http://localhost:3000/health`
- [ ] Swagger UI loads: http://localhost:3000/api-docs
- [ ] Browser console clean (no errors)
- [ ] Terminal history cleared
- [ ] Microphone tested
- [ ] Screen sharing quality checked
- [ ] Recording software configured
- [ ] README.md reviewed for accuracy
- [ ] Backup browser windows open with key URLs

---

## 🎯 Key Points to Emphasize

1. **Problem Solved**: Multiple document sources, graceful failure handling
2. **Architecture**: Clean Architecture, layered, testable
3. **Quality**: 96/96 tests passing, 75% coverage
4. **Production-Ready**: Error handling, logging, Docker support
5. **Documentation**: Complete README, API docs, design doc
6. **AI Collaboration**: Strategic use of AI with human oversight

---

## ✅ Video Submission Checklist

- [ ] Introduction clear and professional
- [ ] System design explained with visuals
- [ ] Live demo shows all 3 main endpoints working
- [ ] Code walkthrough shows key implementations
- [ ] AI collaboration narrative (1-2 minutes)
- [ ] Tests demonstrated and passing
- [ ] Total duration 5-10 minutes
- [ ] Audio clear and professional
- [ ] Video quality HD or better
- [ ] README and documentation visible
- [ ] Closing summary includes learnings

---

Good luck with your video submission! 🎬🚀
