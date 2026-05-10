# Pipeline Step Development Guide

This guide explains how to write custom pipeline steps that integrate seamlessly with the bookmark aggregation pipeline.

## Table of Contents

1. [Step Interface](#step-interface)
2. [AggregationData API](#aggregationdata-api)
3. [Step Lifecycle](#step-lifecycle)
4. [Step Patterns](#step-patterns)
5. [Error Handling](#error-handling)
6. [Testing Strategy](#testing-strategy)
7. [Registering Custom Steps](#registering-custom-steps)
8. [Common Pitfalls](#common-pitfalls)

---

## Step Interface

All pipeline steps must implement the `Step<InputType, OutputType>` interface:

```typescript
import type { Step } from '@bookmark/pipeline';

interface Step<Input, Output> {
  name: string; // Unique step identifier for logging
  execute(input: Input): Promise<Output>; // Async execution
}
```

### Example: Basic Step

```typescript
import type { Step } from '@bookmark/pipeline';
import type { AggregationData } from '@bookmark/cli';

class MyCustomStep implements Step<AggregationData, AggregationData> {
  name = 'MyCustomStep';

  async execute(data: AggregationData): Promise<AggregationData> {
    // Step implementation here
    return data;
  }
}
```

---

## AggregationData API

`AggregationData` is the shared state object passed through the pipeline. It contains:

### Fields

| Field | Type | Purpose | Populated By | Used By |
|-------|------|---------|--------------|---------|
| `projectRoot` | `string` | Root directory path | InitializeStep | All file loading steps |
| `config?` | `Config` | Feed configuration from feeds.json | LoadConfigurationStep | LoadRssStep, MergeLinksStep |
| `bookmarks` | `Link[]` | Links from bookmarks.xbel | LoadBookmarksStep | MergeLinksStep |
| `tabs` | `Link[]` | Links from tabs.xbel | LoadTabsStep | MergeLinksStep |
| `rssEntries` | `RssEntry[]` | Raw RSS entries (before parsing) | LoadRssStep | MergeLinksStep |

### Helper Functions

Safe access methods exported from `@bookmark/cli`:

```typescript
import { 
  getProjectRoot, 
  getConfig, 
  getLinks,
  createAggregationData 
} from '@bookmark/cli';

const projectRoot = getProjectRoot(data);        // Always available
const config = getConfig(data);                  // Throws if not loaded
const allLinks = getLinks(data);                 // Combines bookmarks + tabs
```

### Type Guards

```typescript
import { isAggregationData } from '@bookmark/cli';

if (isAggregationData(obj)) {
  // Safe to use as AggregationData
}
```

---

## Step Lifecycle

Every step follows this lifecycle:

### 1. Initialization

```typescript
class LoadConfigurationStep implements Step<AggregationData, AggregationData> {
  name = 'LoadConfiguration'; // Used in logs
  
  async execute(data: AggregationData): Promise<AggregationData> {
    // Step runs here
  }
}
```

### 2. Execution

- Step is called with input (string for first step, AggregationData for subsequent steps)
- Step can read any fields from AggregationData
- Step modifies fields relevant to its responsibility
- Step returns modified AggregationData for next step

### 3. Output Contract

Each step must document:
- What fields it **reads** (dependencies on previous steps)
- What fields it **writes** (mutations)
- What assumptions it makes (e.g., "config must be loaded")

---

## Step Patterns

### Pattern 1: Load Step

Load external data into AggregationData. Returns AggregationData with new field populated.

```typescript
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Step } from '@bookmark/pipeline';
import type { AggregationData } from '@bookmark/cli';
import type { Config } from '@bookmark/types';
import { validateConfig } from '@bookmark/validation';

class LoadConfigurationStep implements Step<AggregationData, AggregationData> {
  name = 'LoadConfiguration';

  async execute(data: AggregationData): Promise<AggregationData> {
    try {
      const configPath = join(data.projectRoot, 'feeds.json');
      const content = readFileSync(configPath, 'utf-8');
      const config = validateConfig(JSON.parse(content));
      
      data.config = config; // Populate field
      return data;
    } catch (error) {
      console.warn('Failed to load config:', error);
      // Return with empty/default state - don't throw unless fatal
      return data;
    }
  }
}
```

**Key points:**
- Read from `data.projectRoot` to locate files
- Populate single field (e.g., `data.config`)
- Log warnings for non-fatal errors
- Always return modified AggregationData

### Pattern 2: Transform Step

Transform existing fields in AggregationData. Reads one field, writes another.

```typescript
import type { Step } from '@bookmark/pipeline';
import type { AggregationData, Link } from '@bookmark/cli';
import { parserRegistry } from '@bookmark/parsers';

class TransformRssStep implements Step<AggregationData, AggregationData> {
  name = 'TransformRss';

  async execute(data: AggregationData): Promise<AggregationData> {
    if (data.rssEntries.length === 0) {
      return data; // No entries to transform
    }

    try {
      // Parse RSS entries to links using parser registry
      const result = await parserRegistry.parse('rss', data.rssEntries);
      
      if (result.errors.length > 0) {
        console.warn(`⚠ ${result.errors.length} RSS entries had errors`);
      }
      
      // Add RSS links to bookmarks array
      data.bookmarks.push(...result.links);
      return data;
    } catch (error) {
      console.warn('Failed to transform RSS entries:', error);
      return data;
    }
  }
}
```

**Key points:**
- Check preconditions (e.g., `rssEntries.length > 0`)
- Transform one field into another
- Handle partial failures gracefully
- Return modified data for next step

### Pattern 3: Validate Step

Validate AggregationData state. Returns same type (usually AggregationData).

```typescript
import type { Step } from '@bookmark/pipeline';
import type { AggregationData } from '@bookmark/cli';
import { getConfig } from '@bookmark/cli';

class ValidateConfigStep implements Step<AggregationData, AggregationData> {
  name = 'ValidateConfig';

  async execute(data: AggregationData): Promise<AggregationData> {
    try {
      // Use helper to get config (throws if missing)
      const config = getConfig(data);
      
      // Perform validation checks
      if (!config.feeds || config.feeds.length === 0) {
        throw new Error('Config must have at least one feed');
      }

      console.log(`✅ Config valid with ${config.feeds.length} feed(s)`);
      return data;
    } catch (error) {
      // Validation errors ARE fatal - step should throw
      throw error;
    }
  }
}
```

**Key points:**
- Depend on previous steps (use `getConfig()` for safe access)
- Throw on validation failures (these are fatal)
- Log success state
- Return unmodified data

### Pattern 4: Output Step

Transform final AggregationData to output format. Typically last step.

```typescript
import type { Step } from '@bookmark/pipeline';
import type { AggregationData, Link } from '@bookmark/cli';
import { combine } from '@bookmark/core';

class MergeLinksStep implements Step<AggregationData, Link[]> {
  name = 'MergeLinks';

  async execute(data: AggregationData): Promise<Link[]> {
    console.log('🔀 Merging and deduplicating...');
    
    // Parse RSS entries to links
    const rssResult = await parserRegistry.parse('rss', data.rssEntries);
    if (rssResult.errors.length > 0) {
      console.warn(`   ⚠ ${rssResult.errors.length} RSS entries had errors`);
    }

    // Combine all sources
    const allLinks = combine([
      data.bookmarks,
      data.tabs,
      rssResult.links
    ]);

    console.log(`   Total unique links: ${allLinks.length}`);
    return allLinks;
  }
}
```

**Key points:**
- Output step returns different type than input
- Combines data from multiple fields
- Performs final transformations
- Reports aggregated statistics

---

## Error Handling

### Non-Fatal Errors (Log & Continue)

Use for errors that don't prevent aggregation:

```typescript
try {
  // Try to load optional file
  const data = loadOptionalData();
} catch (error) {
  console.warn('Optional file missing, continuing:', error);
  // Return data without this field - don't throw
}
```

### Fatal Errors (Throw)

Use for errors that make the pipeline unsafe:

```typescript
try {
  const config = getConfig(data); // Uses helper that throws
  // If config is missing, this throws - that's correct
} catch (error) {
  // Re-throw: this error blocks the pipeline
  throw new Error(`Cannot proceed without config: ${error}`);
}
```

### Error Reporting Pattern

```typescript
class MyStep implements Step<AggregationData, AggregationData> {
  name = 'MyStep';

  async execute(data: AggregationData): Promise<AggregationData> {
    console.log('📝 Starting MyStep...');
    
    try {
      // Main work
      return data;
    } catch (error) {
      // Distinguish fatal vs non-fatal
      if (isFatal(error)) {
        console.error('❌ Fatal error:', error);
        throw error;
      }
      
      console.warn('⚠ Non-fatal error:', error);
      return data; // Continue with degraded state
    }
  }
}
```

---

## Testing Strategy

### Unit Test Template

```typescript
import { test } from 'node:test';
import assert from 'node:assert';
import { MyCustomStep } from './my-step.js';
import { createAggregationData } from '@bookmark/cli';

test('MyCustomStep - processes data correctly', async () => {
  // Arrange
  const step = new MyCustomStep();
  const data = createAggregationData('/tmp/test');
  data.bookmarks = [
    { id: '1', title: 'Test', url: 'https://example.com', source: 'bookmark' }
  ];

  // Act
  const result = await step.execute(data);

  // Assert
  assert.strictEqual(result.bookmarks.length, 1);
  assert.strictEqual(result.bookmarks[0].title, 'Test');
});

test('MyCustomStep - handles missing dependencies', async () => {
  // Arrange
  const step = new MyCustomStep();
  const data = createAggregationData('/tmp/test');
  // Don't populate optional fields

  // Act - should not throw
  const result = await step.execute(data);

  // Assert - should return gracefully
  assert.ok(result);
});

test('MyCustomStep - throws on fatal errors', async () => {
  // Arrange
  const step = new MyCustomStep();
  const data = createAggregationData('/nonexistent/path');

  // Act & Assert
  assert.rejects(
    () => step.execute(data),
    /Error message pattern/
  );
});
```

### Integration Test Pattern

```typescript
import { typedPipeline } from '@bookmark/pipeline';
import { MyCustomStep } from './my-step.js';

test('MyCustomStep - integrates with pipeline', async () => {
  const result = await typedPipeline<string>()
    .addStep(new InitializeStep())
    .addStep(new LoadConfigurationStep())
    .addStep(new MyCustomStep())
    .execute('/tmp/test');

  assert(result);
});
```

---

## Registering Custom Steps

### In CLI Pipeline

Add to the `generate()` function in `packages/cli/src/index.ts`:

```typescript
export async function generate(projectRoot: string = process.cwd()): Promise<Link[]> {
  try {
    const result = await typedPipeline<string>()
      .addStep(new InitializeStep())
      .addStep(new LoadConfigurationStep())
      .addStep(new LoadBookmarksStep())
      .addStep(new LoadTabsStep())
      .addStep(new LoadRssStep())
      .addStep(new MyCustomStep())  // Add here
      .addStep(new MergeLinksStep())
      .execute(projectRoot);

    return result;
  } catch (error) {
    console.error('Error during generation:', error);
    throw error;
  }
}
```

### For External Use

Export your step from a package and let users integrate it:

```typescript
export { MyCustomStep } from '@my-org/bookmark-steps';

// User code:
import { MyCustomStep } from '@my-org/bookmark-steps';
import { typedPipeline } from '@bookmark/pipeline';

const result = await typedPipeline<string>()
  .addStep(new InitializeStep())
  .addStep(new MyCustomStep())  // User adds custom step
  .execute(projectRoot);
```

---

## Common Pitfalls

### ❌ Modifying Fields You Shouldn't

```typescript
// BAD: Clears fields other steps depend on
async execute(data: AggregationData): Promise<AggregationData> {
  data.bookmarks = []; // DON'T DO THIS - other steps need these
  return data;
}
```

**Solution:** Only modify fields your step owns. Document what you read vs. write.

### ❌ Not Handling Missing Config

```typescript
// BAD: Assumes config is loaded
async execute(data: AggregationData): Promise<AggregationData> {
  const feeds = data.config.feeds; // CRASH if config missing
  return data;
}
```

**Solution:** Use `getConfig()` helper which throws clearly:

```typescript
async execute(data: AggregationData): Promise<AggregationData> {
  const config = getConfig(data); // Throws with clear message
  const feeds = config.feeds;
  return data;
}
```

### ❌ Throwing on Non-Fatal Errors

```typescript
// BAD: Stops pipeline when it could continue
async execute(data: AggregationData): Promise<AggregationData> {
  try {
    const optional = loadOptionalFile();
  } catch (error) {
    throw error; // Blocks entire pipeline
  }
}
```

**Solution:** Distinguish fatal vs. recoverable errors:

```typescript
async execute(data: AggregationData): Promise<AggregationData> {
  try {
    const optional = loadOptionalFile();
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn('Optional file not found, continuing');
      return data; // Graceful degradation
    }
    throw error; // Only throw truly fatal errors
  }
}
```

### ❌ Not Testing Preconditions

```typescript
// BAD: Works only if previous step ran
async execute(data: AggregationData): Promise<AggregationData> {
  // Assumes bookmarks are loaded - what if they're not?
  for (const link of data.bookmarks) { ... }
}
```

**Solution:** Check preconditions and handle gracefully:

```typescript
async execute(data: AggregationData): Promise<AggregationData> {
  if (data.bookmarks.length === 0) {
    console.log('No bookmarks to process');
    return data; // Safe exit
  }
  for (const link of data.bookmarks) { ... }
}
```

---

## Best Practices

1. **Document Step Contract** - Clearly state what you read, what you write, what assumptions you make
2. **Use Helper Functions** - Use `getConfig()`, `getProjectRoot()`, `getLinks()` for safe field access
3. **Log Meaningfully** - Use emoji prefixes for status (📚, 📑, 🔀, ⚠, ❌, ✅)
4. **Handle Partial Failures** - Report how many items failed but continue if possible
5. **Avoid Side Effects** - Don't modify global state or call external APIs without reason
6. **Test Thoroughly** - Include edge cases, missing dependencies, error scenarios
7. **Type Safely** - Use `Step<InputType, OutputType>` to encode contract in types

---

## See Also

- [Pipeline Documentation](./PIPELINE.md)
- [AggregationData API](../packages/cli/src/pipeline-context.ts)
- [Example Steps](../packages/cli/src/index.ts) - LoadBookmarksStep, LoadTabsStep, MergeLinksStep
