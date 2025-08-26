// MusicKit JS types for Apple Music integration

declare global {
  interface Window {
    MusicKit: typeof MusicKit;
  }
}

declare namespace MusicKit {
  interface MusicKitInstance {
    isAuthorized: boolean;
    authorize(): Promise<string>;
    api: {
      music(url: string, options?: {
        method?: string;
        body?: any;
        term?: string;
        types?: string;
        limit?: number;
      }): Promise<any>;
    };
  }

  function getInstance(): MusicKitInstance;
  function configure(options: {
    developerToken: string;
    app: {
      name: string;
      build: string;
    };
  }): Promise<MusicKitInstance>;
}

export {};