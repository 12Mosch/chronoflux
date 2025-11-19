# ChronoFlux - AI-Powered Alternate History Simulation Game

## Project Overview

ChronoFlux is a turn-based alternate history simulation game where players control nations and shape history through natural language actions. The AI evaluates decisions and simulates plausible consequences, creating unique "what-if" scenarios.

## Tech Stack

- **Frontend Framework**: SvelteKit
- **UI Components**: shadcn-svelte
- **Backend/Database**: Convex
- **AI Processing**: Ollama (local) with Qwen3 model

## Core Features

### 1. Gameplay Mechanics

- **Nation Control**: Players select and control a nation within historical scenarios
- **Natural Language Actions**: Players describe actions in free-form text
- **AI Evaluation**: Ollama/Qwen3 processes actions and generates consequences
- **Turn-Based Progression**: Structured turns advance the timeline
- **Persistent World State**: All decisions and events maintain continuity
- **Narrative Generation**: AI creates coherent historical narratives

### 2. Historical Scenarios

- Pre-configured starting points (e.g., WWI, Cold War, Ancient Rome)
- Initial world state with nations, resources, and relationships
- Historical context for AI to reference
- Customizable scenario creation

### 3. Player Actions

- **Political**: Policy changes, government reforms, internal affairs
- **Military**: Troop movements, declarations of war, strategic planning
- **Diplomatic**: Treaties, alliances, negotiations, trade agreements
- **Economic**: Resource management, infrastructure, trade policies

## System Architecture

### Frontend (SvelteKit)

```
src/
├── routes/
│   ├── +page.svelte              # Landing page
│   ├── scenarios/
│   │   └── +page.svelte          # Scenario selection
│   ├── game/
│   │   ├── [gameId]/
│   │   │   └── +page.svelte      # Main game interface
│   │   └── +layout.svelte        # Game layout wrapper
│   └── history/
│       └── [gameId]/
│           └── +page.svelte      # Historical timeline viewer
├── lib/
│   ├── components/
│   │   ├── ui/                   # shadcn-svelte components
│   │   ├── game/
│   │   │   ├── ActionInput.svelte
│   │   │   ├── WorldMap.svelte
│   │   │   ├── NationPanel.svelte
│   │   │   ├── EventLog.svelte
│   │   │   └── TurnSummary.svelte
│   │   └── scenarios/
│   │       └── ScenarioCard.svelte
│   ├── stores/
│   │   ├── gameState.ts
│   │   └── userSession.ts
│   └── utils/
│       ├── convex.ts             # Convex client setup
│       └── ollama.ts             # Ollama API client
└── app.css                        # Global styles
```

### Backend (Convex)

```
convex/
├── schema.ts                      # Database schema
├── games.ts                       # Game CRUD operations
├── scenarios.ts                   # Scenario management
├── turns.ts                       # Turn processing
├── events.ts                      # Event logging
├── nations.ts                     # Nation state management
└── ai.ts                          # AI integration logic
```

### AI Integration (Ollama)

- **Local Processing**: Ollama runs on user's machine or server
- **Model**: Qwen3 for natural language understanding and generation
- **API Communication**: HTTP requests to Ollama API
- **Prompt Engineering**: Structured prompts for consistent outputs

## Data Models

### Game

```typescript
{
  _id: Id<"games">,
  scenarioId: Id<"scenarios">,
  playerId: string,
  playerNationId: Id<"nations">,
  currentTurn: number,
  status: "active" | "paused" | "completed",
  createdAt: number,
  updatedAt: number
}
```

### Scenario

```typescript
{
  _id: Id<"scenarios">,
  name: string,
  description: string,
  historicalPeriod: string,
  startYear: number,
  initialWorldState: {
    nations: Nation[],
    relationships: Relationship[],
    globalEvents: string[]
  },
  aiContext: string  // Historical background for AI
}
```

### Nation

```typescript
{
  _id: Id<"nations">,
  gameId: Id<"games">,
  name: string,
  government: string,
  resources: {
    military: number,
    economy: number,
    stability: number,
    influence: number
  },
  territories: string[],
  isPlayerControlled: boolean
}
```

