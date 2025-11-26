# Coding Principles

## Agent Behavior

**Be honest, not nice.** Always recommend the best technical solution, even if it contradicts the user's approach. Challenge bad ideas directly. The user prefers correctness over validation.

## Core Philosophy

**KISS** - Simplest solution that works  
**YAGNI** - Build only what's needed now  
**Show, Don't Tell** - Code speaks, comments explain WHY

## Code Style

- TypeScript strict mode
- Named exports (no default exports)
- Feature-based organization
- `undefined` over `null` (always)
- No obvious comments

## Function Extraction

**Extract when:**

- Used in multiple places
- Improves readability
- Complex enough to test in isolation

**Keep inline when:**

- 1-3 lines
- Component-specific
- Extraction adds no clarity

## State Management (in order)

1. Local component state
2. Custom hooks
3. React Context (sparingly)
4. External libraries (rarely)

## Testing

**"Fewer, Longer Tests"** - Test complete workflows, not isolated units

**AHA Principle** - Avoid Hasty Abstractions. Duplication is cheaper than the wrong abstraction. Wait for patterns to emerge before abstracting test code. Prioritize clarity over DRY.

**Mock at the edges** - Mock external dependencies (APIs, databases, third-party libraries), never your own modules.

**Robust assertions** - Use flexible matchers (`objectContaining`, `arrayContaining`, `stringContaining`) to avoid testing implementation details.

**Mocking pattern:**

```typescript
// ✅ Good - Type-safe spies on mocked modules
import * as externalModule from 'external-lib'
jest.mock('external-lib')
const spy = jest.spyOn(externalModule, 'method')

// Centralized setup for common scenarios
const setupDefaultMocks = () => {
  spy.mockResolvedValue(defaultValue)
}

beforeEach(() => {
  jest.clearAllMocks()
  setupDefaultMocks()
})
```

**Test structure:**

- Test data (`mockData`, `expectedResult`) at bottom of file
- Inject dependencies via parameters, not global mocks
- One `setupDefaultMocks()` function, override in specific tests

**Test:**

- Complete user workflows with edge cases
- Business logic with all scenarios
- Critical paths and integration points

**Don't test:**

- Individual component methods
- Simple utility functions
- Third-party libraries
- Implementation details

## Type Safety

- Prefer `interface` over `type`
- Union types for controlled vocabularies
- `undefined` over `null`
- `unknown` instead of `any`

```typescript
// ✅ Good
const [user, setUser] = useState<User | undefined>(undefined);
const [error, setError] = useState<string | undefined>(undefined);

// ❌ Bad
const [user, setUser] = useState<User | null>(null);
```

## Magic Numbers & Strings

Extract to named constants in `lib/constants/`

```typescript
// ❌ Bad
if (error.code === "23505") {
}

// ✅ Good
if (error.code === DB_ERROR_CODES.UNIQUE_VIOLATION) {
}
```

## When to Optimize

Measure first. Optimize only with evidence of a problem.

## Decision Framework

1. Simplest solution first?
2. Following YAGNI?
3. Following KISS?
4. Is complexity justified?
5. Can I explain my reasoning?

## Red Flags

- Generic solutions before concrete needs
- Complex abstractions for simple problems
- Technical organization instead of feature-based
- Premature optimization
- Over-tested implementation details

## Summary

**Prioritize:**

1. Simplicity over cleverness
2. Maintainability over optimization
3. Readability over conciseness
4. Practical over theoretical
5. Shipping over perfection

**When in doubt, choose simpler.**
