/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Public-facing site URL used for canonical links, sitemap entries and OG tags.
   * Set this to your production origin (e.g. https://www.example.com) with no trailing slash.
   * Falls back to the reserved placeholder `https://focused-tube.example` when absent.
   */
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/* YouTube IFrame Player API global types */
interface YTPlayerOptions {
  videoId: string;
  host?: string;
  width?: number | string;
  height?: number | string;
  playerVars?: Record<string, unknown>;
  events?: {
    onReady?: (event: { target: YTPlayerInstance }) => void;
    onError?: (event: { data: number }) => void;
    onStateChange?: (event: { data: number }) => void;
  };
}

interface YTPlayerInstance {
  destroy: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
}

interface YTNamespace {
  Player: new (elementId: string, options: YTPlayerOptions) => YTPlayerInstance;
}

interface Window {
  YT?: YTNamespace;
  onYouTubeIframeAPIReady?: () => void;
}
