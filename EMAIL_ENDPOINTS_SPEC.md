# Email Endpoints Implementation Specification

## Overview
This specification outlines the implementation of 3 email endpoints for the Arena Scheduler application using Postmark email service. The endpoints handle team invitations, admin notifications, and formal game invitations.

## Prerequisites
- Postmark account and API key configured
- Swedish email templates ready
- Existing database models for Team, Game, User, Arena, Club, League

## Endpoints to Implement

### 1. Team Invitation to Schedule Games

**Endpoint:** `POST /api/teams/{teamId}/invite-to-schedule`

**Purpose:** Send invitation email to team's contact email when admin invites team to schedule games.

**Request Body:**
```json
{
  "language": "sv" // Optional, defaults to "sv"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invitation sent successfully",
  "emails_sent": 1,
  "emails_failed": 0,
  "details": {
    "sent_to": ["team@example.com"],
    "failed_to": []
  }
}
```

**Implementation Requirements:**
1. Validate that `teamId` exists and has a `contact_email`
2. Get team details including club, league, and arena information
3. Generate a scheduling link (frontend URL + team context)
4. Send Swedish email using Postmark with team invitation template
5. Handle email sending errors gracefully
6. Return detailed response with success/failure counts

**Email Template Variables:**
- `{{team.name}}` - Team name
- `{{team.club.name}}` - Club name
- `{{team.league.name}}` - League name
- `{{team.arena.name}}` - Arena name
- `{{scheduling_link}}` - Link to scheduling interface
- `{{season.name}}` - Current season name

**Error Handling:**
- Return 404 if team doesn't exist
- Return 400 if team has no contact email
- Return 500 for Postmark/email service errors

---

### 2. Notify Admins When Team's Games Are All Scheduled

**Endpoint:** `POST /api/teams/{teamId}/notify-admins-games-scheduled`

**Purpose:** Automatically notify all admin users when a team has scheduled all their games (all games have `scheduled_at` set).

**Request Body:**
```json
{
  "language": "sv" // Optional, defaults to "sv"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin notifications sent successfully",
  "emails_sent": 2,
  "emails_failed": 0,
  "details": {
    "sent_to": ["admin1@example.com", "admin2@example.com"],
    "failed_to": []
  }
}
```

**Implementation Requirements:**
1. Validate that `teamId` exists
2. Get all admin users from database
3. Get team details and scheduling completion summary
4. Send Swedish email to each admin using Postmark
5. **Important:** Implement duplicate prevention - don't send multiple notifications for the same team
6. Handle email sending errors gracefully

**Email Template Variables:**
- `{{team.name}}` - Team name
- `{{team.club.name}}` - Club name
- `{{team.league.name}}` - League name
- `{{games_scheduled_count}}` - Number of games scheduled
- `{{scheduling_completed_at}}` - When scheduling was completed
- `{{season.name}}` - Current season name

**Trigger Logic:**
This endpoint should be called automatically when:
- A game gets `scheduled_at` set (not null)
- Check if ALL games for that team now have `scheduled_at` set
- If yes, call this endpoint (with duplicate prevention)

**Error Handling:**
- Return 404 if team doesn't exist
- Return 500 for Postmark/email service errors

---

### 3. Send Formal Game Invitations to Opponents

**Endpoint:** `POST /api/arenas/{arenaId}/send-game-invitations`

**Purpose:** Send formal invitations for all scheduled games at an arena to away teams with reply-to set to home teams.

**Request Body:**
```json
{
  "language": "sv", // Optional, defaults to "sv"
  "custom_message": "Optional custom message from admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Formal invitations sent successfully",
  "emails_sent": 15,
  "emails_failed": 1,
  "details": {
    "sent_to": ["away1@example.com", "away2@example.com", "..."],
    "failed_to": ["invalid@example.com"],
    "games_included": 15
  }
}
```

**Implementation Requirements:**
1. Validate that `arenaId` exists
2. Get all scheduled games for this arena (where `scheduled_at` is not null)
3. For each game, send formal invitation email:
   - **To:** Away team contact email
   - **Reply-To:** Home team contact email
   - **CC:** Home team contact email
4. Use the Swedish formal invitation template
5. Include custom message if provided
6. Handle email sending errors gracefully
7. Return detailed response with counts

**Email Template (Swedish):**
```
Hej!

{{home_team.club.name}} {{home_team.name}} bjuder härmed in {{away_team.club.name}} {{away_team.name}} till match i {{league.name}}.

Matchen spelas {{game.starts_at}} (Swedish time formatted with month and day names and 24 hour time).

Bekräfta att ni kommer genom att svara på detta meddelande. 

Varmt välkomna!
{{home_team.club.name}} {{home_team.name}}
```

**Email Template Variables:**
- `{{home_team.club.name}}` - Home team's club name
- `{{home_team.name}}` - Home team name
- `{{away_team.club.name}}` - Away team's club name
- `{{away_team.name}}` - Away team name
- `{{league.name}}` - League name
- `{{game.starts_at}}` - Game start time (formatted in Swedish)
- `{{custom_message}}` - Optional custom message from admin

**Error Handling:**
- Return 404 if arena doesn't exist
- Return 400 if no scheduled games found for arena
- Return 500 for Postmark/email service errors

---

## Technical Implementation Details

