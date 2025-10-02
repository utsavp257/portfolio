declare module 'animejs' {
  import type { AnimeInstance, AnimeParams, AnimeTimelineInstance } from 'animejs/types';
  const anime: ((params: AnimeParams) => AnimeInstance) & {
    timeline(params?: AnimeParams): AnimeTimelineInstance;
    running: AnimeInstance[];
    version: string;
    easings: Record<string, (t: number) => number>;
  };
  export default anime;
}