### Turn

```typescript
{
  _id: Id<"turns">,
  gameId: Id<"games">,
  turnNumber: number,
  playerAction: string,
  aiResponse: {
    events: Event[],
    consequences: string,
    narrative: string,
    worldStateChanges: object
  },
  timestamp: number
}
```

### Event

```typescript
{
  _id: Id<"events">,
  gameId: Id<"games">,
  turnNumber: number,
  type: "political" | "military" | "diplomatic" | "economic" | "other",
  title: string,
  description: string,
  affectedNations: Id<"nations">[],
  impact: object
}
```

### Relationship

```typescript
{
  _id: Id<"relationships">,
  gameId: Id<"games">,
  nation1Id: Id<"nations">,
  nation2Id: Id<"nations">,
  status: "allied" | "neutral" | "hostile" | "at_war",
  tradeAgreements: boolean,
  militaryAlliance: boolean,
  relationshipScore: number  // -100 to 100
}
```

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

- [ ] Set up SvelteKit project structure
- [ ] Install and configure shadcn-svelte
- [ ] Set up Convex backend
- [ ] Define database schema in Convex
- [ ] Create basic UI components (buttons, cards, inputs)
- [ ] Implement basic routing structure
- [ ] Set up Tailwind CSS configuration

### Phase 2: Core Game Loop (Weeks 3-4)

- [ ] Build scenario selection interface
- [ ] Implement game creation flow
- [ ] Create main game interface layout
- [ ] Build action input component with text area
- [ ] Develop turn processing logic in Convex
- [ ] Set up Ollama integration and API client
- [ ] Create basic prompt templates for AI

### Phase 3: AI Integration (Weeks 5-6)

- [ ] Implement Ollama API communication layer
- [ ] Design prompt engineering system for:
  - Action interpretation
  - Consequence generation
  - Narrative creation
  - World state updates
- [ ] Build AI response parser
- [ ] Implement error handling for AI failures
- [ ] Create fallback mechanisms
- [ ] Test AI consistency and quality

### Phase 4: Game State Management (Week 7)

- [ ] Implement nation state tracking
- [ ] Build relationship management system
- [ ] Create resource calculation logic
- [ ] Develop event impact system
- [ ] Implement world state persistence
- [ ] Build state validation and consistency checks

### Phase 5: UI/UX Enhancement (Weeks 8-9)

- [ ] Design and implement world map visualization
- [ ] Create nation information panel
- [ ] Build event log with filtering
- [ ] Implement turn summary display
- [ ] Add loading states and animations
- [ ] Create responsive design for mobile
- [ ] Implement dark/light theme support

### Phase 6: Scenario System (Week 10)

- [ ] Create scenario editor interface
- [ ] Build initial scenario templates:
  - World War I (1914)
  - Cold War (1947)
  - Ancient Rome (44 BC)
  - Custom scenario option
- [ ] Implement scenario validation
- [ ] Create scenario import/export functionality

### Phase 7: Polish & Testing (Weeks 11-12)

- [ ] Comprehensive testing of game loop
- [ ] AI response quality assurance
- [ ] Performance optimization
- [ ] Bug fixes and edge case handling
- [ ] User testing and feedback incorporation
- [ ] Documentation and help system

## AI Prompt Engineering Strategy

### Action Interpretation Prompt

```
You are a historical simulation AI. A player controlling [NATION] in [YEAR] has taken the following action:

Action: [PLAYER_ACTION]

Current World State:
- Nation Resources: [RESOURCES]
- Relationships: [RELATIONSHIPS]
- Recent Events: [RECENT_EVENTS]

Analyze this action and determine:
1. Is it feasible given the nation's current state?
2. What are the immediate consequences?
3. How will other nations react?
4. What resources are required/affected?

Respond in JSON format:
{
  "feasibility": "high|medium|low",
  "immediate_consequences": [],
  "nation_reactions": {},
  "resource_changes": {},
  "narrative": "A detailed description of what happens"
}
```

### Event Generation Prompt

