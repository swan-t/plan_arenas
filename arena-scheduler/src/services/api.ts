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
export const leaguesApi = createApiService<League, CreateLeagueData>('leagues', 'league');
export const teamsApi = createApiService<Team, CreateTeamData>('teams', 'team');
export const gamesApi = createApiService<Game, CreateGameData>('games', 'game');
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
