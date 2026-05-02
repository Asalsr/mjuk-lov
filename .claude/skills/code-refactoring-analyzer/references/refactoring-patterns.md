<!-- Scout Header
Purpose: Comprehensive catalog of refactoring patterns with code examples and decision criteria
When to use: When suggesting specific refactoring approaches — provides pattern templates and guidance
Size: ~1030 lines
-->

# Refactoring Patterns Reference

## Overview

This reference provides a comprehensive catalog of refactoring patterns for improving code quality, maintainability, and structure. Each pattern includes practical guidance, code examples, and decision criteria to help identify and apply the most appropriate refactoring approach.

**Purpose:** Guide developers in transforming problematic code into cleaner, more maintainable solutions.

**Audience:** Developers, code reviewers, technical leads analyzing refactoring opportunities.

---

## Core Refactoring Patterns

### 1. Extract Method/Function

**Description:**
Take a code fragment and turn it into its own function with a descriptive name that explains its purpose.

**When to Use:**
- Function is too long (>50 lines)
- Code has complex logic that needs explanation
- Code fragment has a clear, single purpose
- Same logic appears in multiple places
- Function has high cyclomatic complexity (>10)

**Benefits:**
- Improves readability through self-documenting code
- Reduces duplication
- Makes testing easier (smaller units)
- Simplifies debugging
- Enables code reuse

**Before:**
```typescript
function processOrder(order: Order) {
  // Validate order
  if (!order.items || order.items.length === 0) {
    throw new Error('Order must have items');
  }
  if (!order.customerId) {
    throw new Error('Order must have customer');
  }

  // Calculate totals
  let subtotal = 0;
  for (const item of order.items) {
    subtotal += item.price * item.quantity;
  }
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  // Apply discount
  let discount = 0;
  if (order.customer.isPremium) {
    discount = total * 0.1;
  }
  const finalTotal = total - discount;

  return { subtotal, tax, total: finalTotal };
}
```

**After:**
```typescript
function processOrder(order: Order) {
  validateOrder(order);
  const subtotal = calculateSubtotal(order.items);
  const tax = calculateTax(subtotal);
  const discount = calculateDiscount(subtotal + tax, order.customer);

  return {
    subtotal,
    tax,
    total: subtotal + tax - discount
  };
}

function validateOrder(order: Order): void {
  if (!order.items || order.items.length === 0) {
    throw new Error('Order must have items');
  }
  if (!order.customerId) {
    throw new Error('Order must have customer');
  }
}

function calculateSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function calculateTax(amount: number): number {
  return amount * 0.08;
}

function calculateDiscount(total: number, customer: Customer): number {
  return customer.isPremium ? total * 0.1 : 0;
}
```

**Common Pitfalls:**
- Extracting too aggressively (creating single-line functions)
- Poor naming (e.g., `doStep1()` instead of `validateOrder()`)
- Breaking functions in illogical places
- Creating functions that require too many parameters (>5)

---

### 2. Split Class/Service

**Description:**
Divide a class or service with multiple responsibilities into separate, focused classes/services.

**When to Use:**
- Class/service has grown too large (>500 lines)
- Class handles multiple unrelated concerns
- Class has distinct groups of methods that don't interact
- Changes to one area frequently break another
- Difficult to name the class without using "and" or "Manager"

**Benefits:**
- Follows Single Responsibility Principle
- Easier to understand and maintain
- Better testability
- Reduces merge conflicts
- Enables independent evolution

**Before:**
```typescript
class UserService {
  // Authentication
  async login(email: string, password: string) { /* ... */ }
  async logout(userId: string) { /* ... */ }
  async resetPassword(email: string) { /* ... */ }

  // Profile Management
  async updateProfile(userId: string, data: ProfileData) { /* ... */ }
  async uploadAvatar(userId: string, file: File) { /* ... */ }
  async getProfile(userId: string) { /* ... */ }

  // Notifications
  async sendWelcomeEmail(userId: string) { /* ... */ }
  async sendPasswordResetEmail(email: string) { /* ... */ }
  async notifyProfileUpdate(userId: string) { /* ... */ }

  // Analytics
  async trackLogin(userId: string) { /* ... */ }
  async trackProfileView(userId: string) { /* ... */ }
}
```

