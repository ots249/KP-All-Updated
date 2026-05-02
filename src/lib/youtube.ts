/**
 * Utility functions for YouTube interactions, aligned with project reference code.
 */

const YOUTUBE_API_KEY = 'AIzaSyC4jVo_d7EEo1115oUexLMm-d2WzaK29UM';

export const extractYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;
    let videoId = '';
    
    if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/watch')) {
        try {
            const urlObj = new URL(url);
            const urlParams = new URLSearchParams(urlObj.search);
            videoId = urlParams.get('v') || '';
        } catch (e) {
            console.error('Invalid URL:', url);
        }
    } else if (url.includes('youtube.com/live/')) {
        videoId = url.split('live/')[1].split('?')[0];
    } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('embed/')[1].split('?')[0];
    } else if (url.includes('youtube.com/shorts/')) {
        videoId = url.split('shorts/')[1].split('?')[0];
    }
    
    return videoId || null;
};

const formatDuration = (duration: string): string => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '00:00';
    
    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');
    
    let result = '';
    
    if (hours) {
        result += `${hours.padStart(2, '0')}:`;
        result += `${(minutes || '0').padStart(2, '0')}:`;
        result += `${(seconds || '0').padStart(2, '0')}`;
    } else if (minutes) {
        result += `${minutes.padStart(2, '0')}:`;
        result += `${(seconds || '0').padStart(2, '0')}`;
    } else {
        result = `00:${(seconds || '0').padStart(2, '0')}`;
    }
    
    return result;
};

const getCache = (): Record<string, string> => {
    try {
        return JSON.parse(localStorage.getItem('videoDurationCache') || '{}');
    } catch {
        return {};
    }
};

const setCache = (cache: Record<string, string>) => {
    localStorage.setItem('videoDurationCache', JSON.stringify(cache));
};

export const getVideoDuration = async (videoId: string): Promise<string> => {
    const cache = getCache();
    if (cache[videoId]) return cache[videoId];

    if (!YOUTUBE_API_KEY) return '00:00';

    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
        );
        
        if (!response.ok) return '--:--';
        
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            const item = data.items[0];
            
            // Check if it's a live broadcast
            if (item.snippet.liveBroadcastContent === 'live') {
                const liveLabel = 'LIVE';
                const newCache = getCache();
                newCache[videoId] = liveLabel;
                setCache(newCache);
                return liveLabel;
            }

            const duration = item.contentDetails.duration;
            const formatted = formatDuration(duration);
            
            const newCache = getCache();
            newCache[videoId] = formatted;
            setCache(newCache);
            
            return formatted;
        }
        return '00:00';
    } catch (error) {
        console.error('Error fetching video duration:', error);
        return '00:00';
    }
};
