// ─── Colors ─────────────────────────────────────────────────────────────────
export const COLORS = {
  background: '#0A0A0A',
  surface: '#151515',
  surfaceLight: '#1E1E1E',
  accent: '#E8315B',
  accentDark: '#C0284C',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#606060',
  border: '#2A2A2A',
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Artist {
  id: string;
  name: string;
  verified: boolean;
  listeners: string;
  image: string;
  color: string;
  bio: string;
  following: boolean;
}

export interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  songCount: number;
  duration: string;
  releaseDate: string;
  cover: string;
  color: string;
}

export interface LyricLine {
  time: number; // seconds
  text: string;
}

export interface Track {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumTitle: string;
  duration: string;
  durationMs: number;
  listeners: string;
  cover: string;
  color: string;
  liked: boolean;
  lyrics: LyricLine[];
}

// ─── Artists ─────────────────────────────────────────────────────────────────
export const artists: Artist[] = [
  {
    id: '1',
    name: 'The Weeknd',
    verified: true,
    listeners: '4.5M',
    image: 'https://i.scdn.co/image/ab6761610000e5eb214f3cf1cbe7139c1e26ffbb',
    color: '#8B1A1A',
    bio: 'Abel Makkonen Tesfaye, known professionally as The Weeknd, is a Canadian singer, songwriter, and record producer known for his boundary-pushing blend of R&B, pop, and electronic music.',
    following: true,
  },
  {
    id: '2',
    name: 'Sabrina Carpenter',
    verified: true,
    listeners: '3.2M',
    image: 'https://i.scdn.co/image/ab6761610000e5eb3f7f9d63c5fc41b2f4c9e0ab',
    color: '#1A3A5C',
    bio: 'Sabrina Annlynn Carpenter is an American singer, songwriter, and actress known for her catchy pop sound.',
    following: false,
  },
  {
    id: '3',
    name: 'Kendrick Lamar',
    verified: true,
    listeners: '6.1M',
    image: 'https://i.scdn.co/image/ab6761610000e5eb437b9e2a82505b3d93ff1022',
    color: '#1A2A1A',
    bio: 'Kendrick Lamar Duckworth is an American rapper and songwriter widely regarded as one of the greatest of his generation.',
    following: true,
  },
  {
    id: '4',
    name: 'Bruno Mars',
    verified: true,
    listeners: '5.8M',
    image: 'https://i.scdn.co/image/ab6761610000e5eb92809d5e24b16adf27db5ba0',
    color: '#1A1A3A',
    bio: 'Peter Gene Hernandez, known as Bruno Mars, is an American singer-songwriter and producer known for his retro soul-pop style.',
    following: false,
  },
  {
    id: '5',
    name: 'Lady Gaga',
    verified: true,
    listeners: '7.2M',
    image: 'https://i.scdn.co/image/ab6761610000e5eb88a0f99e0440d56bc3cf2ffc',
    color: '#2A1A3A',
    bio: 'Stefani Joanne Angelina Germanotta, known as Lady Gaga, is an American singer-songwriter known for her flamboyant style and powerful vocals.',
    following: false,
  },
];

// ─── Albums ──────────────────────────────────────────────────────────────────
export const albums: Album[] = [
  {
    id: 'a1',
    title: 'Hurry Up Tomorrow',
    artistId: '1',
    artistName: 'The Weeknd',
    songCount: 22,
    duration: '1 hr 24 min',
    releaseDate: '16 May 2025',
    cover: 'https://i.scdn.co/image/ab67616d0000b273f46b9d202509a8f7384b90de',
    color: '#3D1515',
  },
  {
    id: 'a2',
    title: 'Starboy',
    artistId: '1',
    artistName: 'The Weeknd',
    songCount: 18,
    duration: '1 hr 03 min',
    releaseDate: '25 Nov 2016',
    cover: 'https://i.scdn.co/image/ab67616d0000b2734718e2b124f79258be7bc452',
    color: '#1A0A2E',
  },
  {
    id: 'a3',
    title: 'After Hours',
    artistId: '1',
    artistName: 'The Weeknd',
    songCount: 14,
    duration: '56 min',
    releaseDate: '20 Mar 2020',
    cover: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
    color: '#1A0000',
  },
  {
    id: 'a4',
    title: 'Short n Sweet',
    artistId: '2',
    artistName: 'Sabrina Carpenter',
    songCount: 12,
    duration: '36 min',
    releaseDate: '23 Aug 2024',
    cover: 'https://i.scdn.co/image/ab67616d0000b273f3b5b13d3d2dbba3c7b0f6c8',
    color: '#3A1A2A',
  },
  {
    id: 'a5',
    title: 'GNX',
    artistId: '3',
    artistName: 'Kendrick Lamar',
    songCount: 12,
    duration: '44 min',
    releaseDate: '22 Nov 2024',
    cover: 'https://i.scdn.co/image/ab67616d0000b2730187cef5c4e8b57ab96e7ac5',
    color: '#0A1A0A',
  },
  {
    id: 'a6',
    title: 'Mayhem',
    artistId: '5',
    artistName: 'Lady Gaga',
    songCount: 14,
    duration: '53 min',
    releaseDate: '7 Mar 2025',
    cover: 'https://i.scdn.co/image/ab67616d0000b2731c6fc418a3c9a81e45d2ef82',
    color: '#1A0A2E',
  },
];

