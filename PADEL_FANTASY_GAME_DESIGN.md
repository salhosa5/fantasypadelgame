# Padel Fantasy Game Design Document

**Date**: August 29, 2025  
**Status**: Initial Design - Ready for Feedback  
**Target Platform**: Web Application (Next.js)

---

## 🎾 Game Overview

**Concept**: A fantasy sports platform for Premier Padel tournaments where users create strategic teams, manage them throughout tournaments, and compete in leagues.

**Key Differentiator**: Unlike football fantasy, users pick entirely new squads for each tournament and must strategically select only one player from each real-world pair.

---

## 👥 Squad & Team Structure

### **Squad Composition**
- **Squad Size**: 5 players per tournament
- **Fresh Start**: New squad selection for every tournament
- **Gender Focus**: Male players only (female leagues considered for future expansion)
- **Pair Constraint**: Can only select **one player from each real pair**
  - Example: If Coello/Tapia are a pair, you can pick either Coello OR Tapia, not both
  - This prevents users from simply selecting the world's #1 pair

### **Budget System**
- **Total Budget**: €50 million per tournament
- **Player Pricing**: Dynamic based on world ranking, recent form, tournament history
- **Budget Strategy**: Player prices create natural selection constraints

### **Captain System**
- **Selection**: Choose **one player** as captain (not a pair)
- **Standard Multiplier**: Captain gets **2x points**
- **Strategic Element**: Captain choice becomes crucial for tournament success

---

## 🏆 Tournament Structure

### **Tournament Format**
- **Rounds**: R32 → R16 → Quarterfinals → Semifinals → Final
- **Round-Based Gameplay**: Each round is a separate "gameweek"
- **Tournament Focus**: One Premier Padel tournament at a time
- **Timeline**: ~5-7 days per tournament with breaks between tournaments

### **Squad Management Between Rounds**
- **Captain Changes**: Can change captain before each round (free)
- **Transfers**: **1 free transfer per round** (cannot stack unused transfers)
- **Elimination Consequences**: If your players get eliminated, you must play with fewer players or use transfers wisely
- **Strategic Depth**: Initial squad selection still critical - bad picks create lasting problems

---

## 📊 Scoring System

### **Match Results Points**
- **Win in straight sets (2-0)**: 5 points
- **Win in three sets (2-1)**: 4 points  
- **Loss in three sets (1-2)**: 2 points
- **Loss in straight sets (0-2)**: 1 point (participation)

### **Bonus Points**
- **Every 5 winners**: +1 point
- **Every 5 unforced errors**: -1 point
- **Every 2 assists**: +1 point
- **Every 3 successful smashes**: +1 point

*Note: Bonus values subject to testing and balancing. Data sourced from padel statistics platforms like Padel Intelligence (API integration pending). Scoring system will be automated to handle high match volume during tournament rounds.*

### **Captain Multipliers**
- **Regular Captain**: All points × 2
- **Triple Captain Chip**: All points × 3 (limited use chip)

---

## 🎮 Chips System

### **Available Chips** (Adapted from football fantasy)
1. **Triple Captain**: Captain gets 3x points instead of 2x (once per tournament)
2. **Two Captains**: Select two players who both get 2x multiplier (once per tournament)

### **Removed Chips** 
- **No Wildcard**: Doesn't fit tournament format
- **No Bench Boost**: No bench players in this system
- **No Surface Specialist**: Indoor/outdoor doesn't significantly impact padel

---

## 🏅 League & Competition Structure

### **Leaderboards**
1. **Season Leaderboard**: Cumulative points across all tournaments in the season
2. **Tournament Leaderboard**: Points for current/completed tournament only
3. **Private Leagues**: Friend groups and custom competitions (completely free)
4. **Public Leagues**: Open competitions (completely free)

### **Seasonal Structure**
- **Season**: Complete Premier Padel calendar year
- **Tournament Standings**: Individual tournament rankings within leagues
- **Season Standings**: Cumulative points across all tournaments within leagues
- **League Rewards**: Bragging rights and achievements (no monetary prizes)

---

## 🎯 User Engagement Strategy

### **Regular Touchpoints**
1. **Pre-Tournament**: Squad selection and strategy planning
2. **Between Rounds**: Captain changes and transfer decisions
3. **Live Matches**: Real-time scoring updates and standings
4. **Post-Round**: Results analysis and next round preparation