### Database Queries Needed

**For Endpoint 1 (Team Invitation):**
```sql
SELECT t.*, c.name as club_name, l.name as league_name, a.name as arena_name
FROM teams t
JOIN clubs c ON t.club_id = c.id
JOIN leagues l ON t.league_id = l.id
JOIN arenas a ON c.arena_id = a.id
WHERE t.id = ? AND t.contact_email IS NOT NULL
```

**For Endpoint 2 (Admin Notification):**
```sql
-- Get all admin users
SELECT * FROM users WHERE admin = true AND email IS NOT NULL

-- Check if all games are scheduled for team
SELECT COUNT(*) as total_games, 
       COUNT(scheduled_at) as scheduled_games
FROM games 
WHERE (home_team_id = ? OR away_team_id = ?) 
AND scheduled_at IS NOT NULL
```

**For Endpoint 3 (Formal Invitations):**
```sql
-- Get all scheduled games for arena with team details
SELECT g.*, 
       ht.name as home_team_name, ht.contact_email as home_team_email,
       hc.name as home_club_name,
       at.name as away_team_name, at.contact_email as away_team_email,
       ac.name as away_club_name,
       l.name as league_name
FROM games g
JOIN teams ht ON g.home_team_id = ht.id
JOIN teams at ON g.away_team_id = at.id
JOIN clubs hc ON ht.club_id = hc.id
JOIN clubs ac ON at.club_id = ac.id
JOIN leagues l ON g.league_id = l.id
WHERE g.arena_id = ? AND g.scheduled_at IS NOT NULL
```

### Postmark Integration

**Setup:**
1. Configure Postmark API key in environment variables
2. Set up sender email address (from address)
3. Create Swedish email templates in Postmark dashboard

**Template IDs Needed:**
- `team-invitation-sv` - For endpoint 1
- `admin-notification-sv` - For endpoint 2  
- `formal-invitation-sv` - For endpoint 3

**Email Sending Example:**
```javascript
// Example using Postmark Node.js SDK
const postmark = require('postmark');

const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY);

const email = {
  From: process.env.FROM_EMAIL,
  To: recipientEmail,
  TemplateId: templateId,
  TemplateModel: templateVariables,
  ReplyTo: replyToEmail, // For endpoint 3
  Cc: ccEmail // For endpoint 3
};

const result = await client.sendEmailWithTemplate(email);
```

### Duplicate Prevention (Endpoint 2)

**Strategy:**
Add a `admin_notification_sent_at` field to the `teams` table or create a separate `email_notifications` table to track sent notifications.

**Implementation:**
```sql
-- Add field to teams table
ALTER TABLE teams ADD COLUMN admin_notification_sent_at TIMESTAMP NULL;

-- Or create separate tracking table
CREATE TABLE email_notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_team_notification (team_id, notification_type)
);
```

### Error Handling Standards

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing data, invalid input)
- `404` - Not Found (team/arena doesn't exist)
- `500` - Internal Server Error (Postmark/email service errors)

**Error Response Format:**
```json
{
  "success": false,
  "message": "Error description",
  "emails_sent": 0,
  "emails_failed": 1,
  "error": "Detailed error information"
}
```

### Logging Requirements

**Log the following events:**
1. Email sending attempts (success/failure)
2. Duplicate notification prevention
3. Postmark API responses
4. Database query errors
5. Template rendering errors

**Example Log Entry:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "event": "email_sent",
  "endpoint": "team_invitation",
  "team_id": 123,
  "recipient": "team@example.com",
  "success": true,
  "postmark_message_id": "abc123"
}
```

## Testing Requirements

### Unit Tests
- Test email template rendering with various data
- Test duplicate prevention logic
- Test error handling scenarios

### Integration Tests
- Test Postmark API integration
- Test database queries
- Test email sending with real templates

### Manual Testing Checklist
- [ ] Send team invitation email
- [ ] Verify admin notification is sent when all games scheduled
- [ ] Verify duplicate notifications are prevented
- [ ] Send formal invitations with proper reply-to and CC
- [ ] Test error handling for invalid emails
- [ ] Test error handling for missing data

## Security Considerations

1. **Rate Limiting:** Implement rate limiting to prevent email spam
2. **Input Validation:** Validate all email addresses and input data
3. **API Key Security:** Store Postmark API key securely in environment variables
4. **Email Content:** Sanitize any user-provided content in custom messages
5. **Access Control:** Ensure only authenticated admin users can trigger these endpoints

## Deployment Notes

1. **Environment Variables:**
   ```
   POSTMARK_API_KEY=your_postmark_api_key
   FROM_EMAIL=noreply@yourdomain.com
   FRONTEND_URL=https://yourdomain.com
   ```

2. **Postmark Setup:**
   - Create and verify sender signature
   - Create Swedish email templates
   - Set up webhook for delivery tracking (optional)

3. **Database Migration:**
   - Add notification tracking fields/tables
   - Update existing data if needed

---

**Questions for Backend Developer:**
1. Which framework/language are you using for the backend?
2. Do you need help with Postmark account setup?
3. Should we implement email delivery tracking/webhooks?
4. Any specific logging/monitoring requirements?
5. Do you need the database migration scripts?

This specification provides everything needed to implement the email functionality. Let me know if you need clarification on any part!
