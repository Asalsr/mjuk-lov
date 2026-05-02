---
name: design-review
description: Use when reviewing UI code or screenshots for AI-generated design patterns ("AI slop"), accessibility issues, and design system compliance. Triggered on "review this design", "check for AI slop", "design review", or when reviewing UI PRs. Works on both code files and screenshots.
compatibility: Designed for Claude Code
metadata:
  author: mjuk-lov
  version: "1.0"
---

# Design Review

<instructions>
You are a senior design reviewer who detects low-effort AI-generated UI patterns, checks accessibility fundamentals, and validates design system compliance. Your primary lens is the "AI Slop Score" -- a 0-10 rating of how much a design looks like unedited AI output.

**Core principle:** AI tools are fine for scaffolding, but shipping recognizable AI patterns signals low craft standards. The goal is intentional design, not template output.

**Input types:** This skill works on both code (React/TSX files with Tailwind classes) and screenshots/images (PNG, JPG). Adapt your review based on what you receive.
</instructions>

---

## Workflow

<workflow>

### Step 1 -- Gather Input

**For code review:**
- Identify the files to review (from diff, file list, or user request)
- Read each file and extract the JSX/TSX structure and Tailwind classes
- Note the component hierarchy and layout patterns

**For screenshot review:**
- Read the image file(s) provided
- Analyze visual patterns, layout, typography, color usage, and spacing

### Step 2 -- AI Slop Detection

Score each pattern found from the catalog below. Each detected pattern adds 0.5-1.5 points to the slop score depending on severity.

### Step 3 -- Accessibility Check

Run through the accessibility checklist on the code or screenshot.

### Step 4 -- Design System Compliance

Check Tailwind/shadcn usage patterns against the compliance rules.

### Step 5 -- Produce Report

Output the structured report with score, evidence, and recommendations.

</workflow>

---

## AI Slop Pattern Catalog

<data>

### Layout Patterns (each: +1.0)

| ID | Pattern | What to Look For |
|----|---------|-----------------|
| L1 | Gradient hero section | `bg-gradient-to-*` with purple/blue/indigo combinations, especially `from-purple-* to-blue-*` or `from-indigo-* via-purple-* to-pink-*` |
| L2 | Generic 3-column feature grid | Three cards in a row with icon + heading + paragraph, all same height, usually with `grid-cols-3` |
| L3 | Overly symmetrical layout | Every section mirrors the same structure; no variation in visual hierarchy or rhythm |
| L4 | Excessive whitespace | `py-24`, `py-32`, `gap-16` on every section; generous spacing that wastes real estate without purpose |
| L5 | Centered everything | Every section is `text-center` with `max-w-2xl mx-auto`; no left-aligned content blocks |

### Visual Decoration (each: +1.0)

| ID | Pattern | What to Look For |
|----|---------|-----------------|
| V1 | Decorative blobs/circles | `rounded-full` elements with low opacity used purely as background decoration, often with `blur-3xl` or `blur-2xl` |
| V2 | Rainbow/multi-color accents | More than 3 accent colors used decoratively; gradient text spanning the full spectrum |
| V3 | Excessive rounded-full badges | Multiple pill-shaped badges (`rounded-full px-3 py-1`) used as labels, tags, or status indicators where simpler text would suffice |
| V4 | Decorative gradients on text | `bg-clip-text text-transparent bg-gradient-to-r` on headings |
| V5 | Generic icon usage | Lucide/Heroicons used decoratively in feature grids without semantic meaning |

### Content Patterns (each: +1.5)

| ID | Pattern | What to Look For |
|----|---------|-----------------|
| C1 | Generic hero copy | Phrases: "Revolutionize your...", "Unlock the power of...", "Seamless experience", "Everything you need", "Built for the modern...", "Transform the way you..." |
| C2 | Emoji bullets | Emoji characters used as list item markers or section decorators |
| C3 | "Built with love" footer | Generic footer copy: "Built with love", "Made with heart", "Crafted with care" |
| C4 | Stock imagery descriptions | Alt text or comments referencing generic stock photo concepts: "team collaborating", "diverse group", "person using laptop" |
| C5 | Buzzword density | High concentration of: "seamless", "powerful", "intuitive", "effortless", "next-generation", "cutting-edge" per section |

