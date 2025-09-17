# Arena Scheduler Development Plan

## Project Overview
Building a React TypeScript app for scheduling ice hockey games in an arena. The app handles one club on one arena and provides scheduling functionality for teams and games.

**API Base URL:** `https://grind.local/arenax/api`  
**Frontend URL:** `https://grind.local/planner`

## Phase 1: Admin Setup (3 Steps) ✅ COMPLETED
**Goal:** Allow admin users to set up the basic structure

### Step 1: Seasons Management ✅ COMPLETED
- [x] Create seasons interface
- [x] List, create, edit, delete seasons
- [x] API integration with proper data wrapping

### Step 2: Arenas & Clubs Management
**Goal:** Add arenas and clubs management to the same setup page
- [ ] Create arenas interface (name only)
- [ ] Create clubs interface (name + arena selection)
- [ ] Integrate with seasons on same page
- [ ] Form validation and error handling

### Step 3: Leagues Management
**Goal:** Add leagues management to the setup page
- [ ] Create leagues interface (name, priority, default_ice_time, official_url, season selection)
- [ ] Priority-based ordering
- [ ] Default ice time configuration
- [ ] All on same page as seasons, arenas, clubs

## Phase 2: Teams & Games Setup
**Goal:** Create teams and games management interface

### Step 4: Teams & Games Management
- [ ] Create teams interface (name, club, league, contact_email, url)
- [ ] Create games interface (home_team, away_team, league, arena, starts_at, ice_time)
- [ ] Games initially scheduled by day only (no specific time)
- [ ] Contact email for opposing teams vs users for our teams
- [ ] Separate page from initial setup

## Phase 3: User Authentication & Roles
**Goal:** Implement user system and role management

### Step 5: User Authentication
- [ ] User login system (email-based)
- [ ] Admin vs regular user roles
- [ ] Email code authentication
- [ ] Session management

### Step 6: Priority-based Scheduling
- [ ] Team priority ordering system
- [ ] Scheduling completion tracking (scheduling_done_at)
- [ ] Sequential team invitation system
- [ ] Progress indicators

## Phase 4: Graphical Scheduling Interface
**Goal:** Build the core scheduling functionality

### Step 7: Time Slot Management
- [ ] Friday: 19:45-22:30 time slots
- [ ] Saturday: 11:00-19:30 time slots  
- [ ] Sunday: 13:00-19:30 time slots
- [ ] Exception handling for other days
- [ ] Ice time calculation and validation

### Step 8: Drag & Drop Scheduling
- [ ] Visual calendar interface
- [ ] Drag and drop game scheduling
- [ ] Time slot conflict detection
- [ ] Game duration fitting validation
- [ ] Move games between days functionality

### Step 9: Admin Override Interface
- [ ] Admin-only scheduling interface
- [ ] Schedule games at any time
- [ ] Override user restrictions
- [ ] Bulk operations

## Phase 5: Communication & Notifications
**Goal:** Enable team communication and invitations

### Step 10: Email Integration
- [ ] Postmark email service integration
- [ ] Swedish language email templates
- [ ] Game invitation emails
- [ ] Team opponent notifications
- [ ] Email scheduling and queuing

### Step 11: Team Communication
- [ ] Team-specific game lists
- [ ] Opponent contact information
- [ ] Game change notifications
- [ ] Status updates

## Phase 6: Advanced Features
**Goal:** Polish and enhance the user experience

### Step 12: Game Changes & Rescheduling
- [ ] Game change request system
- [ ] Rescheduling workflow
- [ ] Change approval process
- [ ] History tracking

### Step 13: Reporting & Analytics
- [ ] Schedule overview reports
- [ ] Team statistics
- [ ] Arena utilization
- [ ] Export functionality

## Phase 7: Testing & Deployment
**Goal:** Ensure quality and deploy to production

### Step 14: Testing
- [ ] Unit tests for critical components
- [ ] Integration tests for API calls
- [ ] E2E tests for user workflows
- [ ] Performance testing

### Step 15: Production Deployment
- [ ] Glesys server configuration
- [ ] Environment variables setup
- [ ] SSL certificate configuration
- [ ] Monitoring and logging
- [ ] Backup procedures

## Technical Requirements

### Frontend Stack
- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite
- **State Management:** TanStack Query (React Query)
- **HTTP Client:** Axios
- **Styling:** CSS with modern design principles
- **Linting:** ESLint + Prettier

### Design Principles
- **UI Style:** Social media app inspired
- **Responsive:** Mobile-first design
- **Accessibility:** WCAG compliance
- **Performance:** Fast loading and smooth interactions

### API Integration
- **Base URL:** `/arenax/api`
- **Data Format:** Proper wrapping (e.g., `{season: {name: "..."}}`)
- **Error Handling:** Comprehensive error states
- **Caching:** React Query for optimal performance

## Current Status
- ✅ Project setup and configuration
- ✅ API client with proper data wrapping
- ✅ Seasons management interface
- ✅ Caddy configuration for serving assets
- 🔄 **Next:** Arenas & Clubs management

## Development Notes
- Each step should be implemented and tested before moving to the next
- Use incremental development with frequent testing
- Maintain clean, linted code throughout
- Follow TypeScript best practices
- Ensure mobile responsiveness at each step