// ─── Tracks ──────────────────────────────────────────────────────────────────
export const tracks: Track[] = [
  {
    id: 't1',
    title: 'Timeless',
    artistId: '1',
    artistName: 'The Weeknd',
    albumId: 'a1',
    albumTitle: 'Hurry Up Tomorrow',
    duration: '4:16',
    durationMs: 256000,
    listeners: '143,779',
    cover: 'https://i.scdn.co/image/ab67616d0000b273f46b9d202509a8f7384b90de',
    color: '#3D1515',
    liked: true,
    lyrics: [
      { time: 0, text: 'Ayy' },
      { time: 5, text: "I'm tryna put you in the worst mood, ah" },
      { time: 10, text: 'P1 cleaner than your church shoes, ah' },
      { time: 15, text: "Milli' point two just to hurt you, ah" },
      { time: 20, text: "All red Lamb' just to tease you, ah" },
      { time: 25, text: 'None of these toys on lease too, ah' },
      { time: 30, text: "Made your whole year in a week too, yah" },
      { time: 35, text: 'Bad bad, me outside, how bout dat' },
      { time: 40, text: 'Shawty a star but she messed around' },
      { time: 45, text: 'And caught feelings for a rap n***a' },
    ],
  },
  {
    id: 't2',
    title: 'One of the Girls',
    artistId: '1',
    artistName: 'The Weeknd',
    albumId: 'a1',
    albumTitle: 'Hurry Up Tomorrow',
    duration: '4:05',
    durationMs: 245000,
    listeners: '84,943',
    cover: 'https://i.scdn.co/image/ab67616d0000b273f46b9d202509a8f7384b90de',
    color: '#3D1515',
    liked: false,
    lyrics: [
      { time: 0, text: 'She said she wants to be one of the girls' },
      { time: 8, text: 'Running with the wolves at night' },
      { time: 16, text: 'Dancing in the pale moonlight' },
      { time: 24, text: 'She said she wants to feel what real love feels like' },
    ],
  },
  {
    id: 't3',
    title: 'São Paulo',
    artistId: '1',
    artistName: 'The Weeknd',
    albumId: 'a1',
    albumTitle: 'Hurry Up Tomorrow',
    duration: '5:01',
    durationMs: 301000,
    listeners: '64,288',
    cover: 'https://i.scdn.co/image/ab67616d0000b273f46b9d202509a8f7384b90de',
    color: '#3D1515',
    liked: false,
    lyrics: [
      { time: 0, text: 'São Paulo, city of lights' },
      { time: 8, text: 'Where we lost ourselves that night' },
      { time: 16, text: 'In the crowd, we found a reason' },
      { time: 24, text: 'Love without a meaning' },
    ],
  },
  {
    id: 't4',
    title: 'Starboy',
    artistId: '1',
    artistName: 'The Weeknd, Daft Punk',
    albumId: 'a2',
    albumTitle: 'Starboy',
    duration: '3:50',
    durationMs: 230000,
    listeners: '61,380',
    cover: 'https://i.scdn.co/image/ab67616d0000b2734718e2b124f79258be7bc452',
    color: '#1A0A2E',
    liked: true,
    lyrics: [
      { time: 0, text: 'Ayy' },
      { time: 5, text: "I'm tryna put you in the worst mood, ah" },
      { time: 10, text: 'P1 cleaner than your church shoes, ah' },
      { time: 15, text: "Milli' point two just to hurt you, ah" },
      { time: 20, text: "All red Lamb' just to tease you, ah" },
      { time: 25, text: 'None of these toys on lease too, ah' },
      { time: 30, text: "Made your whole year in a week too, yah" },
      { time: 35, text: 'Bad bad, me outside, how bout dat' },
    ],
  },
  {
    id: 't5',
    title: 'Blinding Lights',
    artistId: '1',
    artistName: 'The Weeknd',
    albumId: 'a3',
    albumTitle: 'After Hours',
    duration: '3:20',
    durationMs: 200000,
    listeners: '213,445',
    cover: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
    color: '#1A0000',
    liked: true,
    lyrics: [
      { time: 0, text: "I've been tryna call" },
      { time: 6, text: "I've been on my own for long enough" },
      { time: 12, text: "Maybe you can show me how to love, maybe" },
      { time: 18, text: "I'm going through withdrawals" },
      { time: 24, text: "You don't even have to do too much" },
      { time: 30, text: "You can turn me on with just a touch, baby" },
    ],
  },
  {
    id: 't6',
    title: 'Not Like Us',
    artistId: '3',
    artistName: 'Kendrick Lamar',
    albumId: 'a5',
    albumTitle: 'GNX',
    duration: '4:34',
    durationMs: 274000,
    listeners: '198,231',
    cover: 'https://i.scdn.co/image/ab67616d0000b2730187cef5c4e8b57ab96e7ac5',
    color: '#0A1A0A',
    liked: false,
    lyrics: [
      { time: 0, text: 'They not like us' },
      { time: 6, text: 'They not like us' },
      { time: 12, text: "A minor, a minor, a minor — they not like us" },
      { time: 18, text: "Certified lover boy? Certified pedophile" },
    ],
  },
  {
    id: 't7',
    title: 'Die With a Smile',
    artistId: '5',
    artistName: 'Lady Gaga, Bruno Mars',
    albumId: 'a6',
    albumTitle: 'Mayhem',
    duration: '4:11',
    durationMs: 251000,
    listeners: '287,654',
    cover: 'https://i.scdn.co/image/ab67616d0000b2731c6fc418a3c9a81e45d2ef82',
    color: '#1A0A2E',
    liked: true,
    lyrics: [
      { time: 0, text: "I'll never let you down forever" },
      { time: 6, text: "I'll give you all of me, my love" },
      { time: 12, text: "If the world was ending" },
      { time: 18, text: "I'd want to be next to you" },
      { time: 24, text: "So let's just dance until we die" },
      { time: 30, text: "At least we'd die with a smile" },
    ],
  },
  {
    id: 't8',
    title: 'Espresso',
    artistId: '2',
    artistName: 'Sabrina Carpenter',
    albumId: 'a4',
    albumTitle: 'Short n Sweet',
    duration: '2:55',
    durationMs: 175000,
    listeners: '312,890',
    cover: 'https://i.scdn.co/image/ab67616d0000b273f3b5b13d3d2dbba3c7b0f6c8',
    color: '#3A1A2A',
    liked: false,
    lyrics: [
      { time: 0, text: "I can't relate to desperation" },
      { time: 6, text: "My give a damns are on vacation" },
      { time: 12, text: "I'm on my way to the good life" },
      { time: 18, text: "Might as well enjoy the ride" },
      { time: 24, text: "That's that me espresso" },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const recentlyPlayedIds = ['t1', 't6', 't7', 't4'];
export const newReleaseAlbumIds = ['a6', 'a1', 'a5'];

export const getTracksByArtist = (artistId: string) =>
  tracks.filter((t) => t.artistId === artistId);

export const getAlbumsByArtist = (artistId: string) =>
  albums.filter((a) => a.artistId === artistId);

export const getTrack = (trackId: string) =>
  tracks.find((t) => t.id === trackId);

export const getAlbum = (albumId: string) =>
  albums.find((a) => a.id === albumId);

export const getArtist = (artistId: string) =>
  artists.find((a) => a.id === artistId);

export const getTracksByAlbum = (albumId: string) =>
  tracks.filter((t) => t.albumId === albumId);