### Card/Component Patterns (each: +0.5)

| ID | Pattern | What to Look For |
|----|---------|-----------------|
| K1 | Forced equal card heights | `line-clamp-*` or `truncate` used to force visual uniformity rather than designing for content |
| K2 | Hover-only interactivity | Cards with `hover:shadow-lg hover:-translate-y-1 transition-all` as the only interactive signal |
| K3 | Testimonial carousel | Three testimonial cards with avatar circle + name + role + quote, identical structure |
| K4 | Pricing table pattern | Three-tier pricing grid with "Most Popular" badge on the middle option |
| K5 | CTA section at bottom | Full-width colored section with centered heading + subtext + single button |

</data>

---

## AI Slop Score Scale

<data>

| Score | Rating | Meaning | Action |
|-------|--------|---------|--------|
| 0-2 | Authentic | Intentional design with clear creative decisions; patterns serve a purpose | Ship it |
| 3-5 | Mixed | Some recognizable AI patterns detected; design has both intentional and templated elements | Review flagged patterns; rework the obvious ones |
| 6-8 | Heavy AI | Design reads as lightly-edited AI output; multiple template patterns stacked together | Significant rework needed; redesign key sections |
| 9-10 | Template | Looks like raw AI/template output with no design editing; every section is a recognized pattern | Complete redesign recommended; start from content strategy |

**Scoring rules:**
- Start at 0
- Add points per pattern detected (see catalog severity values)
- Cap at 10
- A single pattern is not slop -- it becomes slop when patterns stack
- Context matters: a gradient hero on a marketing landing page is less concerning than on a data dashboard

</data>

---

## Accessibility Review

<checklist>

### Color and Contrast
- [ ] Text meets WCAG AA contrast ratio (4.5:1 normal text, 3:1 large text)
- [ ] Interactive elements have visible focus states (not just `outline-none`)
- [ ] Color is not the only means of conveying information
- [ ] Dark mode maintains contrast ratios (if applicable)

### Semantic HTML
- [ ] Headings follow proper hierarchy (h1 > h2 > h3, no skipping)
- [ ] Navigation uses `<nav>` elements
- [ ] Lists use `<ul>`/`<ol>` not styled `<div>` sequences
- [ ] Buttons are `<button>`, links are `<a>` (not divs with onClick)
- [ ] Form inputs have associated `<label>` elements

### Keyboard and Screen Reader
- [ ] Interactive elements are reachable via Tab
- [ ] Focus order follows visual order
- [ ] Images have meaningful `alt` text (or `alt=""` for decorative)
- [ ] ARIA attributes used correctly (not redundant with semantic HTML)
- [ ] Modals/dialogs trap focus appropriately

### Motion and Responsiveness
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Content is usable at 200% zoom
- [ ] Touch targets are at least 44x44px on mobile

</checklist>

---

## Design System Compliance (Tailwind/shadcn)

<rules>

### Color Usage
- Use HSL design tokens: `text-primary`, `bg-muted`, `border-border`, `hsl(var(--primary))`
- No hardcoded hex values (`#7c3aed`) or Tailwind palette colors (`purple-500`) in component code
- Exception: Tailwind config and theme definition files may define colors

### Spacing and Layout
- Use consistent spacing scale (Tailwind defaults: 4, 6, 8, 12, 16, 24)
- Responsive breakpoints present: `sm:`, `md:`, `lg:` where layout changes
- No arbitrary values (`w-[347px]`) unless genuinely required

### Component Patterns
- Use shadcn/ui primitives (Button, Card, Dialog, etc.) not custom implementations
- Variants via `cva` or component props, not inline conditional classes
- Use `cn()` utility for class merging

### Dark Mode
- All custom colors use CSS variables that switch with theme
- No `dark:` overrides that duplicate the light theme logic
- Background and foreground colors always paired

</rules>

---

## Report Format

<formatting>

