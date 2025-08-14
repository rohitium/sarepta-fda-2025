import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: NextRequest) {
  try {
    const { messages, options } = await request.json();
    
    const completion = await openai.chat.completions.create({
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
    return NextResponse.json({ error: 'API call failed' }, { status: 500 });
  }
} 