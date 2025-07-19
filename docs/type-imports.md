# TypeScript Type-Only Imports Guide for PlantKeeper

## What is `verbatimModuleSyntax`?

The `verbatimModuleSyntax` compiler option in TypeScript enforces explicit type-only imports, helping to avoid potential runtime issues by ensuring that type information doesn't inadvertently affect the compiled JavaScript output.

## How to Import Types Correctly

When `verbatimModuleSyntax` is enabled (as it is in our project), you must use the `type` keyword when importing types:

### Correct way to import types:

```typescript
// Importing both values and types
import { someFunction } from './module';
import type { SomeType } from './module';

// Importing a type from a module that only exports types
import type { User } from '~/server/utils/db';

// Importing specific types from a value import
import Database from 'better-sqlite3';
import type { RunResult } from 'better-sqlite3';
```

### Incorrect ways that will cause errors:

```typescript
// This will cause an error if CareAction is just a type
import { CareAction } from '~/types';

// This will cause an error if User is just a type
import { db, User } from '~/server/utils/db';
```

## Common Scenarios

1. **Importing from type-only modules**:

   ```typescript
   import type { ApiResponse, ErrorResponse } from '~/types';
   ```

2. **Mixed imports (values and types)**:

   ```typescript
   import { db } from '~/server/utils/db';
   import type { User, Plant } from '~/server/utils/db';
   ```

3. **Types from third-party libraries**:
   ```typescript
   import axios from 'axios';
   import type { AxiosResponse } from 'axios';
   ```

## Benefits of Using `type` Imports

1. **Tree-shaking optimization**: Type-only imports are completely removed from the compiled JavaScript.
2. **Clear documentation**: Makes it obvious what's a runtime value vs. a compile-time type.
3. **Improved build performance**: Helps the compiler optimize build times.
4. **Future-proofing**: Follows the latest TypeScript best practices.

## Further Reading

- [TypeScript Handbook: Modules](https://www.typescriptlang.org/docs/handbook/modules.html)
- [TypeScript 4.5: Type-Only Imports and Exports](https://devblogs.microsoft.com/typescript/announcing-typescript-4-5/#type-modifiers-on-import-names)