**After:**
```typescript
class AuthenticationService {
  async login(email: string, password: string) { /* ... */ }
  async logout(userId: string) { /* ... */ }
  async resetPassword(email: string) { /* ... */ }
}

class UserProfileService {
  async updateProfile(userId: string, data: ProfileData) { /* ... */ }
  async uploadAvatar(userId: string, file: File) { /* ... */ }
  async getProfile(userId: string) { /* ... */ }
}

class NotificationService {
  async sendWelcomeEmail(userId: string) { /* ... */ }
  async sendPasswordResetEmail(email: string) { /* ... */ }
  async notifyProfileUpdate(userId: string) { /* ... */ }
}

class AnalyticsService {
  async trackEvent(event: AnalyticsEvent) { /* ... */ }
}
```

**Common Pitfalls:**
- Splitting too early (premature abstraction)
- Creating too many tiny services (over-fragmentation)
- Not considering service boundaries carefully
- Breaking related functionality apart
- Creating circular dependencies between new services

---

### 3. Extract Component

**Description:**
Extract a portion of a React component into a separate, reusable component.

**When to Use:**
- Component is too large (>300 lines)
- JSX has deep nesting (>4 levels)
- Same UI pattern appears multiple times
- Logical section can stand alone
- Component has multiple render responsibilities
- Testing would be easier with smaller components

**Benefits:**
- Improved reusability
- Better testability
- Clearer component hierarchy
- Easier to maintain
- Performance optimization opportunities (React.memo)

