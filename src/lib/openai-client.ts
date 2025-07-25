// OpenAI import removed - using secure server-side API route instead

class OpenAIClient {
  private static instance: OpenAIClient;

  private constructor() {
    console.info('🔑 OpenAI Client: Using secure server-side API');
  }

  public static getInstance(): OpenAIClient {
    if (!OpenAIClient.instance) {
      OpenAIClient.instance = new OpenAIClient();
    }
    return OpenAIClient.instance;
  }

  async generateEmbedding(_text: string): Promise<number[]> {
    // Return mock embedding vector (1536 dimensions for text-embedding-3-large)
    // Embeddings aren't critical for the demo - search works with concept mapping
    return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Return mock embedding vectors for each text
    return texts.map(() => Array.from({ length: 1536 }, () => Math.random() * 2 - 1));
  }

  async generateChatCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    } = {}
  ): Promise<string> {
    try {
      // Call our secure server-side API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          options
        })
      });

      const data = await response.json();
      
      if (data.success && data.response) {
        console.info('✅ Real OpenAI API response received');
        return data.response;
      } else if (data.fallback) {
        console.info('⚡ Using intelligent fallback response');
        throw new Error('API fallback triggered');
      } else {
        throw new Error(data.error || 'Unknown API error');
      }
    } catch (error) {
      console.error('OpenAI Client Error:', error);
      throw new Error(`Failed to generate response: ${error}`);
    }
  }

  async generateStreamedCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    _options: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<ReadableStream<string>> {
    // For now, use non-streaming and convert to stream
    throw new Error('Streaming not implemented - use generateChatCompletion');
  }

  // Utility method to count tokens (approximation)
  countTokens(text: string): number {
    // Simple approximation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  // Method to chunk text based on token limits
  chunkText(text: string, maxTokens: number = 1000, overlap: number = 200): string[] {
    const maxChars = maxTokens * 4; // Approximate character count
    const overlapChars = overlap * 4;
    
    if (text.length <= maxChars) {
      return [text];
    }

    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + maxChars;
      
      // Try to break at sentence boundaries
      if (end < text.length) {
        const sentenceEnd = text.lastIndexOf('.', end);
        const paragraphEnd = text.lastIndexOf('\n\n', end);
        
        const breakPoint = Math.max(sentenceEnd, paragraphEnd);
        if (breakPoint > start + maxChars * 0.5) {
          end = breakPoint + 1;
        }
      }

      chunks.push(text.substring(start, end));
      start = Math.max(start + maxChars - overlapChars, end);
    }

    return chunks;
  }
}

// Export singleton instance
export const openaiClient = OpenAIClient.getInstance();
export default openaiClient; 