// Global TypeScript declarations for third-party libraries and window objects

declare global {
  interface Window {
    // FullStory
    _fs_namespace?: string;
    FS?: any;

    // Amplitude
    amplitude?: any;

    // HubSpot
    _hsq?: any;
    hstc?: any;

    // Google Analytics
    gtag?: any;
    ga?: any;

    // Facebook Pixel
    fbq?: any;

    // Performance
    gc?: () => void;

    // MobX
    __mobxDidRunLazyInitializers?: boolean;
  }

  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }

  // Extend Array prototype for MobX observable arrays
  interface Array<T> {
    get?: (index: number) => T | undefined;
  }
}

export {};
