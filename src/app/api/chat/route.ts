import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Server-side OpenAI client - API key stays secure
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(request: NextRequest) {
  try {
    const { messages, query } = await request.json();
    
    // If no API key, return error to trigger fallback
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured', fallback: true },
        { status: 200 }
      );
    }

    // Real OpenAI API call
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      temperature: 0.1,
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    return NextResponse.json({ 
      response,
      success: true,
      source: 'openai-api'
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Return error to trigger intelligent fallback
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback: true 
      },
      { status: 200 }
    );
  }
} 