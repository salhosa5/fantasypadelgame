# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run seed` - Seed the database with initial data using Prisma

## Architecture Overview

This is a Next.js 15 fantasy football application for the UAE Pro League (UAE) built with:

### Core Stack
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with credentials provider
- **Styling**: Tailwind CSS v4
- **State Management**: React Query (@tanstack/react-query)

### Database Schema
The Prisma schema defines a complex fantasy football system with:
- **Users**: Authentication and team management
- **Teams & Players**: Real football teams and player data with positions (GK/DEF/MID/FWD)
- **Gameweeks**: Time-based scoring periods with fixtures
- **UserSquads**: User's team selections with budget management (£100 default)
- **Scoring**: PlayerStats track performance, SquadScore tracks team totals
- **Transfers**: Player trading system with free transfers
- **Leagues**: Private leagues with standings and member management
- **Chips**: Special power-ups (WILDCARD, BENCH_BOOST, TRIPLE_CAPTAIN, TWO_CAPTAINS)

### Key Business Logic

#### Scoring System (`src/lib/scoring.ts`)
- Position-based goal scoring: GK/DEF (6pts), MID (5pts), FWD (4pts)
- Clean sheets: GK/DEF (+4pts), MID (+1pt)
- Assists: +3pts each
- Cards: Yellow (-1pt), Red (-3pts)
- Captain multipliers: x2 base, x3 for Triple Captain chip

#### Auto-Substitutions (`src/lib/autoSubs.ts`)
- Automatically substitutes non-playing starters with playing bench players
- Maintains formation rules: ≥1 GK, ≥3 DEF, ≥3 MID, ≥2 FWD
- Handles captain/vice-captain transfers when players don't play
- Process order: B1→B4 priority for substitutions

#### Authentication Flow
- Credential-based auth with bcrypt password hashing
- JWT sessions managed by NextAuth.js
- Custom login page at `/login`
- User registration creates initial squad and budget

### File Structure Patterns

#### API Routes (`src/app/api/`)
- RESTful endpoints following Next.js App Router conventions
- Admin routes for fixture/player management
- User-facing routes for transfers, squads, leagues
- Authentication endpoints for session management

#### Pages (`src/app/`)
- `/my-team/` - Squad management with lineup and live scoring views
- `/transfers/` - Player trading interface
- `/leagues/` - League creation and standings
- `/admin/` - Administrative tools for managing fixtures and players

#### Core Libraries (`src/lib/`)
- `prisma.ts` - Database client configuration
- `auth.ts` - NextAuth configuration
- `scoring.ts` - Fantasy points calculation logic
- `autoSubs.ts` - Automatic substitution algorithms

### Key Components

#### Squad Management
- 15-player squads: 11 starters + 4 bench players
- Captain/Vice-captain system with multipliers
- Formation validation and auto-substitution logic
- Budget tracking with player price changes

#### Live Scoring
- Real-time point calculation during gameweeks
- Automatic substitutions for non-playing players
- Captain/vice-captain point multipliers
- Chip activation effects (Triple Captain, Bench Boost, etc.)

#### Admin System
- Fixture management with kick-off times and results
- Player creation/editing with pricing
- Gameweek scoring triggers
- Statistical data entry for matches

### Database Considerations
- Uses PostgreSQL with Prisma migrations
- Seed file (`prisma/seed.ts`) for initial data setup
- Complex relationships between users, squads, players, and scoring
- Optimized queries with proper indexing for performance