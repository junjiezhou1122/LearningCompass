import { Request, Response } from 'express';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Define strict types that match OpenAI's and Anthropic's expected formats
interface ChatMessage {
  role: string;
  content: string;
}

// OpenAI specific message type
type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// Anthropic specific message type
type AnthropicMessage = {
  role: 'user' | 'assistant';
  content: string;
};

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
  
  // Convert to proper OpenAI message format
  const openaiMessages = body.messages.map(msg => {
    // Ensure roles are strictly typed for OpenAI
    const role = (msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant') 
      ? msg.role as 'system' | 'user' | 'assistant'
      : 'user'; // Default to user if invalid role
    
    return {
      role,
      content: msg.content
    };
  });
  
  const response = await openai.chat.completions.create({
    model: body.model || 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: openaiMessages,
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
  
  // Extract system message if it exists
  const systemMessage = body.messages.find(msg => msg.role === 'system')?.content;
  
  // Convert messages to Anthropic format (user and assistant only)
  const anthropicMessages = body.messages
    .filter(msg => msg.role !== 'system')
    .map(msg => {
      // Ensure role is either 'user' or 'assistant' for Anthropic
      const role = msg.role === 'assistant' ? 'assistant' : 'user';  
      return {
        role: role as 'user' | 'assistant',
        content: msg.content
      };
    });
  
  const response = await anthropic.messages.create({
    model: body.model || 'claude-3-7-sonnet-20250219', // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
    messages: anthropicMessages,
    system: systemMessage,
    temperature: body.temperature,
    max_tokens: body.maxTokens,
  });

  // Handle different content types in the response
  if (response.content.length > 0) {
    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }
  }
  
  return "No text response generated.";
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
    
    // Log the request body for debugging
    console.log('AI request body:', {
      provider: body.provider,
      model: body.model,
      hasApiKey: !!body.apiKey,
      messageCount: body.messages?.length
    });
    
    if (!body.apiKey) {
      console.log('API key missing');
      return res.status(400).json({ error: 'API key is required' });
    }
    
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      console.log('Messages missing or invalid');
      return res.status(400).json({ error: 'Messages are required' });
    }
    
    // Temporarily use mock response for testing instead of real API calls
    // This will help debug frontend issues without needing real API keys
    const lastUserMessage = body.messages.filter(msg => msg.role === 'user').pop()?.content || '';
    const mockResponse = `I received your message: "${lastUserMessage}". This is a mock response for testing purposes. Provider: ${body.provider}, Model: ${body.model}`;
    
    console.log('Sending mock response for testing');
    return res.json({ message: mockResponse });
    
    // Comment out real implementation for now to debug frontend issues
    /*
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
    */
  } catch (error: any) {
    console.error('AI Service Error:', error);
    return res.status(500).json({ 
      error: 'An error occurred processing your request',
      details: error?.message || String(error)
    });
  }
}