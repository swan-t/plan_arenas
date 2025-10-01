#!/usr/bin/env node

/**
 * Quick check script to see what test data exists
 * Run this first to see what would be deleted
 */

const axios = require('axios');

const API_BASE_URL = 'https://grind.local/arenax/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add your session token here if needed
// To get your session token, check the browser's localStorage for 'arena_session_token'
api.defaults.headers.common['Authorization'] = 'Bearer YwLd1OJy6WbZTfAUfRp9eUxTppOSDbQX';

async function fetchData(endpoint) {
  try {
    const response = await api.get(`/${endpoint}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error.message);
    return [];
  }
}

async function main() {
  console.log('🔍 Checking database for test data...\n');

  const seasons = await fetchData('seasons');
  const leagues = await fetchData('leagues');
  const teams = await fetchData('teams');
  const games = await fetchData('games');

  console.log('📊 Current data:');
  console.log(`  Seasons: ${seasons.length}`);
  seasons.forEach(season => {
    console.log(`    - ${season.name} (ID: ${season.id}, Current: ${season.is_current})`);
  });

  console.log(`\n  Leagues: ${leagues.length}`);
  leagues.forEach(league => {
    const season = seasons.find(s => s.id === league.season_id);
    console.log(`    - ${league.name} (ID: ${league.id}, Season: ${season?.name || 'Unknown'})`);
  });

  console.log(`\n  Teams: ${teams.length}`);
  teams.forEach(team => {
    const league = leagues.find(l => l.id === team.league_id);
    const season = leagues.find(l => l.id === team.league_id) ? seasons.find(s => s.id === league?.season_id) : null;
    console.log(`    - ${team.name} (ID: ${team.id}, League: ${league?.name || 'Unknown'}, Season: ${season?.name || 'Unknown'})`);
  });

  console.log(`\n  Games: ${games.length}`);
  const gamesByLeague = {};
  games.forEach(game => {
    const league = leagues.find(l => l.id === game.league_id);
    const season = league ? seasons.find(s => s.id === league.season_id) : null;
    const key = `${season?.name || 'Unknown'} - ${league?.name || 'Unknown'}`;
    if (!gamesByLeague[key]) gamesByLeague[key] = 0;
    gamesByLeague[key]++;
  });
  
  Object.entries(gamesByLeague).forEach(([key, count]) => {
    console.log(`    - ${key}: ${count} games`);
  });

  // Look for test data patterns
  console.log('\n🧪 Potential test data:');
  const testPatterns = ['test', 'demo', 'sample', 'temp', '2024', '2023', '2022'];
  
  const testSeasons = seasons.filter(season => 
    testPatterns.some(pattern => season.name.toLowerCase().includes(pattern))
  );
  
  if (testSeasons.length > 0) {
    console.log('  Test seasons found:');
    testSeasons.forEach(season => console.log(`    - ${season.name} (ID: ${season.id})`));
  }

  const testLeagues = leagues.filter(league => 
    testPatterns.some(pattern => league.name.toLowerCase().includes(pattern))
  );
  
  if (testLeagues.length > 0) {
    console.log('  Test leagues found:');
    testLeagues.forEach(league => console.log(`    - ${league.name} (ID: ${league.id})`));
  }

  const testTeams = teams.filter(team => 
    testPatterns.some(pattern => team.name.toLowerCase().includes(pattern))
  );
  
  if (testTeams.length > 0) {
    console.log('  Test teams found:');
    testTeams.forEach(team => console.log(`    - ${team.name} (ID: ${team.id})`));
  }

  console.log('\n💡 To clean up test data, run: node cleanup-test-data.js');
}

main().catch(console.error);
