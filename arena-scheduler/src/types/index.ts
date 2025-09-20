// API Response wrapper
export interface ApiResponse<T> {
  data: T;
}

// Core entities
export interface Arena {
  id: number;
  name: string;
}

export interface Club {
  id: number;
  name: string;
  arena_id: number;
}

export interface Season {
  id: number;
  name: string;
}

export interface League {
  id: number;
  name: string;
  priority: number;
  default_ice_time: number;
  official_url?: string;
  season_id: number;
}

export interface Team {
  id: number;
  club_id: number;
  league_id: number;
  name: string;
  url?: string;
  contact_email?: string;
  scheduling_done_at?: string;
}

export interface Game {
  id: number;
  home_team_id: number;
  away_team_id: number;
  league_id: number;
  arena_id: number;
  starts_at: string;
  ice_time: number;
  scheduled_at?: string | null; // null means not scheduled
}

export interface GameChange {
  id: number;
  game_id: number;
  starts_at?: string;
  old_starts_at?: string;
  arena_id?: number;
  old_arena_id?: number;
  is_confirmed: boolean;
}

export interface User {
  id: number;
  email: string;
  admin: boolean;
  email_code?: string;
  code_expires_at?: string;
  teams?: Team[]; // Many-to-many relationship
}

export interface UserTeam {
  id: number;
  user_id: number;
  team_id: number;
  team: Team;
}

// Form data types
export interface CreateSeasonData {
  name: string;
}

export interface CreateArenaData {
  name: string;
}

export interface CreateClubData {
  name: string;
  arena_id: number;
}

export interface CreateLeagueData {
  name: string;
  priority: number;
  default_ice_time: number;
  official_url?: string;
  season_id: number;
}

export interface CreateTeamData {
  name: string;
  club_id: number;
  league_id: number;
  url?: string;
  contact_email?: string;
  scheduling_done_at?: string;
}

export interface CreateGameData {
  home_team_id: number;
  away_team_id: number;
  league_id: number;
  arena_id: number;
  starts_at: string;
  ice_time: number;
}

export interface CreateUserData {
  email: string;
  admin: boolean;
  email_code?: string;
  code_expires_at?: string;
  teams?: Team[]; // Many-to-many relationship
}

// Authentication types
export interface AuthSession {
  code: string;
  expires_at: string;
}

export interface SendCodeRequest {
  email: string;
}

export interface SendCodeResponse {
  message: string;
  code?: string; // Only in development mode
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface VerifyCodeResponse {
  message: string;
  session: AuthSession;
}

export interface CurrentUser {
  id: number;
  email: string;
  admin: boolean;
  teams?: Team[]; // All teams the user belongs to
}

export interface LogoutRequest {
  code: string;
}

export interface LogoutResponse {
  message: string;
}
