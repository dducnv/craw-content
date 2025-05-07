export class FetcherService {
  private static readonly PROXY_URL = 'https://cors-anywhere.herokuapp.com/';

  static async fetchContent(url: string): Promise<string> {
    try {
      // Thử fetch trực tiếp trước
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
      } catch (error) {
        console.log('Direct fetch failed:', error);
        console.log('Trying with proxy...');
        
        // Nếu fetch trực tiếp thất bại, thử dùng proxy
        const proxyResponse = await fetch(this.PROXY_URL + url, {
          headers: {
            'Origin': 'http://localhost:3000'
          }
        });

        if (proxyResponse.status === 403) {
          throw new Error('CORS Anywhere proxy requires activation. Please visit https://cors-anywhere.herokuapp.com/corsdemo and click "Request temporary access to the demo server" before trying again.');
        }

        if (!proxyResponse.ok) {
          throw new Error(`Proxy HTTP error! status: ${proxyResponse.status}`);
        }

        return await proxyResponse.text();
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch content from URL. Please try using the HTML input method instead.');
    }
  }
} 