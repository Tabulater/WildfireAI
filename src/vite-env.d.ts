/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_TOKEN: string;
  readonly VITE_FIRECRAWL_TOKEN: string;
  readonly VITE_OPENWEATHER_API_KEY: string;
  readonly VITE_NASA_API_KEY: string;
  readonly VITE_EPA_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}