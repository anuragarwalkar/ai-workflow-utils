import axios from 'axios';
import logger from '../logger.js';

async function generateChatResponseWithOpenAI(message, conversationHistory = []) {
  // Prepare messages for OpenAI compatible API
  const messages = [
    {
      role: 'system',
      content: 'You are a helpful AI assistant integrated into a workflow utility application. You can help users with general questions, provide guidance on using the application features, and assist with various tasks. Be concise and helpful in your responses.'
    },
    ...conversationHistory,
    {
      role: 'user',
      content: message
    }
  ];

  logger.info(`Making OpenAI compatible API request to: ${process.env.OPENAI_COMPATIBLE_BASE_URL}/chat/completions`);
  logger.info(`Using model: ${process.env.OPENAI_COMPATIBLE_MODEL}`);

  const requestPayload = {
    model: process.env.OPENAI_COMPATIBLE_MODEL,
    messages,
    max_tokens: 500,
    temperature: 0.7
  };

  try {
    const response = await axios.post(`${process.env.OPENAI_COMPATIBLE_BASE_URL}/chat/completions`, requestPayload, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_COMPATIBLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 second timeout
    });

    logger.info(`OpenAI compatible API response status: ${response.status}`);
    return response.data.choices[0].message.content;
  } catch (error) {
    // Enhanced error logging
    if (error.response) {
      logger.error(`OpenAI compatible API error - Status: ${error.response.status}`);
      logger.error(`Error data: ${JSON.stringify(error.response.data, null, 2)}`);
      
      // Provide more specific error messages based on status code
      if (error.response.status === 400) {
        throw new Error(`Bad Request (400): ${error.response.data?.error?.message || 'Invalid request format or parameters'}`);
      } else if (error.response.status === 401) {
        throw new Error(`Unauthorized (401): Invalid API key or authentication failed`);
      } else if (error.response.status === 429) {
        throw new Error(`Rate Limited (429): Too many requests, please try again later`);
      } else {
        throw new Error(`API Error (${error.response.status}): ${error.response.data?.error?.message || error.message}`);
      }
    } else if (error.request) {
      logger.error(`Network error: ${error.message}`);
      throw new Error(`Network error: Unable to reach OpenAI compatible server`);
    } else {
      logger.error(`Request setup error: ${error.message}`);
      throw new Error(`Request error: ${error.message}`);
    }
  }
}

async function generateChatResponseWithOllama(message, conversationHistory = []) {
  const model = process.env.OLLAMA_MODEL || "llama2";
  
  // Convert conversation history to a single prompt for Ollama
  let fullPrompt = "You are a helpful AI assistant integrated into a workflow utility application. You can help users with general questions, provide guidance on using the application features, and assist with various tasks. Be concise and helpful in your responses.\n\n";
  
  // Add conversation history
  conversationHistory.forEach(msg => {
    if (msg.role === 'user') {
      fullPrompt += `User: ${msg.content}\n`;
    } else if (msg.role === 'assistant') {
      fullPrompt += `Assistant: ${msg.content}\n`;
    }
  });
  
  // Add current message
  fullPrompt += `User: ${message}\nAssistant: `;

  const response = await axios.post(`${process.env.OLLAMA_BASE_URL}/api/generate`, {
    model,
    prompt: fullPrompt,
    stream: false,
  });

  return response.data?.response;
}

