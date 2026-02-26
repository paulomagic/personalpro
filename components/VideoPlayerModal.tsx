import React, { useState } from 'react';

interface VideoPlayerModalProps {
    videoUrl: string;
    exerciseName: string;
    onClose: () => void;
}

// Extract YouTube video ID from various URL formats
const getYouTubeVideoId = (url: string): string | null => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
        /youtube\.com\/shorts\/([^&\s?]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
};

// Check if URL is a YouTube URL
const isYouTubeUrl = (url: string): boolean => {
    return url.includes('youtube.com') || url.includes('youtu.be');
};

// Check if browser supports webm
const supportsWebm = (): boolean => {
    if (typeof document === 'undefined') return false;
    const video = document.createElement('video');
    return video.canPlayType('video/webm; codecs="vp9"') !== '' ||
        video.canPlayType('video/webm; codecs="vp8"') !== '';
};

// Check if device is iOS
const isIOS = (): boolean => {
    if (typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Helper to determine video MIME type
const getVideoType = (url: string): string => {
    if (url.toLowerCase().endsWith('.webm')) return 'video/webm';
    if (url.toLowerCase().endsWith('.ogv')) return 'video/ogg';
    return 'video/mp4'; // Default to mp4
};

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ videoUrl, exerciseName, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const videoId = getYouTubeVideoId(videoUrl);
    const isYouTube = isYouTubeUrl(videoUrl);
    const videoType = getVideoType(videoUrl);

    // Check if format is supported on this device
    const isWebm = videoUrl.toLowerCase().includes('.webm');
    const webmSupported = supportsWebm();
    const formatNotSupported = isWebm && !webmSupported;

    const handleIframeLoad = () => {
        setLoading(false);
    };

    const handleIframeError = () => {
        setLoading(false);
        setError(true);
    };

    return (
        <div
            className="fixed inset-0 bg-slate-950/90 z-[100] flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 size-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
            >
                <span className="material-symbols-outlined text-2xl">close</span>
            </button>

            {/* Video container */}
            <div
                className="w-full max-w-2xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-white">play_circle</span>
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">{exerciseName}</h3>
                            <p className="text-slate-400 text-xs">Vídeo de execução</p>
                        </div>
                    </div>
                </div>

                {/* Video Player */}
                <div className="relative aspect-video bg-slate-950">
                    {loading && !formatNotSupported && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="size-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}

                    {/* Format not supported on iOS Safari */}
                    {formatNotSupported && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                            <span className="material-symbols-outlined text-5xl text-blue-500 mb-3">play_circle</span>
                            <p className="text-white font-medium mb-1">Vídeo disponível</p>
                            <p className="text-slate-400 text-sm mb-4">Este formato não é suportado no Safari iOS</p>
                            <a
                                href={videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-lg">open_in_new</span>
                                Abrir vídeo no Safari
                            </a>
                        </div>
                    )}

                    {error && !formatNotSupported && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                            <span className="material-symbols-outlined text-5xl text-slate-600 mb-3">error</span>
                            <p className="text-slate-400 text-sm">Não foi possível carregar o vídeo</p>
                            <a
                                href={videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors"
                            >
                                {isYouTube ? 'Abrir no YouTube' : 'Abrir link original'}
                            </a>
                        </div>
                    )}

                    {!formatNotSupported && (
                        isYouTube && videoId ? (
                            <iframe
                                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`}
                                title={exerciseName}
                                className="w-full h-full"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                onLoad={handleIframeLoad}
                                onError={handleIframeError}
                            />
                        ) : (
                            <video
                                src={videoUrl}
                                controls
                                autoPlay
                                playsInline
                                className="w-full h-full"
                                onLoadedData={handleIframeLoad}
                                onError={handleIframeError}
                            >
                                <source src={videoUrl} type={videoType} />
                                Seu navegador não suporta vídeo.
                            </video>
                        )
                    )}
                </div>

                {/* Footer tip */}
                <div className="p-4 bg-slate-900/50 border-t border-white/5 flex justify-between items-center">
                    <p className="text-slate-500 text-xs">
                        Observe a postura e amplitude
                    </p>
                    <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1"
                    >
                        <span>{isYouTube ? 'Assistir no YouTube' : 'Abrir link original'}</span>
                        <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayerModal;
