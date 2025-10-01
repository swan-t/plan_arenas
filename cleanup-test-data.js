#!/usr/bin/env node

/**
 * Database Cleanup Script
 * Removes test data not belonging to the 2025-2026 season
 * 
 * WARNING: This script will permanently delete data from the database.
 * Make sure to backup your database before running this script.
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
// api.defaults.headers.common['Authorization'] = 'Bearer YOUR_SESSION_TOKEN';

async function fetchData(endpoint) {
  try {
    const response = await api.get(`/${endpoint}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error.message);
    return [];
  }
}

async function deleteData(endpoint, id) {
  try {
    await api.delete(`/${endpoint}/${id}`);
    console.log(`✓ Deleted ${endpoint} ${id}`);
    return true;
  } catch (error) {
    console.error(`✗ Failed to delete ${endpoint} ${id}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🧹 Starting database cleanup...\n');

  // Step 1: Fetch all data
  console.log('📊 Fetching current data...');
  const seasons = await fetchData('seasons');
  const leagues = await fetchData('leagues');
  const teams = await fetchData('teams');
  const games = await fetchData('games');
  const clubs = await fetchData('clubs');
  const arenas = await fetchData('arenas');

  console.log(`Found: ${seasons.length} seasons, ${leagues.length} leagues, ${teams.length} teams, ${games.length} games`);

  // Step 2: Identify the 2025-2026 season
  const targetSeason = seasons.find(season => 
    season.name.toLowerCase().includes('2025-2026') || 
    season.name.toLowerCase().includes('2025/2026') ||
    season.name.toLowerCase().includes('2025-26') ||
    season.name.toLowerCase().includes('2025/26')
  );

  if (!targetSeason) {
    console.log('\n❌ Could not find 2025-2026 season. Available seasons:');
    seasons.forEach(season => console.log(`  - ${season.name} (ID: ${season.id}, Current: ${season.is_current})`));
    console.log('\nPlease check the season names and update the script accordingly.');
    return;
  }

  console.log(`\n🎯 Target season: ${targetSeason.name} (ID: ${targetSeason.id})`);

  // Step 3: Identify data to keep (belonging to 2025-2026 season)
  const leaguesToKeep = leagues.filter(league => league.season_id === targetSeason.id);
  const leagueIdsToKeep = leaguesToKeep.map(league => league.id);
  const teamsToKeep = teams.filter(team => leagueIdsToKeep.includes(team.league_id));
  const teamIdsToKeep = teamsToKeep.map(team => team.id);
  const gamesToKeep = games.filter(game => leagueIdsToKeep.includes(game.league_id));

  console.log(`\n📋 Data to keep:`);
  console.log(`  - Season: ${targetSeason.name} (ID: ${targetSeason.id})`);
  console.log(`  - Leagues: ${leaguesToKeep.length} (IDs: ${leagueIdsToKeep.join(', ')})`);
  console.log(`  - Teams: ${teamsToKeep.length} (IDs: ${teamIdsToKeep.join(', ')})`);
  console.log(`  - Games: ${gamesToKeep.length}`);

  // Step 4: Identify data to delete
  const seasonsToDelete = seasons.filter(season => season.id !== targetSeason.id);
  const leaguesToDelete = leagues.filter(league => !leagueIdsToKeep.includes(league.id));
  const teamsToDelete = teams.filter(team => !teamIdsToKeep.includes(team.id));
  const gamesToDelete = games.filter(game => !leagueIdsToKeep.includes(game.league_id));

  console.log(`\n🗑️  Data to delete:`);
  console.log(`  - Seasons: ${seasonsToDelete.length}`);
  seasonsToDelete.forEach(season => console.log(`    - ${season.name} (ID: ${season.id})`));
  
  console.log(`  - Leagues: ${leaguesToDelete.length}`);
  leaguesToDelete.forEach(league => console.log(`    - ${league.name} (ID: ${league.id}, Season: ${league.season_id})`));
  
  console.log(`  - Teams: ${teamsToDelete.length}`);
  teamsToDelete.forEach(team => console.log(`    - ${team.name} (ID: ${team.id}, League: ${team.league_id})`));
  
  console.log(`  - Games: ${gamesToDelete.length}`);
  gamesToDelete.forEach(game => console.log(`    - Game ${game.id} (League: ${game.league_id})`));

  // Step 5: Confirmation
  console.log(`\n⚠️  WARNING: This will permanently delete ${seasonsToDelete.length + leaguesToDelete.length + teamsToDelete.length + gamesToDelete.length} items!`);
  console.log('This action cannot be undone. Make sure you have a database backup.');
  
  // Uncomment the following lines to actually perform the deletion
  // For safety, the script is set to dry-run mode by default
  
  /*
  console.log('\n🚀 Starting deletion...');
  
  // Delete in reverse dependency order
  let deletedCount = 0;
  
  // Delete games first
  for (const game of gamesToDelete) {
    if (await deleteData('games', game.id)) {
      deletedCount++;
    }
  }
  
  // Delete teams
  for (const team of teamsToDelete) {
    if (await deleteData('teams', team.id)) {
      deletedCount++;
    }
  }
  
  // Delete leagues
  for (const league of leaguesToDelete) {
    if (await deleteData('leagues', league.id)) {
      deletedCount++;
    }
  }
  
  // Delete seasons
  for (const season of seasonsToDelete) {
    if (await deleteData('seasons', season.id)) {
      deletedCount++;
    }
  }
  
  console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} items.`);
  */
  
  console.log('\n🔒 Script is in DRY-RUN mode. Uncomment the deletion code to actually perform the cleanup.');
}

main().catch(console.error);
