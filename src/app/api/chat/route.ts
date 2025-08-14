import { NextRequest, NextResponse } from 'next/server';

// Dynamic import and initialization to handle missing API key gracefully
let openai: any = null;

async function getOpenAIClient() {
  if (!openai && process.env.OPENAI_API_KEY) {
    const { default: OpenAI } = await import('openai');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, options } = await request.json();
    
    const client = await getOpenAIClient();
    
    if (!client) {
      // Fallback response when no API key is available
      return NextResponse.json({ 
        response: "This is a demo response. To enable real AI responses, configure your OPENAI_API_KEY environment variable."
      });
    }
    
    const completion = await client.chat.completions.create({
      model: options.model || 'gpt-4',
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1500,
    });

    return NextResponse.json({ 
      response: completion.choices[0]?.message?.content 
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json({ 
      response: "Sorry, there was an error processing your request. This could be due to API limits or configuration issues."
    }, { status: 200 }); // Return 200 to avoid breaking the UI
  }
} 