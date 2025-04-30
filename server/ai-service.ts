import { Request, Response } from 'express';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

interface ChatMessage {
  role: string;
  content: string;
}

interface AIRequestBody {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  messages: ChatMessage[];
}

// OpenAI chat function
async function handleOpenAIChat(body: AIRequestBody): Promise<string> {
  const openai = new OpenAI({ 
    apiKey: body.apiKey,
    baseURL: body.baseUrl 
  });
  
  const response = await openai.chat.completions.create({
    model: body.model || 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: body.messages,
    temperature: body.temperature,
    max_tokens: body.maxTokens,
  });

  return response.choices[0].message.content || "No response generated.";
}

// Anthropic chat function
async function handleAnthropicChat(body: AIRequestBody): Promise<string> {
  const anthropic = new Anthropic({
    apiKey: body.apiKey,
    baseURL: body.baseUrl
  });
  
  const response = await anthropic.messages.create({
    model: body.model || 'claude-3-7-sonnet-20250219', // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    messages: body.messages.filter(msg => msg.role !== 'system'), // Anthropic doesn't use system messages in the same way
    system: body.messages.find(msg => msg.role === 'system')?.content,
    temperature: body.temperature,
    max_tokens: body.maxTokens,
  });

  return response.content[0].text;
}

// Custom API chat function
async function handleCustomAPIChat(body: AIRequestBody): Promise<string> {
  if (!body.baseUrl) {
    throw new Error('Base URL is required for custom API');
  }

  const response = await fetch(body.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${body.apiKey}`
    },
    body: JSON.stringify({
      model: body.model,
      messages: body.messages,
      temperature: body.temperature,
      max_tokens: body.maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`Custom API returned error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || data.content || "No response generated.";
}

export async function handleChatRequest(req: Request, res: Response) {
  try {
    const body = req.body as AIRequestBody;
    
    if (!body.apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required' });
    }
    
    let responseMessage: string;
    
    switch (body.provider) {
      case 'openai':
        responseMessage = await handleOpenAIChat(body);
        break;
      case 'anthropic':
        responseMessage = await handleAnthropicChat(body);
        break;
      case 'custom':
        responseMessage = await handleCustomAPIChat(body);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported provider' });
    }
    
    return res.json({ message: responseMessage });
  } catch (error) {
    console.error('AI Service Error:', error);
    return res.status(500).json({ 
      error: 'An error occurred processing your request',
      details: error.message 
    });
  }
}