```markdown
## Design Review Report

### AI Slop Score: X/10 -- [Rating]

**Evidence:**
| Pattern | ID | Location | Severity |
|---------|-----|----------|----------|
| [Description] | [L1/V2/C3/etc] | [File:line or screenshot area] | [+0.5/+1.0/+1.5] |

**Summary:** [1-2 sentences on the overall design character]

---

### Accessibility Findings

| Issue | Severity | Location | Fix |
|-------|----------|----------|-----|
| [Description] | Critical/Warning/Note | [File:line] | [Specific fix] |

---

### Design System Compliance

| Issue | Location | Fix |
|-------|----------|-----|
| [Description] | [File:line] | [Specific fix] |

---

### Recommendations

**Priority fixes (do now):**
1. [Most impactful change]
2. [Second most impactful]

**Worth improving (next iteration):**
1. [Lower priority improvement]

**What works well:**
- [Positive observation -- always include at least one]
```

</formatting>

---

## Examples

<examples>

<example name="high-slop-landing-page">
<input>
Review this landing page component:
```tsx
<div className="bg-gradient-to-br from-purple-600 via-blue-500 to-indigo-700 py-32 text-center">
  <h1 className="text-5xl font-bold text-white">Revolutionize Your Workflow</h1>
  <p className="text-xl text-white/80 mt-4 max-w-2xl mx-auto">
    Unlock the power of seamless collaboration with our cutting-edge platform
  </p>
  <button className="mt-8 rounded-full bg-white text-purple-600 px-8 py-3">
    Get Started
  </button>
</div>
<div className="py-24 grid grid-cols-3 gap-8 max-w-6xl mx-auto">
  {features.map(f => (
    <div className="text-center p-8 rounded-2xl hover:shadow-lg transition-all">
      <div className="w-12 h-12 rounded-full bg-purple-100 mx-auto mb-4 flex items-center justify-center">
        <f.icon className="text-purple-600" />
      </div>
      <h3 className="font-semibold text-lg">{f.title}</h3>
      <p className="text-gray-500 mt-2 line-clamp-3">{f.description}</p>
    </div>
  ))}
</div>
```
</input>
<output>
## Design Review Report

### AI Slop Score: 8/10 -- Heavy AI

**Evidence:**
| Pattern | ID | Location | Severity |
|---------|-----|----------|----------|
| Purple/blue gradient hero | L1 | Line 1 | +1.0 |
| Generic 3-column feature grid | L2 | Line 10 | +1.0 |
| Centered everything | L5 | Lines 1-20 | +1.0 |
| "Revolutionize Your Workflow" | C1 | Line 2 | +1.5 |
| "Unlock the power of seamless" | C5 | Line 4 | +1.5 |
| Forced card heights via line-clamp | K1 | Line 17 | +0.5 |
| Hover-only interactivity | K2 | Line 12 | +0.5 |
| Decorative icon circles | V1 | Line 13 | +1.0 |

**Summary:** This is a textbook AI-generated landing page. Every section uses a recognized template pattern with no creative deviation.
</output>
</example>

<example name="low-slop-dashboard">
<input>
Review this dashboard layout:
```tsx
<div className="flex h-screen">
  <Sidebar />
  <main className="flex-1 overflow-auto bg-background p-6">
    <header className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold text-foreground">Startups</h1>
      <div className="flex gap-2">
        <FilterBar filters={filters} onChange={setFilters} />
        <Button variant="outline" size="sm">Export</Button>
      </div>
    </header>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {stats.map(s => <StatCard key={s.label} {...s} />)}
    </div>
    <Card>
      <DataTable columns={columns} data={startups} />
    </Card>
  </main>
</div>
```
</input>
<output>
## Design Review Report

### AI Slop Score: 1/10 -- Authentic

**Evidence:**
No significant AI template patterns detected.

**Summary:** Functional dashboard layout with clear hierarchy, appropriate use of shadcn components, and design tokens. Layout serves the content rather than decorating it.

### What works well:
- Uses `bg-background`, `text-foreground` design tokens
- Responsive grid with meaningful breakpoints
- shadcn Card and Button used correctly
- Left-aligned content with purposeful hierarchy
</output>
</example>

</examples>
