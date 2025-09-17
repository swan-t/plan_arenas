import axios from 'axios';
import type {
  ApiResponse,
  Arena,
  Club,
  Season,
  League,
  Team,
  Game,
  GameChange,
  User,
  CreateSeasonData,
  CreateArenaData,
  CreateClubData,
  CreateLeagueData,
  CreateTeamData,
  CreateGameData,
  CreateUserData,
} from '@/types';

const API_BASE_URL = 'https://grind.local/arenax/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Generic CRUD operations
const createApiService = <T, CreateT>(endpoint: string, wrapperKey: string) => ({
  getAll: async (): Promise<T[]> => {
    const response = await api.get<ApiResponse<T[]>>(`/${endpoint}`);
    return response.data.data;
  },

  getById: async (id: number): Promise<T> => {
    const response = await api.get<ApiResponse<T>>(`/${endpoint}/${id}`);
    return response.data.data;
  },

  create: async (data: CreateT): Promise<T> => {
    const wrappedData = { [wrapperKey]: data };
    const response = await api.post<ApiResponse<T>>(`/${endpoint}`, wrappedData);
    return response.data.data;
  },

  update: async (id: number, data: Partial<CreateT>): Promise<T> => {
    const wrappedData = { [wrapperKey]: data };
    const response = await api.put<ApiResponse<T>>(`/${endpoint}/${id}`, wrappedData);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/${endpoint}/${id}`);
  },
});

// Specific API services
export const arenasApi = createApiService<Arena, CreateArenaData>('arenas', 'arena');
export const clubsApi = createApiService<Club, CreateClubData>('clubs', 'club');
export const seasonsApi = createApiService<Season, CreateSeasonData>('seasons', 'season');
// Leagues API - uses nested endpoints
export const leaguesApi = {
  // Get leagues for a specific season
  getBySeason: async (seasonId: number): Promise<League[]> => {
    const response = await api.get<ApiResponse<League[]>>(`/seasons/${seasonId}/leagues`);
    return response.data.data;
  },

  // Get a specific league by ID (if needed)
  getById: async (id: number): Promise<League> => {
    const response = await api.get<ApiResponse<League>>(`/leagues/${id}`);
    return response.data.data;
  },

  // Create a league
  create: async (data: CreateLeagueData): Promise<League> => {
    const wrappedData = { league: data };
    const response = await api.post<ApiResponse<League>>('/leagues', wrappedData);
    return response.data.data;
  },

  // Update a league
  update: async (id: number, data: Partial<CreateLeagueData>): Promise<League> => {
    const wrappedData = { league: data };
    const response = await api.put<ApiResponse<League>>(`/leagues/${id}`, wrappedData);
    return response.data.data;
  },

  // Delete a league
  delete: async (id: number): Promise<void> => {
    await api.delete(`/leagues/${id}`);
  },
};
// Teams API - uses nested endpoints
export const teamsApi = {
  // Get teams for a specific league
  getByLeague: async (leagueId: number): Promise<Team[]> => {
    const response = await api.get<ApiResponse<Team[]>>(`/leagues/${leagueId}/teams`);
    return response.data.data;
  },

  // Get all teams
  getAll: async (): Promise<Team[]> => {
    const response = await api.get<ApiResponse<Team[]>>('/teams');
    return response.data.data;
  },

  // Get a specific team by ID
  getById: async (id: number): Promise<Team> => {
    const response = await api.get<ApiResponse<Team>>(`/teams/${id}`);
    return response.data.data;
  },

  // Create a team
  create: async (data: CreateTeamData): Promise<Team> => {
    const wrappedData = { team: data };
    const response = await api.post<ApiResponse<Team>>('/teams', wrappedData);
    return response.data.data;
  },

  // Update a team
  update: async (id: number, data: Partial<CreateTeamData>): Promise<Team> => {
    const wrappedData = { team: data };
    const response = await api.put<ApiResponse<Team>>(`/teams/${id}`, wrappedData);
    return response.data.data;
  },

  // Delete a team
  delete: async (id: number): Promise<void> => {
    await api.delete(`/teams/${id}`);
  },
};

// Games API - uses nested endpoints
export const gamesApi = {
  // Get games for a specific league
  getByLeague: async (leagueId: number): Promise<Game[]> => {
    const response = await api.get<ApiResponse<Game[]>>(`/leagues/${leagueId}/games`);
    return response.data.data;
  },

  // Get all games
  getAll: async (): Promise<Game[]> => {
    const response = await api.get<ApiResponse<Game[]>>('/games');
    return response.data.data;
  },

  // Get a specific game by ID
  getById: async (id: number): Promise<Game> => {
    const response = await api.get<ApiResponse<Game>>(`/games/${id}`);
    return response.data.data;
  },

  // Create a game
  create: async (data: CreateGameData): Promise<Game> => {
    const wrappedData = { game: data };
    const response = await api.post<ApiResponse<Game>>('/games', wrappedData);
    return response.data.data;
  },

  // Update a game
  update: async (id: number, data: Partial<CreateGameData>): Promise<Game> => {
    const wrappedData = { game: data };
    const response = await api.put<ApiResponse<Game>>(`/games/${id}`, wrappedData);
    return response.data.data;
  },

  // Delete a game
  delete: async (id: number): Promise<void> => {
    await api.delete(`/games/${id}`);
  },
};
export const gameChangesApi = createApiService<GameChange, any>('game_changes', 'game_change');
export const usersApi = createApiService<User, CreateUserData>('users', 'user');

// Nested resource endpoints
export const nestedApi = {
  // Get teams for a specific club
  getClubTeams: async (clubId: number): Promise<Team[]> => {
    const response = await api.get<ApiResponse<Team[]>>(`/clubs/${clubId}/teams`);
    return response.data.data;
  },

  // Get teams for a specific league
  getLeagueTeams: async (leagueId: number): Promise<Team[]> => {
    const response = await api.get<ApiResponse<Team[]>>(`/leagues/${leagueId}/teams`);
    return response.data.data;
  },

  // Get games for a specific league
  getLeagueGames: async (leagueId: number): Promise<Game[]> => {
    const response = await api.get<ApiResponse<Game[]>>(`/leagues/${leagueId}/games`);
    return response.data.data;
  },

  // Get leagues for a specific season
  getSeasonLeagues: async (seasonId: number): Promise<League[]> => {
    const response = await api.get<ApiResponse<League[]>>(`/seasons/${seasonId}/leagues`);
    return response.data.data;
  },
};

export default api;