```
Based on the player's action and current world state, generate 1-3 significant events that occur this turn.

Context:
- Turn: [TURN_NUMBER]
- Year: [CURRENT_YEAR]
- Player Action: [ACTION]
- World State: [STATE]

Generate events in JSON format:
[
  {
    "type": "political|military|diplomatic|economic",
    "title": "Brief event title",
    "description": "Detailed event description",
    "affected_nations": [],
    "impact": {}
  }
]
```

## Technical Considerations

### Ollama Integration

- **Endpoint**: `http://localhost:11434/api/generate`
- **Model**: `qwen3:8b`
- **Timeout**: 30 seconds per request
- **Retry Logic**: 3 attempts with exponential backoff
- **Streaming**: Optional for real-time narrative generation

### Performance Optimization

- **Caching**: Cache AI responses for similar actions
- **Debouncing**: Prevent rapid-fire action submissions
- **Lazy Loading**: Load historical turns on demand
- **Optimistic Updates**: Show immediate UI feedback

### Error Handling

- **AI Unavailable**: Fallback to pre-generated responses
- **Invalid Actions**: Provide helpful error messages
- **Network Issues**: Queue actions for retry
- **Data Corruption**: Implement state recovery mechanisms

## User Interface Design

### Landing Page

- Hero section with game description
- Featured scenarios showcase
- "Start New Game" CTA
- Recent games list (if authenticated)

### Scenario Selection

- Grid of scenario cards with:
  - Historical period image
  - Name and description
  - Difficulty indicator
  - Available nations count
- Filter by time period
- Search functionality

### Main Game Interface

```
┌─────────────────────────────────────────────────────────┐
│ Header: [Nation Flag] [Nation Name] | Turn: X | Year: Y │
├──────────────────┬──────────────────────────────────────┤
│                  │                                      │
│   Nation Panel   │      World Map / Visualization       │
│                  │                                      │
│   - Resources    │                                      │
│   - Territories  │                                      │
│   - Relationships│                                      │
│                  │                                      │
├──────────────────┼──────────────────────────────────────┤
│                  │                                      │
│   Event Log      │      Action Input                    │
│                  │                                      │
│   - Recent       │   [Text Area for player action]      │
│     Events       │   [Submit Turn Button]               │
│   - Filters      │                                      │
│                  │                                      │
└──────────────────┴──────────────────────────────────────┘
```

### Turn Summary Modal

- Displays after AI processes turn
- Shows:
  - Player action recap
  - Generated events
  - Resource changes
  - Narrative description
  - "Continue" button

## Key User Flows

### 1. Starting a New Game

1. User lands on homepage
2. Clicks "Start New Game"
3. Selects a historical scenario
4. Chooses a nation to control
5. Reviews initial world state
6. Game begins at turn 1

### 2. Taking a Turn

1. User reads current world state
2. Types action in natural language
3. Clicks "Submit Turn"
4. Loading indicator shows AI processing
5. Turn summary modal appears with results
6. User reviews consequences
7. World state updates
8. User can take next turn

### 3. Viewing History

1. User clicks "View Timeline"
2. Chronological list of all turns
3. Click any turn to see details
4. View how decisions led to current state

## Security & Privacy

### Data Protection

- All game data stored in Convex (encrypted at rest)
- User authentication via Convex Auth (optional)
- No sensitive data sent to AI model
- Local AI processing ensures privacy

### Input Validation

- Sanitize all user inputs
- Limit action text length (max 1000 characters)
- Rate limiting on turn submissions
- Prevent injection attacks

### AI Safety

- Content filtering for inappropriate actions
- Moderation of generated narratives
- Fallback responses for edge cases
- Logging of problematic AI outputs

## Deployment Strategy

### Development Environment

- Local Ollama instance for AI
- Convex dev deployment
- SvelteKit dev server
- Hot module replacement enabled

### Production Environment

- **Frontend**: Vercel or Netlify
- **Backend**: Convex production deployment
- **AI**: Self-hosted Ollama server or user's local instance
- **CDN**: Static assets via Vercel Edge Network

