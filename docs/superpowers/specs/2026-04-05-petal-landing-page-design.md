# Petal Landing Page Design Specification

## Overview
Multi-page marketing landing site for Petal multi-agent productivity app, maintaining brutalist aesthetic from the app.

## Brand Identity
- **Theme**: Brutalist web design with bold borders, offset shadows, chunky elements
- **Typography**: 
  - Display: Bebas Neue
  - Body: Space Grotesk  
  - Mono: Space Mono
- **Colors**:
  - Primary: #ffcdb2 (peach)
  - Secondary: #ffb4a2 (salmon)
  - Accent 1: #e5989b (dusty rose)
  - Accent 2: #b5838d (darker rose)
  - Dark: #6d6875 (purple-gray)
  - Ink: #1a0a0d (near black)
  - Paper: #fff8f5 (warm white)

## Pages

### 1. Home (index.html)
- **Hero Section**: Full-width, split layout
  - Left: Bold "PETAL" display text with tagline
  - Right: Abstract geometric composition
  - CTA button with offset hover
- **Ticker Tape**: Animated "AI AGENTS • MULTI-AGENT SYSTEM • SMARTER PRODUCTIVITY"
- **Quick Features**: 4 icon cards (Chat, Tasks, Calendar, Notes)
- **Footer**: Simple links and branding

### 2. Features (features.html)
- **Page Header**: "CAPABILITIES" title with decorative border
- **Feature Cards Grid**: 2x2 grid showcasing each capability
  - Chat: AI multi-agent conversation
  - Tasks: Kanban board management
  - Calendar: Event scheduling
  - Notes: Knowledge base
- **Tech Stack**: "Built with AI Agents" badge section

### 3. How It Works (how-it-works.html)
- **Process Steps**: 3 numbered sections
  1. Ask anything — natural language input
  2. Agents collaborate — orchestrator routes to specialists
  3. Get results — task completion, calendar events, notes saved
- **Agent Flow Diagram**: Visual showing orchestrator → task/cal/info agents
- **MCP Integration**: "Works with your tools" section

### 4. Sign Up (signup.html)
- **Split Layout**:
  - Left: Branding and trust elements
  - Right: Registration form (email, password, confirm)
- **Form Styling**: Thick borders, chunky inputs, bold submit button

## Shared Components
- Navigation bar (logo left, links right)
- Brutalist buttons with hover states
- Card components with offset shadows
- Section dividers (thick borders)
- Mobile-responsive breakpoints

## Animations
- Ticker scroll: continuous loop
- Card hover: translate + shadow offset
- Page transitions: subtle fade
- Staggered reveals on scroll (CSS only)

## Acceptance Criteria
- [ ] All 4 pages implemented
- [ ] Matches app color palette exactly
- [ ] Responsive down to 320px mobile
- [ ] All buttons have hover states
- [ ] Ticker animation runs smoothly
- [ ] Navigation works between all pages
- [ ] Form has basic validation styling