import axios from 'axios';

// ─── Network config ───────────────────────────────────────────────────────────
// Physical device: must use your PC's local WiFi IP (not localhost)
// Android emulator: use 10.0.2.2 instead
// Run `ipconfig` on your PC and look for your WiFi IPv4 address
export const BASE_URL = 'https://musicapi-s1ci.onrender.com';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// ─── API Response wrapper ─────────────────────────────────────────────────────
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// ─── Types from API ───────────────────────────────────────────────────────────
export interface ApiSong {
  id: string;
  title: string;
  artist: string;
  image: string;
  album_id?: string;
  artist_id?: string;
  has_audio?: boolean;
  type?: string;
}

export interface ApiSongDetail {
  id: string;
  title: string;
  artist: string;
  album: string;
  image: string;
  duration: string; // seconds as string e.g. "230"
  has_lyrics: boolean;
  audio_url: string;
  album_id?: string;
  artist_id?: string;
}

export interface Track {
  id: string;
  title: string;
  artistName: string;
  albumTitle?: string;
  duration?: string;
  durationMs?: number;
  cover: string;
  color: string;
  liked: boolean;
  hasLyrics?: boolean;
  album_id?: string;
  artist_id?: string;
}

export interface ApiAlbum {
  id: string;
  title: string;
  image: string;
  year: string;
  songs: ApiSong[];
}

export interface ApiArtist {
  id: string;
  name: string;
  image: string;
}

export interface ApiPlaylist {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  type?: string;
}

export interface ApiAlbumSummary {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  year?: string;
  song_count?: string;
  duration?: string;
}

export interface ApiHomeData {
  trending_songs: ApiSong[];
  featured_artists: ApiArtist[];
  featured_playlists: ApiPlaylist[];
  new_albums: ApiAlbumSummary[];
  top_charts?: ApiPlaylist[];
  trending_playlists?: ApiPlaylist[];
  discover_mix?: ApiPlaylist[];
}

export interface ApiLyrics {
  lyrics: string; // newline-separated
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/** Fetch home screen data (trending, charts, new albums) */
export const fetchHome = async (): Promise<ApiHomeData> => {
  const res = await api.get<ApiResponse<ApiHomeData>>('/api/home');
  const body = res.data as ApiResponse<ApiHomeData>;
  if (!body.success) throw new Error('Failed to fetch home');
  return body.data;
};

/** Search songs by query string */
export const searchSongs = async (query: string): Promise<ApiSong[]> => {
  const res = await api.get<ApiResponse<ApiSong[]>>('/api/search', { params: { query } });
  const body = res.data as ApiResponse<ApiSong[]>;
  if (!body.success) throw new Error('Search failed');
  return body.data;
};

/** Get song details + fresh stream URL (never cached — token expires) */
export const fetchSong = async (songId: string): Promise<ApiSongDetail> => {
  const res = await api.get<ApiResponse<ApiSongDetail>>('/api/song', { params: { id: songId } });
  const body = res.data as ApiResponse<ApiSongDetail>;
  if (!body.success) throw new Error('Failed to fetch song');
  return body.data;
};

/** Get album details with track list */
export const fetchAlbum = async (albumId: string): Promise<ApiAlbum> => {
  const res = await api.get<ApiResponse<ApiAlbum>>('/api/album', { params: { id: albumId } });
  const body = res.data as ApiResponse<ApiAlbum>;
  if (!body.success) throw new Error('Failed to fetch album');
  return body.data;
};

/** Get lyrics for a song (returns plain text, newline-separated) */
export const fetchLyrics = async (songId: string): Promise<string> => {
  const res = await api.get<ApiResponse<ApiLyrics>>('/api/lyrics', { params: { id: songId } });
  const body = res.data as ApiResponse<ApiLyrics>;
  if (!body.success) throw new Error('Failed to fetch lyrics');
  return body.data.lyrics;
};

/** Search for albums */
export const searchAlbums = async (query: string): Promise<ApiAlbumSummary[]> => {
  const res = await api.get<ApiResponse<ApiAlbumSummary[]>>('/api/search/albums', { params: { query } });
  const body = res.data as ApiResponse<ApiAlbumSummary[]>;
  if (!body.success) throw new Error('Album search failed');
  return body.data;
};

/** Search for artists */
export const searchArtists = async (query: string): Promise<ApiArtist[]> => {
  const res = await api.get<ApiResponse<ApiArtist[]>>('/api/search/artists', { params: { query } });
  const body = res.data as ApiResponse<ApiArtist[]>;
  if (!body.success) throw new Error('Artist search failed');
  return body.data;
};

export interface ApiArtistDetail {
  id: string;
  name: string;
  image: string;
  follower_count?: string;
  top_songs: ApiSong[];
  top_albums: ApiAlbumSummary[];
  bio?: string;
}

/** Search for playlists */
export const searchPlaylists = async (query: string): Promise<ApiPlaylist[]> => {
  const res = await api.get<ApiResponse<ApiPlaylist[]>>('/api/search/playlists', { params: { query } });
  const body = res.data as ApiResponse<ApiPlaylist[]>;
  if (!body.success) throw new Error('Playlist search failed');
  return body.data;
};

/** Get artist profile details */
export interface ApiPlaylistDetail {
  id: string;
  title: string;
  image: string;
  song_count: number;
  songs: ApiSong[];
}

export const fetchArtist = async (artistId: string): Promise<ApiArtistDetail> => {
  const res = await api.get<ApiResponse<ApiArtistDetail>>('/api/artist', { params: { id: artistId } });
  const body = res.data as ApiResponse<ApiArtistDetail>;
  if (!body.success) throw new Error('Failed to fetch artist');
  return body.data;
};

export const fetchPlaylist = async (playlistId: string): Promise<ApiPlaylistDetail> => {
  const res = await api.get<ApiResponse<ApiPlaylistDetail>>('/api/playlist', { params: { id: playlistId } });
  const body = res.data as ApiResponse<ApiPlaylistDetail>;
  if (!body.success) throw new Error('Failed to fetch playlist');
  return body.data;
};

/** Get featured playlists */
export const fetchPlaylists = async (): Promise<ApiPlaylist[]> => {
  const res = await api.get<ApiResponse<ApiPlaylist[]>>('/api/playlists');
  const body = res.data as ApiResponse<ApiPlaylist[]>;
  if (!body.success) throw new Error('Failed to fetch playlists');
  return body.data;
};

/** Build stream proxy URL for a given audio URL */
export const buildStreamUrl = (audioUrl: string): string =>
  `${BASE_URL}/api/stream?url=${encodeURIComponent(audioUrl)}`;

export default api;
