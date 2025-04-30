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

// Custom API chat function (supports OpenRouter)
async function handleCustomAPIChat(body: AIRequestBody): Promise<string> {
  if (!body.baseUrl) {
    throw new Error('Base URL is required for custom API');
  }
  
  console.log('Custom API request to:', body.baseUrl);
  
  // Convert messages to the expected format for OpenAI-compatible APIs
  const formattedMessages = body.messages.map(msg => ({
    role: (msg.role === 'system' || msg.role === 'user' || msg.role === 'assistant') 
      ? msg.role as 'system' | 'user' | 'assistant'
      : 'user', // Default to user if invalid role
    content: msg.content
  }));
  
  // Check if this is OpenRouter (based on URL)
  const isOpenRouter = body.baseUrl.includes('openrouter.ai');
  
  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${body.apiKey}`
  };
  
  // Add OpenRouter specific headers
  if (isOpenRouter) {
    headers['HTTP-Referer'] = 'https://learninghowtolearn.app';
    headers['X-Title'] = 'Learning How To Learn';
  }
  
  // Construct endpoint URL - OpenRouter uses /api/v1/chat/completions
  let endpointUrl = body.baseUrl;
  if (isOpenRouter && !endpointUrl.endsWith('/chat/completions')) {
    // Make sure we're using the correct endpoint for OpenRouter
    endpointUrl = endpointUrl.endsWith('/') ? endpointUrl.slice(0, -1) : endpointUrl;
    if (!endpointUrl.endsWith('/api/v1')) {
      endpointUrl += '/api/v1';
    }
    endpointUrl += '/chat/completions';
  }
  
  console.log('Using endpoint URL:', endpointUrl);
  
  // Make the API request
  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: body.model,
      messages: formattedMessages,
      temperature: body.temperature,
      max_tokens: body.maxTokens
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Custom API error response:', errorText);
    throw new Error(`Custom API returned error ${response.status}: ${errorText}`);
  }
  
  const data = await response.json();
  console.log('Custom API response structure:', Object.keys(data));
  
  // Handle OpenAI/OpenRouter format response
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
      baseUrl: body.baseUrl,
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
    
    let responseMessage: string;
    
    switch (body.provider) {
      case 'openai':
        console.log('Using OpenAI provider');
        responseMessage = await handleOpenAIChat(body);
        break;
      case 'anthropic':
        console.log('Using Anthropic provider');
        responseMessage = await handleAnthropicChat(body);
        break;
      case 'openrouter':
        console.log('Using OpenRouter provider');
        // Set the baseUrl to ensure OpenRouter works properly
        if (!body.baseUrl || !body.baseUrl.includes('openrouter.ai')) {
          body.baseUrl = 'https://openrouter.ai/api/v1';
        }
        responseMessage = await handleCustomAPIChat(body);
        break;
      case 'custom':
        console.log('Using Custom API provider');
        responseMessage = await handleCustomAPIChat(body);
        break;
      default:
        console.log('Unsupported provider:', body.provider);
        return res.status(400).json({ error: 'Unsupported provider' });
    }
    
    console.log('Successfully got response from AI provider');
    return res.json({ message: responseMessage });
    
  } catch (error: any) {
    console.error('AI Service Error:', error);
    return res.status(500).json({ 
      error: 'An error occurred processing your request',
      details: error?.message || String(error)
    });
  }
}