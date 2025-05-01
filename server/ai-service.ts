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
    'Content-Type': 'application/json'
  };
  
  // Handle API key for authorization
  let apiKey = body.apiKey;
  
  // For OpenRouter, use user's API key if provided, otherwise fallback to environment variable
  if (isOpenRouter) {
    if (apiKey) {
      console.log('Using user-provided OpenRouter API key');
    } else if (process.env.OPENROUTER_API_KEY) {
      console.log('Using OpenRouter API key from environment variable');
      apiKey = process.env.OPENROUTER_API_KEY;
    } else {
      throw new Error('API key is required for OpenRouter');
    }
  } else if (!apiKey) {
    throw new Error('API key is required');
  }
  
  // Set Authorization header with appropriate API key
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
    
    // Debug log for authorization header
    console.log('Authorization header set:', `Bearer ${apiKey.substring(0, 5)}...`);
  } else {
    console.error('No API key available for authorization header');
    throw new Error('API key is required for authorization');
  }
  console.log('Authorization header set with API key');
  
  // Add OpenRouter specific headers
  if (isOpenRouter) {
    // OpenRouter requires these headers
    headers['HTTP-Referer'] = 'https://learninghowtolearn.app';
    headers['X-Title'] = 'Learning How To Learn';
    
    // Debug OpenRouter API key
    console.log('OpenRouter API key available:', !!apiKey);
    console.log('OpenRouter API key length:', apiKey?.length);
    console.log('OpenRouter API key first 5 chars:', apiKey?.substring(0, 5));
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
  
  // Log full request details for debugging
  const requestPayload = {
    model: body.model,
    messages: formattedMessages,
    temperature: body.temperature || 0.7,
    max_tokens: body.maxTokens || 1000
  };
  
  console.log('API request headers:', JSON.stringify(headers, null, 2));
  console.log('API request payload:', JSON.stringify(requestPayload, null, 2));
  
  // Make the API request
  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestPayload)
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
    
    // Validate required fields
    if (!body.provider) {
      return res.status(400).json({ error: 'Provider is required' });
    }
    
    if (!body.model) {
      return res.status(400).json({ error: 'Model is required' });
    }
    
    // Skip API key check if provider is OpenRouter (we'll use env var if needed)
    if (body.provider !== 'openrouter' && !body.apiKey) {
      console.log('API key missing and provider is not OpenRouter');
      return res.status(400).json({ error: 'API key is required for ' + body.provider });
    }
    
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      console.log('Messages missing or invalid');
      return res.status(400).json({ error: 'Messages are required' });
    }
    
    // Validate API keys have correct format before using them
    if (body.apiKey) {
      const keyValidation = validateApiKey(body.provider, body.apiKey);
      if (!keyValidation.valid) {
        return res.status(400).json({ error: keyValidation.message });
      }
    }
    
    let responseMessage: string;
    
    try {
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
          
          // Use environment API key only if user didn't provide one
          if (!body.apiKey) {
            if (process.env.OPENROUTER_API_KEY) {
              console.log('Using OpenRouter API key from environment (user did not provide one)');
              body.apiKey = process.env.OPENROUTER_API_KEY;
            } else {
              console.log('No OpenRouter API key available (neither user-provided nor environment)');
              return res.status(401).json({ 
                error: 'Authentication failed. No API key available for OpenRouter.',
                details: 'Please provide your own OpenRouter API key in the settings.'
              });
            }
          } else {
            console.log('Using user-provided OpenRouter API key');
          }
          
          responseMessage = await handleCustomAPIChat(body);
          break;
        case 'custom':
          console.log('Using Custom API provider');
          if (!body.baseUrl) {
            return res.status(400).json({ error: 'Base URL is required for custom API provider' });
          }
          responseMessage = await handleCustomAPIChat(body);
          break;
        default:
          console.log('Unsupported provider:', body.provider);
          return res.status(400).json({ error: 'Unsupported provider' });
      }
    } catch (apiError: any) {
      console.error(`Error calling ${body.provider} API:`, apiError);
      
      // Handle different types of API errors with appropriate status codes
      if (apiError.message && apiError.message.includes('401')) {
        return res.status(401).json({ 
          error: 'Authentication failed',
          details: 'Your API key was rejected. Please check your API key and try again.'
        });
      } else if (apiError.message && apiError.message.includes('429')) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded',
          details: 'You have exceeded the rate limit for this API. Please try again later.'
        });
      } else {
        throw apiError; // Re-throw for the outer catch block
      }
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

// Helper function to validate API keys have correct format
function validateApiKey(provider: string, apiKey: string): { valid: boolean, message: string } {
  if (!apiKey) {
    return { valid: false, message: 'API key is required' };
  }
  
  switch (provider) {
    case 'openai':
      if (!apiKey.startsWith('sk-')) {
        return { 
          valid: false, 
          message: 'Invalid OpenAI API key format. Keys should start with "sk-"' 
        };
      }
      break;
    case 'anthropic':
      if (!apiKey.startsWith('sk-ant-')) {
        return { 
          valid: false, 
          message: 'Invalid Anthropic API key format. Keys should start with "sk-ant-"'
        };
      }
      break;
    case 'openrouter':
      if (!apiKey.startsWith('sk-or-')) {
        return { 
          valid: false, 
          message: 'Invalid OpenRouter API key format. Keys should start with "sk-or-"' 
        };
      }
      break;
  }
  
  return { valid: true, message: '' };
}