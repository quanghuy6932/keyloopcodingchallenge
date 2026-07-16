# Contributing to Keyloop Unified Document Viewer

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Making Changes](#making-changes)
5. [Testing](#testing)
6. [Submitting Changes](#submitting-changes)
7. [Code Style Guidelines](#code-style-guidelines)
8. [Commit Message Guidelines](#commit-message-guidelines)
9. [Pull Request Process](#pull-request-process)
10. [Reporting Bugs](#reporting-bugs)
11. [Suggesting Enhancements](#suggesting-enhancements)

---

## Code of Conduct

### Our Pledge

I am committed to providing a welcoming and inspiring community for all. Please read and adhere to our Code of Conduct:

- Be respectful and inclusive
- Welcome newcomers and help them get oriented
- Focus on what is best for the community
- Show empathy towards other community members
- Be patient and constructive in discussions

### Unacceptable Behavior

Unacceptable behaviors include but are not limited to:
- Harassment or discrimination of any kind
- Personal attacks or insults
- Disruptive comments or behavior
- Sharing others' private information without consent

---

## Getting Started

### Prerequisites

- **Git** for version control
- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Docker** (optional, for containerized development)

### Fork & Clone

```bash
# 1. Fork the repository on GitHub
# Visit: https://github.com/keyloop/unified-document-viewer
# Click "Fork" button

# 2. Clone your fork
git clone https://github.com/your-username/unified-document-viewer.git
cd unified-document-viewer

# 3. Add upstream remote
git remote add upstream https://github.com/keyloop/unified-document-viewer.git

# 4. Verify remotes
git remote -v
```

---

## Development Setup

### Install Dependencies

```bash
# Install all dependencies
npm install

# Verify installation
npm run build
npm test
```

### Create Environment File

```bash
# Copy example environment file
cp .env.example .env

# Update with your local settings if needed
```

### Start Development Server

```bash
# Terminal 1: Start the dev server
npm run dev

# Terminal 2: Run tests in watch mode
npm test -- --watch
```

---

## Making Changes

### Create Feature Branch

```bash
# Update main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description

# Or for documentation
git checkout -b docs/doc-description
```

### Branch Naming Conventions

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `test/description` - Adding/updating tests
- `chore/description` - Build, dependencies, etc.

### Coding Standards

#### TypeScript
- Use strict type checking (`strict: true`)
- Avoid `any` type (use `unknown` with type guards)
- Document public APIs with JSDoc comments
- Use meaningful variable and function names

```typescript
// ❌ Bad
const search = (v: any): any => {
  // ...
};

// ✅ Good
/**
 * Search for documents by VIN
 * @param vin The vehicle identification number (17 chars)
 * @returns Array of matching documents
 * @throws ValidationError if VIN is invalid
 */
const searchByVin = (vin: string): Promise<Document[]> => {
  // ...
};
```

#### Error Handling
- Use custom error classes from `AppError.ts`
- Always provide meaningful error messages
- Log errors appropriately (avoid logging sensitive data)

```typescript
// ❌ Bad
if (!vin) throw new Error('Invalid VIN');

// ✅ Good
if (!vin || vin.length !== 17) {
  throw new ValidationError('VIN must be exactly 17 characters');
}
```

#### Comments & Documentation
- Write clear, concise comments
- Document complex business logic
- Update comments when changing code
- Use JSDoc for public functions/classes

```typescript
// ✅ Good
/**
 * Aggregates search results from multiple sources
 * Handles partial failures gracefully
 * @param results Array of search results from different APIs
 * @returns Aggregated result with errors tracked separately
 */
export const aggregateResults = (results: SearchResult[]): AggregatedResult => {
  // Implementation...
};
```

### Testing Requirements

Write tests for new features:

```typescript
describe('My Feature', () => {
  let service: MyService;

  beforeEach(() => {
    // Setup
    service = new MyService();
  });

  describe('happy path', () => {
    it('should return expected result', async () => {
      const result = await service.doSomething();
      expect(result).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should throw ValidationError for invalid input', () => {
      expect(() => service.doSomething(null)).toThrow(ValidationError);
    });
  });

  afterEach(() => {
    // Cleanup
  });
});
```

---

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test -- ValidationService.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should validate"

# Watch mode
npm test -- --watch
```

### Coverage Requirements

- **Overall**: Minimum 70% coverage
- **Services**: Minimum 90% coverage
- **Controllers**: Minimum 80% coverage
- **Utilities**: Minimum 85% coverage

### Before Submitting PR

```bash
# Ensure all tests pass
npm test

# Verify code formatting
npm run format

# Run linter
npm run lint

# Build successfully
npm run build
```

---

## Submitting Changes

### Commit Your Changes

```bash
# Stage changes
git add .

# Or stage specific files
git add src/my-feature.ts tests/my-feature.test.ts

# Commit with message
git commit -m "feat: add my amazing feature"
```

### Keep Branch Updated

```bash
# Fetch latest from upstream
git fetch upstream

# Rebase your branch
git rebase upstream/main

# Or merge if you prefer
git merge upstream/main
```

### Push to Your Fork

```bash
# Push branch
git push origin feature/your-feature-name

# Force push (only if necessary, after rebase)
git push origin feature/your-feature-name --force-with-lease
```

---

## Code Style Guidelines

### Formatting

```bash
# Auto-format all code
npm run format

# Check formatting without changing
npm run format:check

# Format specific file
npx prettier --write src/my-file.ts
```

### Linting

```bash
# Check for linting issues
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Directory Structure

Keep code organized:

```
src/
├── domain/              # Business entities
│   └── entities/
│       ├── Document.ts
│       └── SearchLog.ts
├── application/         # Business logic
│   ├── services/
│   │   └── DocumentSearchService.ts
│   └── dto/
│       └── SearchDocumentRequest.ts
├── interface-adapters/  # API layer
│   ├── controllers/
│   │   └── DocumentSearchController.ts
│   └── repositories/
│       └── SearchHistoryRepository.ts
└── frameworks/          # Technology layer
    └── logger/
        └── Logger.ts
```

---

## Commit Message Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build, dependencies, etc.
- `perf`: Performance improvements

### Examples

```bash
# Feature
git commit -m "feat(search): add VIN validation"

# Bug fix
git commit -m "fix(api): handle timeout errors gracefully"

# Documentation
git commit -m "docs: add deployment guide"

# Test addition
git commit -m "test(service): add edge case tests"

# Refactoring
git commit -m "refactor(service): extract validation logic"
```

### Message Body

- Explain **what** and **why**, not **how**
- Wrap at 72 characters
- Use imperative mood ("add" not "adds" or "added")

```
feat(search): add document deduplication

Add logic to remove duplicate documents from aggregated results.
Duplicates are identified by matching document URL and VIN.
This reduces clutter in search results and improves UX.

Closes #123
```

---

## Pull Request Process

### Before Creating PR

1. ✅ Code is complete and tested
2. ✅ All tests pass (`npm test`)
3. ✅ Code is formatted (`npm run format`)
4. ✅ Linting passes (`npm run lint`)
5. ✅ Build succeeds (`npm run build`)
6. ✅ Commits follow guidelines
7. ✅ Documentation is updated
8. ✅ No console.log() statements
9. ✅ No commented-out code

### Creating PR

```bash
# Push your branch
git push origin feature/your-feature-name

# Go to GitHub and create Pull Request
```

### PR Template

```markdown
## Description
Brief description of what this PR does

## Motivation and Context
Why is this change needed?

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] All tests pass locally

## Screenshots (if applicable)
Include screenshots for UI changes

## Related Issues
Closes #<issue_number>
```

### PR Review Process

Your PR will be reviewed for:
- ✓ Functionality - Does it work as intended?
- ✓ Code Quality - Is the code clean and maintainable?
- ✓ Testing - Are tests adequate?
- ✓ Documentation - Is it well documented?
- ✓ Performance - Are there any performance issues?
- ✓ Security - Are there any security concerns?

---

## Reporting Bugs

### Before Reporting

1. Check existing issues (open and closed)
2. Verify the bug still exists on latest code
3. Try to reproduce with minimal example

### Bug Report Template

```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. Step 1
2. Step 2
3. ...

## Expected Behavior
What should happen?

## Actual Behavior
What actually happens?

## Environment
- OS: [e.g., Ubuntu 20.04]
- Node version: [e.g., 18.0.0]
- npm version: [e.g., 9.0.0]

## Logs/Stack Trace
```
Provide relevant logs or stack traces
```

## Possible Solution
Any ideas on how to fix this?

## Additional Context
Any other context?
```

---

## Suggesting Enhancements

### Enhancement Request Template

```markdown
## Description
Clear description of the enhancement

## Motivation
Why should this feature be added?

## Proposed Solution
How should this work?

## Alternatives Considered
Alternative approaches

## Additional Context
Any other relevant information
```

---

## Development Tools

### Recommended IDE Extensions

#### VS Code
- ESLint
- Prettier
- TypeScript Vue Plugin
- REST Client
- Thunder Client or Postman

### Useful npm Scripts

```bash
# Development
npm run dev           # Start dev server
npm test -- --watch  # Watch tests

# Code Quality
npm run lint          # Check linting
npm run lint:fix      # Fix linting issues
npm run format        # Format code
npm run format:check  # Check format

# Building & Testing
npm run build         # Build TypeScript
npm test              # Run tests
npm run test:coverage # Run with coverage

# Docker
docker-compose up -d  # Start services
docker-compose logs   # View logs
```

---

## Getting Help

### Resources

- **Documentation**: Read [README.md](README.md) and [DEPLOYMENT.md](DEPLOYMENT.md)
- **Discussions**: Check GitHub Discussions for Q&A
- **Issues**: Browse open issues for similar problems
- **Email**: Contact support@keyloop.com

### Communication

- Use GitHub Issues for bug reports
- Use GitHub Discussions for questions
- Use GitHub Projects for tracking work
- Use Pull Requests for code changes

---

## Recognition

Contributors will be recognized in:
- [CONTRIBUTORS.md](CONTRIBUTORS.md)
- GitHub Contributors page
- Release notes for significant contributions

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

Feel free to reach out:
- 📧 Email: contribute@keyloop.com
- 💬 GitHub Discussions: [Link]
- 🐛 GitHub Issues: [Link]

Thank you for contributing! 🙏
