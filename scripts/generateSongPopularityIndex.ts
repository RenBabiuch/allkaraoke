import dotenv from 'dotenv';
import fs from 'fs';
import currentSongs from '../public/songs/index.json';

dotenv.config({ path: '.env.local' });

const API_URL = 'https://eu.posthog.com';
const PROJECT_ID = '281';

const TOP_SONGS_COUNT = 250;

const makeRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      Authorization: `Bearer ${process.env.VITE_APP_POSTHOG_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
};

interface Response {
  // ["songId", "played", "sessions", "users"]
  results: [string, number, number, number][];
}

(async () => {
  const response: Response = await makeRequest(`/api/projects/${PROJECT_ID}/query`, {
    method: 'POST',
    body: JSON.stringify({
      query: {
        kind: 'HogQLQuery',
        query: `
              select events.properties.songId \`songId\`,
                     count() \`played\`,
                     count(DISTINCT $session_id) \`sessions\`,
                     count(DISTINCT properties.$user_id) \`users\`
              from events
              where event = 'songEnded'
                and created_at >= (now() - INTERVAL 45 DAY)
              group by properties.songId
              order by sessions desc limit 2000
          `,
      },
    }),
  });

  const builtInSongsRating = response.results.filter(([song]) =>
    currentSongs.some((currentSong) => currentSong.id === song),
  );

  const getLanguage = (lang?: string | string[]) => (Array.isArray(lang) ? lang[0] : lang);

  /// group by language
  const songsByLanguage: Record<string, [string, number, number, number][]> = {};
  builtInSongsRating.forEach((song) => {
    const language = getLanguage(currentSongs.find((currentSong) => currentSong.id === song[0])?.language) || 'unknown';
    if (!songsByLanguage[language]) {
      songsByLanguage[language] = [];
    }
    songsByLanguage[language].push(song);
  });

  const topSongsByLanguage: Record<string, [string, number, number, number][]> = {};
  Object.entries(songsByLanguage).forEach(([language, songs]) => {
    topSongsByLanguage[language] = songs.slice(0, TOP_SONGS_COUNT);
  });

  /// remove languages with less than 10 songs
  Object.keys(topSongsByLanguage).forEach((language) => {
    if (topSongsByLanguage[language].length < TOP_SONGS_COUNT) {
      delete topSongsByLanguage[language];
    }
  });

  /// leave only songId
  const mostPopularSongs: Record<string, string[]> = {};
  Object.keys(topSongsByLanguage).forEach((language) => {
    mostPopularSongs[language] = topSongsByLanguage[language].map(([songId]) => songId);
  });

  fs.writeFileSync('./public/mostPopularSongs.json', JSON.stringify(mostPopularSongs, null, 2));
})();