**Before:**
```typescript
function UserDashboard({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  async function fetchUserData() {
    const [userData, ordersData] = await Promise.all([
      fetchUser(userId),
      fetchOrders(userId)
    ]);
    setUser(userData);
    setOrders(ordersData);
    setLoading(false);
  }

  if (loading) return <Spinner />;
  if (!user) return <Error message="User not found" />;

  return (
    <div className="dashboard">
      {/* Profile Section */}
      <div className="profile-card">
        <img src={user.avatar} alt={user.name} />
        <h2>{user.name}</h2>
        <p>{user.email}</p>
        <button>Edit Profile</button>
      </div>

      {/* Orders Section */}
      <div className="orders-section">
        <h3>Recent Orders</h3>
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <span>Order #{order.id}</span>
              <span>{order.date}</span>
            </div>
            <div className="order-items">
              {order.items.map(item => (
                <div key={item.id}>
                  <span>{item.name}</span>
                  <span>${item.price}</span>
                </div>
              ))}
            </div>
            <div className="order-total">${order.total}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**After:**
```typescript
function UserDashboard({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  async function fetchUserData() {
    const [userData, ordersData] = await Promise.all([
      fetchUser(userId),
      fetchOrders(userId)
    ]);
    setUser(userData);
    setOrders(ordersData);
    setLoading(false);
  }

  if (loading) return <Spinner />;
  if (!user) return <Error message="User not found" />;

  return (
    <div className="dashboard">
      <ProfileCard user={user} />
      <OrdersList orders={orders} />
    </div>
  );
}

function ProfileCard({ user }: { user: User }) {
  return (
    <div className="profile-card">
      <img src={user.avatar} alt={user.name} />
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <button>Edit Profile</button>
    </div>
  );
}

function OrdersList({ orders }: { orders: Order[] }) {
  return (
    <div className="orders-section">
      <h3>Recent Orders</h3>
      {orders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  return (
    <div className="order-card">
      <div className="order-header">
        <span>Order #{order.id}</span>
        <span>{order.date}</span>
      </div>
      <div className="order-items">
        {order.items.map(item => (
          <OrderItem key={item.id} item={item} />
        ))}
      </div>
      <div className="order-total">${order.total}</div>
    </div>
  );
}

function OrderItem({ item }: { item: OrderItem }) {
  return (
    <div>
      <span>{item.name}</span>
      <span>${item.price}</span>
    </div>
  );
}
```

**Common Pitfalls:**
- Prop drilling (passing props through many levels)
- Breaking components without considering data flow
- Creating too many single-use components
- Not using composition patterns (children prop)
- Over-extracting (creating components for every div)

---

### 4. Rename for Clarity

**Description:**
Change names of variables, functions, classes, or components to better express their purpose and behavior.

**When to Use:**
- Name doesn't reflect current purpose
- Abbreviations are unclear (e.g., `usr`, `tmp`, `data`)
- Name is too generic (e.g., `handleClick`, `process`, `manager`)
- Business logic changed but name didn't
- Team struggles to understand what something does
- Name doesn't follow naming conventions

**Benefits:**
- Self-documenting code
- Reduced need for comments
- Easier onboarding for new developers
- Fewer misunderstandings
- Better code searchability

**Before:**
```typescript
function proc(d: any[]) {
  const res = [];
  for (const i of d) {
    if (i.s === 'a' && i.t > 18) {
      res.push(i);
    }
  }
  return res;
}

const usr = getCurrentUser();
const tmp = calculateDiscount(usr);
```

**After:**
```typescript
function filterActiveAdultUsers(users: User[]): User[] {
  const activeAdultUsers = [];
  for (const user of users) {
    if (user.status === 'active' && user.age > 18) {
      activeAdultUsers.push(user);
    }
  }
  return activeAdultUsers;
}

const currentUser = getCurrentUser();
const premiumDiscount = calculateDiscount(currentUser);
```

**Common Pitfalls:**
- Renaming without using IDE refactoring tools (breaking references)
- Names that are too long (>50 characters)
- Inconsistent naming conventions
- Renaming too frequently (churn)
- Not updating related documentation

---

### 5. Consolidate Duplicate Code

**Description:**
Identify similar or identical code blocks and extract them into shared functions or components.

**When to Use:**
- Same code appears 3+ times
- Logic is nearly identical with minor variations
- Bug fixes need to be applied in multiple places
- Changes cascade across similar code blocks
- Copy-paste programming is evident

**Benefits:**
- Single source of truth
- Easier maintenance
- Consistent behavior
- Reduced bug surface area
- Smaller codebase

**Before:**
```typescript
// User validation in registration
function registerUser(data: RegisterData) {
  if (!data.email || !data.email.includes('@')) {
    throw new Error('Invalid email');
  }
  if (!data.password || data.password.length < 8) {
    throw new Error('Password too short');
  }
  // ... registration logic
}

// User validation in profile update
function updateProfile(userId: string, data: ProfileData) {
  if (!data.email || !data.email.includes('@')) {
    throw new Error('Invalid email');
  }
  if (data.password && data.password.length < 8) {
    throw new Error('Password too short');
  }
  // ... update logic
}

// User validation in password reset
function resetPassword(email: string, newPassword: string) {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email');
  }
  if (!newPassword || newPassword.length < 8) {
    throw new Error('Password too short');
  }
  // ... reset logic
}
```

**After:**
```typescript
function validateEmail(email: string): void {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email');
  }
}

function validatePassword(password: string): void {
  if (!password || password.length < 8) {
    throw new Error('Password too short');
  }
}

function registerUser(data: RegisterData) {
  validateEmail(data.email);
  validatePassword(data.password);
  // ... registration logic
}

function updateProfile(userId: string, data: ProfileData) {
  validateEmail(data.email);
  if (data.password) {
    validatePassword(data.password);
  }
  // ... update logic
}

function resetPassword(email: string, newPassword: string) {
  validateEmail(email);
  validatePassword(newPassword);
  // ... reset logic
}
```

**Common Pitfalls:**
- Forcing consolidation when logic should diverge
- Creating overly generic functions with too many parameters
- Missing subtle differences between "duplicate" code
- Over-abstracting too early (Rule of Three: refactor after 3rd occurrence)
- Creating functions that are harder to understand than duplicates

---

### 6. Introduce Explaining Variable

**Description:**
Break complex expressions into intermediate variables with descriptive names.

**When to Use:**
- Expression is hard to understand at a glance
- Same complex expression used multiple times
- Debugging would be easier with intermediate values
- Expression has multiple nested operations
- Conditional logic is unclear

**Benefits:**
- Improved readability
- Easier debugging (can inspect intermediate values)
- Self-documenting code
- Simpler unit testing
- Reduced cognitive load

**Before:**
```typescript
function calculateShipping(order: Order) {
  return order.items.reduce((sum, item) => sum + item.weight, 0) > 50
    ? 0
    : order.customer.isPremium
    ? 5.99
    : 9.99;
}

function applyDiscount(order: Order) {
  order.total = order.items.reduce((sum, item) =>
    sum + item.price * item.quantity, 0) *
    (order.customer.isPremium &&
     order.items.reduce((sum, item) => sum + item.price * item.quantity, 0) > 100
      ? 0.9
      : 1.0);
}
```

**After:**
```typescript
function calculateShipping(order: Order) {
  const totalWeight = order.items.reduce((sum, item) => sum + item.weight, 0);
  const qualifiesForFreeShipping = totalWeight > 50;

  if (qualifiesForFreeShipping) {
    return 0;
  }

  const isPremiumCustomer = order.customer.isPremium;
  return isPremiumCustomer ? 5.99 : 9.99;
}

function applyDiscount(order: Order) {
  const subtotal = order.items.reduce((sum, item) =>
    sum + item.price * item.quantity, 0);

  const isPremiumCustomer = order.customer.isPremium;
  const qualifiesForDiscount = subtotal > 100;
  const discountMultiplier = isPremiumCustomer && qualifiesForDiscount ? 0.9 : 1.0;

  order.total = subtotal * discountMultiplier;
}
```

**Common Pitfalls:**
- Over-using (breaking every expression)
- Poor variable names (e.g., `temp`, `result`)
- Variables that don't add clarity
- Breaking expressions in illogical places
- Not using const (allowing accidental mutation)

---

### 7. Replace Magic Number with Named Constant

**Description:**
Replace hardcoded numeric values with descriptive named constants.

**When to Use:**
- Number appears multiple times in code
- Number's meaning isn't immediately obvious
- Number might change in the future
- Number represents a business rule or configuration
- Number is used in calculations

**Benefits:**
- Self-documenting code
- Single place to update values
- Prevents typos (e.g., 0.08 vs 0.8)
- Easier to understand business rules
- Better maintainability

**Before:**
```typescript
function calculatePrice(basePrice: number, customer: Customer) {
  const tax = basePrice * 0.08;
  const discount = customer.isPremium ? basePrice * 0.1 : 0;

  if (basePrice > 1000) {
    return basePrice + tax - discount - 50;
  }

  if (customer.orderCount > 10) {
    return basePrice + tax - discount - 25;
  }

  return basePrice + tax - discount;
}

function validatePassword(password: string) {
  return password.length >= 8 && password.length <= 128;
}
```

**After:**
```typescript
const TAX_RATE = 0.08;
const PREMIUM_DISCOUNT_RATE = 0.1;
const LARGE_ORDER_THRESHOLD = 1000;
const LARGE_ORDER_DISCOUNT = 50;
const LOYAL_CUSTOMER_ORDER_COUNT = 10;
const LOYAL_CUSTOMER_DISCOUNT = 25;

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;

function calculatePrice(basePrice: number, customer: Customer) {
  const tax = basePrice * TAX_RATE;
  const discount = customer.isPremium ? basePrice * PREMIUM_DISCOUNT_RATE : 0;

  if (basePrice > LARGE_ORDER_THRESHOLD) {
    return basePrice + tax - discount - LARGE_ORDER_DISCOUNT;
  }

  if (customer.orderCount > LOYAL_CUSTOMER_ORDER_COUNT) {
    return basePrice + tax - discount - LOYAL_CUSTOMER_DISCOUNT;
  }

  return basePrice + tax - discount;
}

function validatePassword(password: string) {
  return password.length >= PASSWORD_MIN_LENGTH &&
         password.length <= PASSWORD_MAX_LENGTH;
}
```

**Common Pitfalls:**
- Replacing obvious numbers (0, 1, 2 in array indexing)
- Constants that are too granular (ZERO, ONE, TWO)
- Poor naming (CONST_1, VALUE_A)
- Not grouping related constants
- Making constants when configuration is needed

---

### 8. Decompose Conditional

**Description:**
Break complex conditional logic into well-named functions or variables.

**When to Use:**
- Conditional has multiple clauses (>3)
- Logic uses complex boolean expressions
- Same conditional appears in multiple places
- Conditional is hard to understand
- Nested if-else statements (>3 levels)

**Benefits:**
- Improved readability
- Easier testing (test conditions independently)
- Reusable logic
- Self-documenting code
- Reduced complexity

**Before:**
```typescript
function shouldApproveOrder(order: Order, customer: Customer) {
  if (
    (customer.accountAge > 365 && customer.totalSpent > 1000) ||
    (customer.isPremium && order.total < 500) ||
    (order.items.every(item => item.category !== 'restricted') &&
     customer.riskScore < 50 &&
     order.shippingAddress.country === customer.billingAddress.country)
  ) {
    return true;
  }
  return false;
}

function calculateDiscount(order: Order, customer: Customer) {
  if (order.total > 100 && (customer.isPremium || customer.orderCount > 10)) {
    if (order.items.length > 5 && customer.totalSpent > 5000) {
      return order.total * 0.2;
    } else if (customer.accountAge > 730) {
      return order.total * 0.15;
    } else {
      return order.total * 0.1;
    }
  }
  return 0;
}
```

**After:**
```typescript
function shouldApproveOrder(order: Order, customer: Customer): boolean {
  return (
    isTrustedCustomer(customer) ||
    isLowRiskPremiumOrder(order, customer) ||
    isStandardLowRiskOrder(order, customer)
  );
}

function isTrustedCustomer(customer: Customer): boolean {
  const accountAge = customer.accountAge;
  const totalSpent = customer.totalSpent;
  return accountAge > 365 && totalSpent > 1000;
}

function isLowRiskPremiumOrder(order: Order, customer: Customer): boolean {
  return customer.isPremium && order.total < 500;
}

function isStandardLowRiskOrder(order: Order, customer: Customer): boolean {
  const hasOnlySafeItems = order.items.every(item => item.category !== 'restricted');
  const isLowRiskCustomer = customer.riskScore < 50;
  const hasMatchingAddresses =
    order.shippingAddress.country === customer.billingAddress.country;

  return hasOnlySafeItems && isLowRiskCustomer && hasMatchingAddresses;
}

function calculateDiscount(order: Order, customer: Customer): number {
  if (!qualifiesForDiscount(order, customer)) {
    return 0;
  }

  if (isVIPOrder(order, customer)) {
    return order.total * 0.2;
  }

  if (isLongTermCustomer(customer)) {
    return order.total * 0.15;
  }

  return order.total * 0.1;
}

function qualifiesForDiscount(order: Order, customer: Customer): boolean {
  return order.total > 100 && (customer.isPremium || customer.orderCount > 10);
}

function isVIPOrder(order: Order, customer: Customer): boolean {
  return order.items.length > 5 && customer.totalSpent > 5000;
}

function isLongTermCustomer(customer: Customer): boolean {
  return customer.accountAge > 730;
}
```

**Common Pitfalls:**
- Over-decomposing simple conditions
- Creating functions used only once
- Poor naming of extracted conditions
- Breaking logical flow
- Not considering early returns

---

## Pattern Selection Decision Tree

Use this decision tree to select the most appropriate refactoring pattern:

```
START: What is the primary issue?

├─ Function/Method is too long or complex
│  ├─ Contains distinct logical sections?
│  │  └─ → Extract Method/Function (#1)
│  ├─ Has complex conditional logic?
│  │  └─ → Decompose Conditional (#8)
│  └─ Has complex expressions?
│     └─ → Introduce Explaining Variable (#6)
│
├─ Class/Service is too large
│  ├─ Has multiple responsibilities?
│  │  └─ → Split Class/Service (#2)
│  └─ Methods form distinct groups?
│     └─ → Split Class/Service (#2)
│
├─ React Component is too large
│  ├─ Has reusable UI sections?
│  │  └─ → Extract Component (#3)
│  ├─ Has deep JSX nesting?
│  │  └─ → Extract Component (#3)
│  └─ Multiple render responsibilities?
│     └─ → Extract Component (#3)
│
├─ Code is duplicated
│  ├─ Exact duplicate appears 3+ times?
│  │  └─ → Consolidate Duplicate Code (#5)
│  └─ Similar logic with variations?
│     └─ → Consolidate Duplicate Code (#5) + parameterization
│
├─ Code is unclear or confusing
│  ├─ Names are unclear or too generic?
│  │  └─ → Rename for Clarity (#4)
│  ├─ Has magic numbers?
│  │  └─ → Replace Magic Number (#7)
│  ├─ Has complex expressions?
│  │  └─ → Introduce Explaining Variable (#6)
│  └─ Has complex conditionals?
│     └─ → Decompose Conditional (#8)
│
└─ Multiple issues?
   └─ → Apply patterns in order:
      1. Rename for Clarity (makes other refactorings easier)
      2. Introduce Explaining Variable (simplifies expressions)
      3. Replace Magic Numbers (clarifies intent)
      4. Decompose Conditional (simplifies logic)
      5. Extract Method/Function (reduces size)
      6. Consolidate Duplicate Code (removes duplication)
      7. Split Class/Service or Extract Component (final structure)
```

---

## Pattern-to-Issue Mapping

| Code Issue | Recommended Pattern(s) | Priority |
|------------|------------------------|----------|
| **Large Files (>500 lines)** | Split Class/Service, Extract Component | High |
| **Complex Functions** | Extract Method, Decompose Conditional | High |
| **Duplicated Code** | Consolidate Duplicate Code | High |
| **Poor Naming** | Rename for Clarity | Medium |
| **Deep Nesting (>4 levels)** | Extract Method, Decompose Conditional | High |
| **Long Parameter Lists (>5)** | Extract Method, Introduce Parameter Object | Medium |
| **God Objects** | Split Class/Service | High |
| **Magic Numbers** | Replace Magic Number with Named Constant | Low |
| **Complex Conditionals** | Decompose Conditional | Medium |
| **Large Components (>300 lines)** | Extract Component | High |
| **Unclear Variable Names** | Rename for Clarity | Low |
| **Complex Expressions** | Introduce Explaining Variable | Medium |

---

## Trade-offs and Considerations

### Extract Method vs Inline Code

**Extract Method:**
- **Pros:** Reusability, testability, clarity
- **Cons:** More indirection, potential over-abstraction
- **Use when:** Logic is reused or complex enough to warrant naming

**Inline Code:**
- **Pros:** Directness, no indirection
- **Cons:** Harder to reuse, test, or name
- **Use when:** Logic is simple and used only once

### Split Class vs Keep Together

**Split Class:**
- **Pros:** Single responsibility, easier to maintain
- **Cons:** More files, potential coupling between split classes
- **Use when:** Clear responsibility boundaries exist

**Keep Together:**
- **Pros:** Fewer files, related code in one place
- **Cons:** Risk of god objects
- **Use when:** Class is cohesive and responsibilities are tightly coupled

### Extract Component vs Keep Inline

**Extract Component:**
- **Pros:** Reusability, testability, performance optimization
- **Cons:** More files, prop drilling, complexity
- **Use when:** Component is reused or logically distinct

**Keep Inline:**
- **Pros:** Less complexity, clearer data flow
- **Cons:** Large components, hard to reuse
- **Use when:** JSX is simple and tightly coupled to parent

### Named Constants vs Magic Numbers

**Named Constants:**
- **Pros:** Self-documenting, single source of truth
- **Cons:** More code, potential over-naming
- **Use when:** Number is reused or meaning isn't obvious

**Magic Numbers:**
- **Pros:** Conciseness
- **Cons:** Unclear meaning, harder to change
- **Use when:** Number is obvious (0, 1, 100%) and used once

---

## Pattern Combinations

### Common Multi-Pattern Refactorings

**Large Complex Function:**
1. Introduce Explaining Variable (clarify expressions)
2. Replace Magic Numbers (add constants)
3. Decompose Conditional (simplify logic)
4. Extract Method (break into smaller functions)

**God Class:**
1. Rename for Clarity (understand current structure)
2. Extract Method (identify logical groups)
3. Split Class (separate responsibilities)
4. Consolidate Duplicate Code (remove duplication across new classes)

**Large React Component:**
1. Introduce Explaining Variable (simplify complex JSX expressions)
2. Extract Component (pull out reusable UI sections)
3. Decompose Conditional (simplify conditional rendering)
4. Rename for Clarity (clarify component names)

---

## Anti-Patterns to Avoid

### Over-Refactoring
**Symptoms:**
- Functions with 1-2 lines
- Components for every `<div>`
- Constants for obvious values (0, 1)
- Abstractions that don't reduce complexity

**Solution:** Apply Rule of Three (refactor after 3rd occurrence), ensure refactoring adds clarity.

### Premature Abstraction
**Symptoms:**
- Generic functions with 8+ parameters
- Abstract classes with no concrete implementations
- Frameworks built for single use case

**Solution:** Wait for patterns to emerge naturally, refactor when duplication is clear.

### Rename Churn
**Symptoms:**
- Names change every sprint
- No clear naming conventions
- Frequent breaking changes

**Solution:** Establish naming conventions, think before renaming, use meaningful names from start.

### Extraction Without Purpose
**Symptoms:**
- Functions/components used only once
- Unclear what extracted code does
- More complex after extraction

**Solution:** Ensure extraction has clear purpose (reuse, clarity, or testing), use descriptive names.

---

## Best Practices

### Before Refactoring
1. **Ensure tests exist** (or write them first)
2. **Understand current behavior** completely
3. **Make one change at a time**
4. **Use IDE refactoring tools** (safer than manual changes)
5. **Commit working code** before starting

### During Refactoring
1. **Run tests frequently** (after each small change)
2. **Keep changes small** (incremental improvements)
3. **Maintain functionality** (behavior shouldn't change)
4. **Use descriptive names** (clarity is the goal)
5. **Seek peer review** (second opinion helps)

### After Refactoring
1. **Verify all tests pass**
2. **Check for performance impact**
3. **Update documentation** (comments, README)
4. **Review naming consistency**
5. **Commit with clear message** describing refactoring

---

## Summary

### Pattern Quick Reference

| # | Pattern | Use Case | Effort | Impact |
|---|---------|----------|--------|--------|
| 1 | Extract Method/Function | Complex logic | Low | High |
| 2 | Split Class/Service | Multiple responsibilities | High | High |
| 3 | Extract Component | Large React components | Medium | High |
| 4 | Rename for Clarity | Unclear names | Low | Medium |
| 5 | Consolidate Duplicate Code | Code duplication | Medium | High |
| 6 | Introduce Explaining Variable | Complex expressions | Low | Medium |
| 7 | Replace Magic Number | Hardcoded values | Low | Low |
| 8 | Decompose Conditional | Complex conditionals | Medium | Medium |

### Key Principles

1. **Clarity over cleverness** - Code should be easy to understand
2. **Single Responsibility** - Each unit should do one thing well
3. **Don't Repeat Yourself (DRY)** - Avoid duplication
4. **Meaningful Names** - Names should reveal intent
5. **Incremental Improvement** - Small, safe changes over time

---

**Version:** 1.0
**Last Updated:** 2026-01-14
**Related:** `REFACTORING_REPORT_TEMPLATE.md`, `code-refactoring-analyzer/skill.md`
