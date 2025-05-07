export class FetcherService {
  private static readonly PROXY_URL = 'https://cors-anywhere.herokuapp.com/';

  public static async fetchContent(url: string): Promise<string> {
    try {
      // Sử dụng CORS Anywhere với headers đúng
      const proxyUrl = this.PROXY_URL + url;
      const response = await fetch(proxyUrl, {
        headers: {
          'Origin': 'http://localhost:3000',
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error(
            'CORS proxy access denied. Please visit https://cors-anywhere.herokuapp.com/corsdemo ' +
            'and click the button to temporarily unlock access to the demo server.'
          );
        }
        throw new Error(`Failed to fetch content: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.error('Error fetching content:', error);
      if (error instanceof Error) {
        throw new Error(
          `Failed to fetch content: ${error.message}. ` +
          'Try using the HTML input method instead, or visit https://cors-anywhere.herokuapp.com/corsdemo ' +
          'to enable the proxy.'
        );
      }
      throw error;
    }
  }
} 