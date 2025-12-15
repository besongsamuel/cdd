import { YOUTUBE_CHANNEL_ID } from '../utils/constants';

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  videoId: string;
}

// Fetch latest videos from YouTube RSS feed
export const youtubeService = {
  async getLatestVideos(count: number = 3): Promise<YouTubeVideo[]> {
    try {
      // Use YouTube RSS feed (no API key required)
      // Using CORS proxy to bypass CORS restrictions
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
      const response = await fetch(proxyUrl);
      const text = await response.text();
      
      // Parse RSS XML
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');
      const entries = xml.querySelectorAll('entry');
      
      const videos: YouTubeVideo[] = [];
      const maxVideos = Math.min(count, entries.length);
      
      for (let i = 0; i < maxVideos; i++) {
        const entry = entries[i];
        if (!entry) continue;
        
        // Get video ID from the entry's ID element (format: yt:video:VIDEO_ID)
        const entryId = entry.querySelector('id')?.textContent || '';
        const videoIdMatch = entryId.match(/video:([a-zA-Z0-9_-]+)$/);
        const videoId = videoIdMatch ? videoIdMatch[1] : '';
        
        if (!videoId) continue;
        
        const title = entry.querySelector('title')?.textContent || '';
        const published = entry.querySelector('published')?.textContent || '';
        const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        
        videos.push({
          id: videoId,
          title: title,
          thumbnail: thumbnail,
          publishedAt: published,
          videoId: videoId,
        });
      }
      
      return videos;
    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
      return [];
    }
  },
};