### **Engagement Features**
- **Live Scoring**: Real-time point updates during matches
- **Player Profiles**: Detailed stats and performance history
- **Achievement System**: Badges for milestones and successful predictions

### **User Onboarding**
- **Interactive Tutorial**: Step-by-step guide through squad selection and game mechanics
- **Demo Tournament**: Practice round with fake players to learn the system
- **Rules Explanation**: Clear breakdown of padel fantasy scoring and strategy
- **Fantasy Sports Primer**: Basic explanation for users new to fantasy sports concepts

---

## 📊 Data Integration & Automation

### **Data Sources**
- **Tournament Data**: Premier Padel official website and tournament systems
- **Player Statistics**: Automated extraction from official padel statistics platforms
- **Live Scoring**: Real-time match updates during tournament rounds
- **Player Pairs**: Official Premier Padel player profiles showing current partnerships

### **Automation Requirements**
- **Match Results**: Automatic scoring system (manual scoring not viable due to volume)
- **Player Stats**: Automated extraction of individual performance metrics
- **Tournament Brackets**: Dynamic tournament structure updates
- **Injury/Withdrawal Handling**: Automatic player status updates

### **Player Filtering & Search**
- **Ranking**: Sort by current world ranking
- **Fantasy Points**: Sort by total fantasy points earned
- **Ownership**: Percentage of users who selected each player
- **Position**: Left side vs Right side player filtering
- **Nationality**: Filter by player country
- **Form**: Recent performance metrics

### **Pair Management System**
- **Pair Constraint Enforcement**: Technical prevention of selecting both players from same pair
- **Dynamic Pair Updates**: Handle partnership changes during season
- **Pair Data Source**: Extract from official Premier Padel player profiles

---

## 🔧 Technical Requirements

### **Platform Specifications**
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM  
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS v4
- **Hosting**: Vercel with custom domain

### **Key Features**
- **Responsive Design**: Mobile-first approach for on-the-go management
- **Real-time Updates**: Live scoring during matches
- **Admin Panel**: Tournament and player management
- **API Integration**: Player stats and match results
- **Social Features**: League management and sharing

---

## 📈 Business Model

### **Revenue Streams**
- **Sponsorships**: Equipment brands and padel facilities
- **Tournament Partnerships**: Official fantasy partner status
- **Premium Features**: Advanced statistics and analytics (potential future)

### **Target Market**
- **Primary**: Male padel enthusiasts who follow Premier Padel tournaments
- **Secondary**: Fantasy sports players looking for new challenges
- **Geographic Focus**: Spain, Argentina, UAE, and growing padel markets
- **Future Expansion**: Female padel leagues and mixed competitions

---

## 🚀 Development Roadmap

### **Phase 1: MVP (4-6 weeks)**
- Basic squad selection and tournament gameplay
- Core scoring system with match results
- Simple league functionality
- Mobile-responsive design

### **Phase 2: Enhanced Features (2-3 weeks)**
- Individual performance bonuses (detailed stats)
- Advanced league management
- Chips system implementation
- Admin panel for tournament management

### **Phase 3: Growth Features (Ongoing)**
- Live match integration
- Mobile app development
- Advanced analytics and insights
- Partnership integrations

---

## ❓ Open Questions for Feedback

1. **Squad Size**: Is 5 players per tournament the right balance of strategy vs simplicity?

2. **Captain System**: Do we need captains with 2x multipliers, or should all players score equally? With only 5 players, captains become a huge swing factor - does this add strategic depth or just frustrating randomness?

3. **Transfer System**: Is 1 transfer per round the right balance, or too many/few?

4. **Bonus Points**: What additional individual performance bonuses should we include beyond smashes, errors, and bagels?

5. **Scoring Complexity**: How detailed should individual performance bonuses be without overwhelming casual users?

6. **Additional Features**: Any missing elements that would enhance the padel fantasy experience?

---

## 📝 Next Steps

1. **Gather Feedback**: Share with padel community for input on rules and scoring
2. **Stats Research**: Investigate available padel statistics and data sources  
3. **Technical Planning**: Adapt existing football fantasy codebase for padel
4. **Market Research**: Analyze existing padel fantasy platforms and identify gaps
5. **Partnership Outreach**: Connect with Premier Padel and player management

---

**Document Version**: 1.0  
**Created By**: Fantasy Sports Development Team  
**Contact**: [Your contact information]

---

*This document represents the initial design phase. All mechanics and features are subject to refinement based on community feedback and technical feasibility.*