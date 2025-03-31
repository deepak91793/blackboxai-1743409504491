import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
    const [youtubeVideos, setYoutubeVideos] = useState([]);
    const [spotifyTracks, setSpotifyTracks] = useState([]);
    const [playlist, setPlaylist] = useState([]);
    const [spotifyToken, setSpotifyToken] = useState(null);
    const [youtubeToken, setYoutubeToken] = useState(null);

    // Spotify OAuth
    const authenticateSpotify = () => {
        const clientId = 'YOUR_SPOTIFY_CLIENT_ID';
        const redirectUri = 'http://localhost:3000/callback';
        const scopes = ['playlist-modify-public', 'playlist-modify-private'];
        window.location = `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join('%20')}&response_type=token`;
    };

    // YouTube OAuth
    const authenticateYouTube = () => {
        const clientId = 'YOUR_YOUTUBE_CLIENT_ID';
        const redirectUri = 'http://localhost:3000/callback';
        const scope = 'https://www.googleapis.com/auth/youtube';
        window.location = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=token`;
    };

    // Fetch YouTube videos
    const fetchYouTubeVideos = async (query) => {
        try {
            const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                params: {
                    part: 'snippet',
                    q: query,
                    type: 'video',
                    maxResults: 10,
                    key: 'YOUR_YOUTUBE_API_KEY'
                }
            });
            setYoutubeVideos(response.data.items);
        } catch (error) {
            console.error('YouTube API error:', error);
        }
    };

    // Fetch Spotify tracks
    const fetchSpotifyTracks = async (query) => {
        try {
            const response = await axios.get('https://api.spotify.com/v1/search', {
                params: {
                    q: query,
                    type: 'track',
                    limit: 10
                },
                headers: {
                    'Authorization': `Bearer ${spotifyToken}`
                }
            });
            setSpotifyTracks(response.data.tracks.items);
        } catch (error) {
            console.error('Spotify API error:', error);
        }
    };

    // Add to playlist
    const addToPlaylist = (item) => {
        setPlaylist([...playlist, {
            id: item.id?.videoId || item.id,
            title: item.snippet?.title || item.name,
            artist: item.snippet?.channelTitle || item.artists[0]?.name,
            source: item.snippet ? 'youtube' : 'spotify'
        }]);
    };

    // Save playlist to Spotify
    const saveToSpotify = async () => {
        try {
            const response = await axios.post('https://api.spotify.com/v1/me/playlists', {
                name: 'Collaborative Playlist',
                public: true,
                description: 'Created with Collaborative Playlist App'
            }, {
                headers: {
                    'Authorization': `Bearer ${spotifyToken}`
                }
            });
            
            const playlistId = response.data.id;
            const trackUris = playlist
                .filter(item => item.source === 'spotify')
                .map(item => `spotify:track:${item.id}`);

            await axios.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                uris: trackUris
            }, {
                headers: {
                    'Authorization': `Bearer ${spotifyToken}`
                }
            });
        } catch (error) {
            console.error('Error saving playlist:', error);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Collaborative Playlist App</h1>
            
            <div className="flex space-x-4 mb-6">
                <button 
                    onClick={authenticateSpotify}
                    className="bg-green-500 text-white px-4 py-2 rounded"
                >
                    Login with Spotify
                </button>
                <button 
                    onClick={authenticateYouTube}
                    className="bg-red-500 text-white px-4 py-2 rounded"
                >
                    Login with YouTube
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h2 className="text-xl font-semibold mb-2">YouTube Search</h2>
                    <input
                        type="text"
                        placeholder="Search YouTube"
                        onChange={(e) => fetchYouTubeVideos(e.target.value)}
                        className="w-full p-2 border rounded mb-4"
                    />
                    <ul className="space-y-2">
                        {youtubeVideos.map(video => (
                            <li key={video.id.videoId} className="flex justify-between items-center p-2 border rounded">
                                <div>
                                    <p className="font-medium">{video.snippet.title}</p>
                                    <p className="text-sm text-gray-600">{video.snippet.channelTitle}</p>
                                </div>
                                <button 
                                    onClick={() => addToPlaylist(video)}
                                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                                >
                                    Add
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">Spotify Search</h2>
                    <input
                        type="text"
                        placeholder="Search Spotify"
                        onChange={(e) => fetchSpotifyTracks(e.target.value)}
                        className="w-full p-2 border rounded mb-4"
                    />
                    <ul className="space-y-2">
                        {spotifyTracks.map(track => (
                            <li key={track.id} className="flex justify-between items-center p-2 border rounded">
                                <div>
                                    <p className="font-medium">{track.name}</p>
                                    <p className="text-sm text-gray-600">{track.artists[0].name}</p>
                                </div>
                                <button 
                                    onClick={() => addToPlaylist(track)}
                                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                                >
                                    Add
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-2">Your Playlist ({playlist.length})</h2>
                {playlist.length > 0 && (
                    <button 
                        onClick={saveToSpotify}
                        className="bg-green-500 text-white px-4 py-2 rounded mb-4"
                    >
                        Save to Spotify
                    </button>
                )}
                <ul className="space-y-2">
                    {playlist.map((item, index) => (
                        <li key={index} className="flex justify-between items-center p-2 border rounded">
                            <div>
                                <p className="font-medium">{item.title}</p>
                                <p className="text-sm text-gray-600">{item.artist}</p>
                            </div>
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                                {item.source}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default App;