### CI/CD Pipeline

1. GitHub Actions for automated testing
2. Type checking with TypeScript
3. Linting with ESLint
4. Build verification
5. Automated deployment to staging
6. Manual promotion to production

## Testing Strategy

### Unit Tests

- Utility functions
- Data transformations
- Prompt generation logic
- State management functions

### Integration Tests

- Convex mutations and queries
- AI API communication
- Turn processing workflow
- State persistence

### E2E Tests

- Complete game flow
- Scenario selection
- Turn submission
- History viewing
- Error scenarios

### AI Quality Tests

- Response consistency
- Narrative coherence
- Historical plausibility
- Edge case handling

## Future Enhancements

### Phase 2 Features

- [ ] Multiplayer support (multiple players in same game)
- [ ] AI-controlled nations with autonomous actions
- [ ] Advanced map visualization with territories
- [ ] Economic system with trade routes
- [ ] Technology tree and research
- [ ] Cultural and social dynamics

### Phase 3 Features

- [ ] Scenario creation tools for community
- [ ] Save/load game states
- [ ] Export game history as narrative document
- [ ] Achievement system
- [ ] Leaderboards for interesting outcomes
- [ ] Mobile app (React Native or Capacitor)

### Advanced AI Features

- [ ] Multiple AI models for different aspects
- [ ] Fine-tuned model on historical data
- [ ] AI-generated maps and visualizations
- [ ] Voice input for actions
- [ ] AI-generated character portraits

### Community Features

- [ ] Share interesting game outcomes
- [ ] Community scenario library
- [ ] Discussion forums for strategies
- [ ] Replay system for notable games
- [ ] Collaborative scenarios

## Success Metrics

### Technical Metrics

- AI response time < 5 seconds
- 99.9% uptime for Convex backend
- Page load time < 2 seconds
- Zero data loss incidents

### User Engagement Metrics

- Average session duration > 20 minutes
- Turns per game > 10
- Scenario completion rate > 30%
- Return user rate > 40%

### Quality Metrics

- AI response coherence score > 8/10
- Historical plausibility rating > 7/10
- User satisfaction score > 4/5
- Bug report rate < 1% of sessions

## Development Resources

### Documentation

- SvelteKit: https://kit.svelte.dev/docs
- shadcn-svelte: https://www.shadcn-svelte.com/docs
- Convex: https://docs.convex.dev
- Ollama: https://github.com/ollama/ollama/blob/main/docs/api.md
- Qwen3: https://huggingface.co/Qwen

### Tools & Libraries

- **State Management**: Svelte stores + Convex reactive queries
- **Form Handling**: Superforms
- **Validation**: Zod
- **Date Handling**: date-fns
- **Markdown Rendering**: marked (for narratives)
- **Icons**: lucide-svelte
- **Animations**: Svelte transitions + Motion One

## Project Timeline

**Total Duration**: 12 weeks

- **Weeks 1-2**: Foundation & Setup
- **Weeks 3-4**: Core Game Loop
- **Weeks 5-6**: AI Integration
- **Week 7**: Game State Management
- **Weeks 8-9**: UI/UX Enhancement
- **Week 10**: Scenario System
- **Weeks 11-12**: Polish & Testing

**MVP Launch**: End of Week 12

## Conclusion

ChronoFlux represents an innovative approach to strategy gaming by combining natural language processing with historical simulation. The use of local AI (Ollama/Qwen3) ensures privacy and low latency, while SvelteKit and Convex provide a modern, scalable foundation.

The phased development approach allows for iterative testing and refinement, ensuring each component works well before moving to the next. The focus on AI prompt engineering and quality assurance will be critical to delivering engaging, plausible alternate history scenarios.

Success will depend on:

1. **AI Quality**: Consistent, plausible, and engaging responses
2. **User Experience**: Intuitive interface and smooth gameplay
3. **Performance**: Fast AI responses and responsive UI
4. **Content**: Rich, diverse historical scenarios

With careful execution of this plan, ChronoFlux can deliver a unique gaming experience that appeals to history enthusiasts and strategy gamers alike.