async function generateChatResponseStreaming(message, conversationHistory, res) {
  let fullContent = "";
  let usedProvider = "unknown";

  // Send initial status
  res.write(`data: ${JSON.stringify({
    type: 'status',
    message: 'Starting chat response...',
    provider: 'Initializing'
  })}\n\n`);

  try {
    logger.info("Attempting to generate chat response using OpenAI compatible server");
    res.write(`data: ${JSON.stringify({
      type: 'status',
      message: 'Using OpenAI Compatible...',
      provider: 'OpenAI Compatible'
    })}\n\n`);
    
    // Prepare messages for OpenAI compatible API
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant integrated into a workflow utility application. You can help users with general questions, provide guidance on using the application features, and assist with various tasks. Be concise and helpful in your responses.'
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ];

    const requestPayload = {
      model: process.env.OPENAI_COMPATIBLE_MODEL,
      messages,
      max_tokens: 500,
      temperature: 0.7,
      stream: true
    };

    const response = await axios.post(`${process.env.OPENAI_COMPATIBLE_BASE_URL}/chat/completions`, requestPayload, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_COMPATIBLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: 'stream',
      timeout: 60000
    });

    await new Promise((resolve, reject) => {
      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              resolve(fullContent);
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullContent += content;
                res.write(`data: ${JSON.stringify({
                  type: 'chunk',
                  content: content
                })}\n\n`);
              }
            } catch (e) {
              // Ignore parsing errors for malformed chunks
            }
          }
        }
      });

      response.data.on('end', () => {
        resolve(fullContent);
      });

      response.data.on('error', (error) => {
        reject(error);
      });
    });

    usedProvider = "OpenAI Compatible";
    logger.info("Successfully generated chat response using OpenAI compatible server");
  } catch (error) {
    logger.warn(`OpenAI compatible server failed: ${error.message}. Falling back to Ollama.`);
    res.write(`data: ${JSON.stringify({
      type: 'status',
      message: 'OpenAI failed, trying Ollama...',
      provider: 'Ollama'
    })}\n\n`);

    // Fallback to Ollama
    try {
      const model = process.env.OLLAMA_MODEL || "llama2";
      
      // Convert conversation history to a single prompt for Ollama
      let fullPrompt = "You are a helpful AI assistant integrated into a workflow utility application. You can help users with general questions, provide guidance on using the application features, and assist with various tasks. Be concise and helpful in your responses.\n\n";
      
      // Add conversation history
      conversationHistory.forEach(msg => {
        if (msg.role === 'user') {
          fullPrompt += `User: ${msg.content}\n`;
        } else if (msg.role === 'assistant') {
          fullPrompt += `Assistant: ${msg.content}\n`;
        }
      });
      
      // Add current message
      fullPrompt += `User: ${message}\nAssistant: `;

      const response = await axios.post(`${process.env.OLLAMA_BASE_URL}/api/generate`, {
        model,
        prompt: fullPrompt,
        stream: true,
      }, {
        responseType: 'stream'
      });

      await new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              if (parsed.response) {
                fullContent += parsed.response;
                res.write(`data: ${JSON.stringify({
                  type: 'chunk',
                  content: parsed.response
                })}\n\n`);
              }
              if (parsed.done) {
                resolve(fullContent);
                return;
              }
            } catch (e) {
              // Ignore parsing errors for malformed chunks
            }
          }
        });

        response.data.on('end', () => {
          resolve(fullContent);
        });

        response.data.on('error', (error) => {
          reject(error);
        });
      });

      usedProvider = "Ollama";
    } catch (ollamaError) {
      logger.error(`All providers failed. Ollama: ${ollamaError.message}`);
      throw new Error(`Failed to generate chat response with all providers. Ollama: ${ollamaError.message}`);
    }
  }

  // Send final result
  res.write(`data: ${JSON.stringify({
    type: 'complete',
    response: fullContent,
    provider: usedProvider,
  })}\n\n`);
}

export const sendChatMessage = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let aiResponse;
    let usedProvider = "unknown";

    try {
      logger.info("Attempting to generate chat response using OpenAI compatible server");
      aiResponse = await generateChatResponseWithOpenAI(message, conversationHistory);
      usedProvider = "OpenAI Compatible";
      logger.info("Successfully generated chat response using OpenAI compatible server");
    } catch (error) {
      logger.warn(`OpenAI compatible server failed: ${error.message}. Falling back to Ollama.`);
      try {
        aiResponse = await generateChatResponseWithOllama(message, conversationHistory);
        usedProvider = "Ollama";
      } catch (ollamaError) {
        logger.error(`All providers failed. Ollama: ${ollamaError.message}`);
        throw new Error(`Failed to generate chat response with all providers. Ollama: ${ollamaError.message}`);
      }
    }

    res.json({
      success: true,
      response: aiResponse,
      provider: usedProvider
    });

  } catch (error) {
    logger.error('Error in chat controller:', error);
    
    if (error.message.includes('429')) {
      return res.status(429).json({ 
        error: 'API rate limit exceeded. Please try again later.' 
      });
    }
    
    if (error.message.includes('401')) {
      return res.status(401).json({ 
        error: 'Invalid API key configuration.' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to process chat message. Please try again.' 
    });
  }
};

export const sendChatMessageStreaming = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    await generateChatResponseStreaming(message, conversationHistory, res);

  } catch (error) {
    logger.error('Error in streaming chat controller:', error);
    
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      error: 'Failed to process chat message. Please try again.' 
    })}\n\n`);
  }
  
  res.end();
};
