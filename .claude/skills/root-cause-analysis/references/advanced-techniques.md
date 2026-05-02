<!-- Scout Header
Purpose: Advanced instrumentation techniques for root cause analysis (stack traces, logging, binary search)
When to use: When manual backward tracing is insufficient — need instrumentation to find origin
Size: ~198 lines
-->

# Advanced RCA Techniques

## Adding Stack Traces

When you can't trace manually, add instrumentation:

```typescript
// Before the problematic operation
function performOperation(value: string) {
  const stack = new Error().stack;
  console.error('DEBUG performOperation:', {
    value,
    valueType: typeof value,
    valueLength: value.length,
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
    stack,
    timestamp: Date.now(),
  });

  // ... actual operation
}
```

**Critical insights:**
- Use `console.error()` in tests (not logger - may be suppressed)
- Log BEFORE the operation fails (not after)
- Include context: value, type, environment, stack
- Run and capture output

**Capture output:**
```bash
# Run test and capture debug output
npm test 2>&1 | grep 'DEBUG performOperation'

# Or save to file
npm test 2>&1 > debug.log
cat debug.log | grep 'DEBUG'
```

**Analyze stack traces:**
- Look for test file names or component paths
- Find line numbers that triggered the call
- Identify patterns (same test? same parameter?)
- Follow the call chain upward

---

## Multi-Layer System Tracing

When debugging across layers (UI → API → Service → Database):

```markdown
## Layer-by-Layer Tracing

### Layer 1: UI Component
- Input: User clicks "Submit" button
- Output: API call with data = { userId: undefined }
- **Issue Found:** userId is undefined

### Layer 2: Form Handler
- Input: Form state
- Output: { userId: formState.userId }
- **Trace Up:** Where does formState.userId come from?

### Layer 3: Form State Initialization
- Input: User data from props
- Output: { userId: props.user?.id }
- **Issue Found:** props.user is undefined

### Layer 4: Component Props
- Input: Redux state
- Output: user = state.currentUser
- **Trace Up:** Where is currentUser set?

### Layer 5: Redux Action (ROOT CAUSE)
- Login action sets currentUser
- **BUT:** Page loads before login completes
- **Fix:** Add loading state or redirect to login
```

---

## Finding Test Pollution

When something appears during tests but you don't know which test:

Use bisection to find the polluter:

```bash
# Run tests one by one to find which creates the artifact
for test in src/**/*.test.ts; do
  echo "Testing: $test"
  npm test "$test"
  if [ -e ".git" ]; then
    echo "POLLUTER FOUND: $test"
    break
  fi
done
```

---

## Tracing Patterns

### Pattern 1: Data Flow Tracing

```
Bad data appears → Trace backward

Example: Email validation fails with "undefined is not a valid email"

Symptom: validateEmail(email) fails
  ↑
email = formData.email
  ↑
formData = { email: userData.email }
  ↑
userData = props.user
  ↑
props.user = undefined (ROOT CAUSE: user not loaded yet)

Fix: Add loading state or null check at source
```

### Pattern 2: Configuration Tracing

```
Wrong config value → Trace to source

Example: API URL is http://localhost instead of production URL

Symptom: API_URL = 'http://localhost'
  ↑
API_URL = process.env.NEXT_PUBLIC_API_URL
  ↑
.env file has wrong value
  ↑
.env file not committed (ROOT CAUSE: missing from git)

Fix: Add .env.example with correct structure, document setup
```

### Pattern 3: State Mutation Tracing

```
State is wrong → Find who changed it

Example: User object has role = 'admin' when it should be 'user'

Symptom: user.role = 'admin'
  ↑
Set by: handleRoleChange()
  ↑
Called by: RoleSelector onChange
  ↑
RoleSelector shows 'admin' option (ROOT CAUSE: shouldn't be available)

Fix: Filter role options based on permissions at source
```

---

## Defense in Depth

After finding root cause, add validation at each layer:

```typescript
// Layer 1: At source - validate input
function setupTest() {
  return {
    get tempDir() {
      if (!this._tempDir) {
        throw new Error('tempDir accessed before initialization');
      }
      return this._tempDir;
    }
  };
}

// Layer 2: At usage - validate before operation
function createProject(dir: string) {
  if (!dir || dir.trim() === '') {
    throw new Error('Project directory cannot be empty');
  }
  // ... proceed
}

// Layer 3: At execution - validate environment
function gitInit(dir: string) {
  if (process.env.NODE_ENV === 'test' && !dir.includes('tmp')) {
    throw new Error('Refusing to run git init outside tmp during tests');
  }
  // ... proceed
}
```

**Result:** Bug becomes impossible, not just unlikely.
