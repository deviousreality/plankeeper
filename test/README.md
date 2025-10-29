# Testing with Vitest

This directory contains unit and integration tests for the PlantKeeper application.

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

- `test/` - Test files and setup
  - `setup.ts` - Global test setup and mocks
  - `*.test.ts` - Unit test files

## Writing Tests

Tests are written using Vitest and Vue Test Utils. Example:

```typescript
import { describe, it, expect } from 'vitest';

describe('MyComponent', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

## Coverage

Coverage reports are generated in the `coverage/` directory when running `npm run test:coverage`.
