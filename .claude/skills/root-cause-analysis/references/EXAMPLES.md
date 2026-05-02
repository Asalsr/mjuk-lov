<!-- Scout Header
Purpose: Real-world RCA examples (test pollution, state mutations, multi-layer debugging)
When to use: When performing root cause analysis and need reference examples for technique selection
Size: ~133 lines
-->

# Root Cause Analysis - Detailed Examples

## Real-World Example: Test Pollution

**Symptom:** Test creates `.git` directory in source code

**Full Analysis:**
```markdown
## Root Cause Analysis

### Symptom
- What: `.git` created in `packages/core/src/`
- Where: Test suite execution
- When: Running integration tests

### Immediate Cause
- Code: `git-utils.ts:42`
- Operation: `execFileAsync('git', ['init'], { cwd: '' })`
- Invalid Input: `cwd` is empty string -> resolves to `process.cwd()`

### Call Chain
1. `gitInit(projectDir='')` - executes in wrong dir
2. `WorktreeManager.createWorktree(projectDir='', ...)` - passes empty
3. `Session.initializeWorkspace()` - passes empty
4. `Session.create(projectDir='')` - receives empty
5. `test: Project.create('test', context.tempDir)` - uses uninitialized value

### Root Cause
- Source: `setupCoreTest()` returns `{ tempDir: '' }` initially
- Why: `tempDir` accessed before `beforeEach` hook sets it
- Propagation: '' -> Session -> WorkspaceManager -> gitInit -> process.cwd()

### Fix Strategy
- Fix Location: `setupCoreTest()` (at source)
- Change: Make `tempDir` a getter that throws if accessed too early
- Validation: Prevent early access via error

### Defense in Depth
- Layer 1: Getter validation in setupCoreTest
- Layer 2: Project.create validates dir not empty
- Layer 3: NODE_ENV guard in gitInit
- Layer 4: Debug logging before git commands
```

**Outcome:**
- Fixed at source (setupCoreTest getter)
- Added 4 layers of defense
- 1847 tests pass, zero pollution
- Bug now impossible

---

## Ad-Hoc Usage Examples

**Example 1: Quick "Where does this come from?"**
```
User: "Why is userId undefined here?"
Assistant: "I'm using the root-cause-analysis skill to trace this back."

[Traces data flow backward to source]
```

**Example 2: During Implementation**
```
During /implement:
Assistant: "I'm encountering an unexpected value. Using root-cause-analysis
to trace where it originates."

[Applies tracing within workflow]
```

**Example 3: Complex Multi-Layer Bug**
```
User: "The API is receiving wrong data but I can't figure out where"
Assistant: "I'll use root-cause-analysis to trace through each layer."

[Systematic layer-by-layer tracing]
```

---

## Multi-Layer System Tracing Example

**When debugging across layers (UI -> API -> Service -> Database):**

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

## Test Pollution Bisection Script

**When something appears during tests but you don't know which test:**

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

Or use a bisection script if available.
