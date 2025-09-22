// CORS Proxy Service for Wildfire Data APIs
// Handles cross-origin requests using multiple proxy services

export interface ProxyResponse {
  success: boolean;
  data?: any;
  error?: string;
  proxy?: string;
  cached?: boolean;
}

export class CORSProxyService {
  private static instance: CORSProxyService;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  private readonly proxyServices = [
    {
      name: 'allorigins',
      url: (targetUrl: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
      parseResponse: async (response: Response) => {
        const data = await response.json();
        return data.contents;
      }
    },
    {
      name: 'cors-anywhere',
      url: (targetUrl: string) => `https://cors-anywhere.herokuapp.com/${targetUrl}`,
      parseResponse: async (response: Response) => {
        return await response.text();
      },
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    },
    {
      name: 'thingproxy',
      url: (targetUrl: string) => `https://thingproxy.freeboard.io/fetch/${targetUrl}`,
      parseResponse: async (response: Response) => {
        return await response.text();
      }
    },
    {
      name: 'cors-proxy',
      url: (targetUrl: string) => `https://cors-proxy.org/?url=${encodeURIComponent(targetUrl)}`,
      parseResponse: async (response: Response) => {
        return await response.text();
      }
    },
    {
      name: 'cors-io',
      url: (targetUrl: string) => `https://cors.io/?${encodeURIComponent(targetUrl)}`,
      parseResponse: async (response: Response) => {
        return await response.text();
      }
    },
    {
      name: 'cors-anywhere-alt',
      url: (targetUrl: string) => `https://cors-anywhere.herokuapp.com/${targetUrl}`,
      parseResponse: async (response: Response) => {
        return await response.text();
      },
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://fireguard-ai.com'
      }
    },
    {
      name: 'proxy-cors',
      url: (targetUrl: string) => `https://proxy.cors.sh/${targetUrl}`,
      parseResponse: async (response: Response) => {
        return await response.text();
      },
      headers: {
        'x-requested-with': 'XMLHttpRequest'
      }
    }
  ];

  public static getInstance(): CORSProxyService {
    if (!CORSProxyService.instance) {
      CORSProxyService.instance = new CORSProxyService();
    }
    return CORSProxyService.instance;
  }

  private getCacheKey(url: string): string {
    return btoa(url).replace(/[^a-zA-Z0-9]/g, '');
  }

  private isValidCached(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < cached.ttl;
  }

  public async fetchWithProxy(
    targetUrl: string, 
    options: {
      timeout?: number;
      useCache?: boolean;
      cacheTTL?: number;
      retryAttempts?: number;
    } = {}
  ): Promise<ProxyResponse> {
    const {
      timeout = 10000,
      useCache = true,
      cacheTTL = 300000, // 5 minutes default
      retryAttempts = 3
    } = options;

    const cacheKey = this.getCacheKey(targetUrl);

    // Check cache first
    if (useCache && this.isValidCached(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      return {
        success: true,
        data: cached.data,
        cached: true
      };
    }

    // Try each proxy service
    for (const proxy of this.proxyServices) {
      for (let attempt = 1; attempt <= retryAttempts; attempt++) {
        try {
          const proxyUrl = proxy.url(targetUrl);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          const response = await fetch(proxyUrl, {
            signal: controller.signal,
            headers: proxy.headers || {},
            method: 'GET'
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await proxy.parseResponse(response);
            
            // Cache successful response
            if (useCache) {
              this.cache.set(cacheKey, {
                data,
                timestamp: Date.now(),
                ttl: cacheTTL
              });
            }

            return {
              success: true,
              data,
              proxy: proxy.name
            };
          } else {
            console.warn(`Proxy ${proxy.name} returned ${response.status} for ${targetUrl}`);
          }
        } catch (error: any) {
          const errorMsg = error.message || 'Unknown error';
          console.warn(`Proxy ${proxy.name} attempt ${attempt} failed for ${targetUrl}: ${errorMsg}`);
          
          if (attempt === retryAttempts) {
            console.error(`All retry attempts failed for proxy ${proxy.name}`);
          }
        }
      }
    }

    return {
      success: false,
      error: 'All proxy services failed'
    };
  }

  public async fetchJSON(targetUrl: string, options?: any): Promise<ProxyResponse> {
    const result = await this.fetchWithProxy(targetUrl, options);
    
    if (result.success && result.data) {
      try {
        const jsonData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
        return {
          ...result,
          data: jsonData
        };
      } catch (parseError) {
        return {
          success: false,
          error: 'Failed to parse JSON response'
        };
      }
    }
    
    return result;
  }

  public async fetchCSV(targetUrl: string, options?: any): Promise<ProxyResponse> {
    const result = await this.fetchWithProxy(targetUrl, options);
    
    if (result.success && result.data) {
      try {
        const csvData = typeof result.data === 'string' ? result.data : String(result.data);
        const lines = csvData.split('\n').filter(line => line.trim());
        
        return {
          ...result,
          data: {
            raw: csvData,
            lines,
            rowCount: lines.length - 1, // Subtract header row
            headers: lines[0]?.split(',') || []
          }
        };
      } catch (parseError) {
        return {
          success: false,
          error: 'Failed to parse CSV response'
        };
      }
    }
    
    return result;
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export default CORSProxyService;
