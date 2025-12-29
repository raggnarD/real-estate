# Testing Guide

This project uses a comprehensive testing setup with unit tests (Jest) and integration tests (Playwright).

## Setup

### Install Dependencies

```bash
npm install --legacy-peer-deps
```

**Note:** We use `--legacy-peer-deps` because React 19 is very new and some testing libraries haven't updated their peer dependencies yet. This is safe to use.

### Install Playwright Browsers

```bash
npx playwright install
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Integration Tests (E2E)

```bash
# Run all integration tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug
```

### Run All Tests

```bash
npm run test:all
```

## Test Structure

### Unit Tests

Unit tests are located alongside the code they test:
- `utils/__tests__/` - Utility function tests
- `components/__tests__/` - Component tests
- `contexts/__tests__/` - Context provider tests

### Integration Tests

Integration tests are located in:
- `e2e/` - End-to-end test files

## Writing Tests

### Unit Test Example

```typescript
import { render, screen } from '@testing-library/react'
import MyComponent from '../MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Integration Test Example

```typescript
import { test, expect } from '@playwright/test'

test('should navigate to page', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Welcome')).toBeVisible()
})
```

## CI/CD Integration

Tests run automatically on:
- Every push to `main` or `develop` branches
- Every pull request

The GitHub Actions workflow (`.github/workflows/test.yml`) runs:
1. Unit tests with coverage
2. Integration tests
3. Build validation

## Coverage Thresholds

The project maintains minimum coverage thresholds:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Vercel Integration

Vercel will automatically run tests during the build process if you configure it in your `vercel.json` or project settings. Add a build command that includes tests:

```json
{
  "buildCommand": "npm run test:unit && npm run build"
}
```

## Best Practices

1. **Write tests before fixing bugs** - Create a failing test that reproduces the bug, then fix it
2. **Test user behavior, not implementation** - Focus on what users see and do
3. **Keep tests isolated** - Each test should be independent
4. **Use descriptive test names** - Test names should clearly describe what they test
5. **Mock external dependencies** - Don't make real API calls in unit tests
6. **Test edge cases** - Include tests for error conditions and boundary cases

