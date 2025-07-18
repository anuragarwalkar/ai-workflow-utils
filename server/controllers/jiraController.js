import axios from "axios";
import fs from "fs";
import logger from "../logger.js";
import FormData from "form-data";
import multer from "multer";
import { convertMovToMp4 } from "../utils/fileUtils.js";

multer({ dest: "uploads/" }); 

async function generateJiraContentWithOpenAI(prompt, images, issueType = "Bug") {
  const hasImages = images && images.length > 0;
  const imageReference = hasImages ? "& image" : "";
  const imageContext = hasImages ? "visible in the image" : "described in the prompt";
  
  let constructedPrompt;
  
  switch (issueType) {
    case "Bug":
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed bug report for mobile app dont include react native or mobile app in title. Format your output like this, and include a blank line between each list item: Issue Summary: Short, concise bug title - max 8 words Steps to Reproduce: # Step 1  # Step 2  # Step 3  Expected Behavior: * What should happen.  Actual Behavior: * What is happening instead — ${imageContext}.  Possible Causes: * List possible reasons — e.g., font rendering, input field style, etc.`;
      break;
    
    case "Task":
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed task description for mobile app development. Format your output like this, and include a blank line between each list item: Task Summary: Short, concise task title - max 8 words Description: * Detailed description of what needs to be done based on the ${hasImages ? "image and " : ""}prompt.  Acceptance Criteria: # Criteria 1  # Criteria 2  # Criteria 3  Implementation Notes: * Technical notes or considerations for implementation.  Dependencies: * Any dependencies or prerequisites needed.`;
      break;
    
    case "Story":
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed user story for mobile app. Format your output like this, and include a blank line between each list item: Story Summary: Short, concise story title - max 8 words User Story: * As a user type, I want functionality so that benefit/value.  Description: * Detailed description based on the ${hasImages ? "image and " : ""}prompt.  Acceptance Criteria: # Criteria 1  # Criteria 2  # Criteria 3  Definition of Done: * What constitutes completion of this story.`;
      break;
    
    default:
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed description. Format your output like this: Summary: Short, concise title - max 8 words Description: * Detailed description based on the ${hasImages ? "image and " : ""}prompt.`;
  }

  // Prepare messages for OpenAI compatible API
  let messages;
  
  if (hasImages) {
    // Detect image format and prepare accordingly
    const imageContent = images.map(image => {
      // Remove data URL prefix if present to get pure base64
      let base64Data = image;
      let mediaType = "image/jpeg";
      
      if (image.startsWith('data:')) {
        const [header, data] = image.split(',');
        base64Data = data;
        // Extract media type from data URL
        const mediaTypeMatch = header.match(/data:([^;]+)/);
        if (mediaTypeMatch) {
          mediaType = mediaTypeMatch[1];
        }
      } else {
        // Try to detect image type from base64 header
        if (image.startsWith('/9j/') || image.startsWith('iVBORw0KGgo')) {
          mediaType = image.startsWith('/9j/') ? "image/jpeg" : "image/png";
        }
      }
      
      // Try Claude/Anthropic format first (since the error suggests this)
      return {
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data: base64Data
        }
      };
    });

    messages = [
      {
        role: "user",
        content: [
          { type: "text", text: constructedPrompt },
          ...imageContent
        ]
      }
    ];
  } else {
    messages = [
      {
        role: "user",
        content: constructedPrompt
      }
    ];
  }

  // Add error handling and logging for debugging
  logger.info(`Making OpenAI compatible API request to: ${process.env.OPENAI_COMPATIBLE_BASE_URL}/chat/completions`);
  logger.info(`Using model: ${process.env.OPENAI_COMPATIBLE_MODEL}`);
  logger.info(`Has images: ${hasImages}, Image count: ${images ? images.length : 0}`);

  const requestPayload = {
    model: process.env.OPENAI_COMPATIBLE_MODEL,
    messages,
    max_tokens: 2000,
    temperature: 0.7
  };

  // Log the request payload (without image data for brevity)
  const logPayload = { ...requestPayload };
  if (hasImages) {
    logPayload.messages = logPayload.messages.map(msg => ({
      ...msg,
      content: Array.isArray(msg.content) 
        ? msg.content.map(item => {
            if (item.type === 'image_url') {
              return { type: 'image_url', image_url: '[IMAGE_DATA]' };
            } else if (item.type === 'image') {
              return { type: 'image', source: { type: 'base64', media_type: item.source.media_type, data: '[IMAGE_DATA]' } };
            }
            return item;
          })
        : msg.content
    }));
  }
  logger.info(`Request payload: ${JSON.stringify(logPayload, null, 2)}`);

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
      logger.error(`Error headers: ${JSON.stringify(error.response.headers, null, 2)}`);
      
      // Provide more specific error messages based on status code
      if (error.response.status === 400) {
        throw new Error(`Bad Request (400): ${error.response.data?.error?.message || 'Invalid request format or parameters'}`);
      } else if (error.response.status === 401) {
        throw new Error(`Unauthorized (401): Invalid API key or authentication failed`);
      } else if (error.response.status === 413) {
        throw new Error(`Payload Too Large (413): Image or request size exceeds server limits`);
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

async function generateJiraContentWithOllama(prompt, images, issueType = "Bug") {
  const model = process.env.OLLAMA_MODEL || "llava";
  const hasImages = images && images.length > 0;
  const imageReference = hasImages ? "& image" : "";
  const imageContext = hasImages ? "visible in the image" : "described in the prompt";
  
  let constructedPrompt;
  
  switch (issueType) {
    case "Bug":
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed bug report for mobile app dont include react native or mobile app in title. Format your output like this, and include a blank line between each list item: Issue Summary: Short, concise bug title - max 8 words Steps to Reproduce: # Step 1  # Step 2  # Step 3  Expected Behavior: * What should happen.  Actual Behavior: * What is happening instead — ${imageContext}.  Possible Causes: * List possible reasons — e.g., font rendering, input field style, etc.`;
      break;
    
    case "Task":
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed task description for mobile app development. Format your output like this, and include a blank line between each list item: Task Summary: Short, concise task title - max 8 words Description: * Detailed description of what needs to be done based on the ${hasImages ? "image and " : ""}prompt.  Acceptance Criteria: # Criteria 1  # Criteria 2  # Criteria 3  Implementation Notes: * Technical notes or considerations for implementation.  Dependencies: * Any dependencies or prerequisites needed.`;
      break;
    
    case "Story":
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed user story for mobile app. Format your output like this, and include a blank line between each list item: Story Summary: Short, concise story title - max 8 words User Story: * As a user type, I want functionality so that benefit/value.  Description: * Detailed description based on the ${hasImages ? "image and " : ""}prompt.  Acceptance Criteria: # Criteria 1  # Criteria 2  # Criteria 3  Definition of Done: * What constitutes completion of this story.`;
      break;
    
    default:
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed description. Format your output like this: Summary: Short, concise title - max 8 words Description: * Detailed description based on the ${hasImages ? "image and " : ""}prompt.`;
  }

  const response = await axios.post(`${process.env.OLLAMA_BASE_URL}/api/generate`, {
    model,
    prompt: constructedPrompt,
    images,
    stream: false,
  });

  return response.data?.response;
}

async function generateJiraContentWithOpenAITextOnly(prompt, images, issueType = "Bug") {
  const hasImages = images && images.length > 0;
  const imageReference = hasImages ? "& image" : "";
  const imageContext = hasImages ? "described in the prompt (note: images were provided but this model doesn't support vision)" : "described in the prompt";
  
  let constructedPrompt;
  
  switch (issueType) {
    case "Bug":
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed bug report for mobile app dont include react native or mobile app in title. Format your output like this, and include a blank line between each list item: Issue Summary: Short, concise bug title - max 8 words Steps to Reproduce: # Step 1  # Step 2  # Step 3  Expected Behavior: * What should happen.  Actual Behavior: * What is happening instead — ${imageContext}.  Possible Causes: * List possible reasons — e.g., font rendering, input field style, etc.`;
      break;
    
    case "Task":
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed task description for mobile app development. Format your output like this, and include a blank line between each list item: Task Summary: Short, concise task title - max 8 words Description: * Detailed description of what needs to be done based on the ${hasImages ? "image and " : ""}prompt.  Acceptance Criteria: # Criteria 1  # Criteria 2  # Criteria 3  Implementation Notes: * Technical notes or considerations for implementation.  Dependencies: * Any dependencies or prerequisites needed.`;
      break;
    
    case "Story":
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed user story for mobile app. Format your output like this, and include a blank line between each list item: Story Summary: Short, concise story title - max 8 words User Story: * As a user type, I want functionality so that benefit/value.  Description: * Detailed description based on the ${hasImages ? "image and " : ""}prompt.  Acceptance Criteria: # Criteria 1  # Criteria 2  # Criteria 3  Definition of Done: * What constitutes completion of this story.`;
      break;
    
    default:
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed description. Format your output like this: Summary: Short, concise title - max 8 words Description: * Detailed description based on the ${hasImages ? "image and " : ""}prompt.`;
  }

  const messages = [
    {
      role: "user",
      content: constructedPrompt
    }
  ];

  logger.info(`Making OpenAI compatible API request (text-only) to: ${process.env.OPENAI_COMPATIBLE_BASE_URL}/chat/completions`);

  const response = await axios.post(`${process.env.OPENAI_COMPATIBLE_BASE_URL}/chat/completions`, {
    model: process.env.OPENAI_COMPATIBLE_MODEL,
    messages,
    max_tokens: 2000,
    temperature: 0.7
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_COMPATIBLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: 60000
  });

  return response.data.choices[0].message.content;
}

async function generateJiraContentWithOpenAIStreaming(prompt, images, issueType, res) {
  const hasImages = images && images.length > 0;
  const imageReference = hasImages ? "& image" : "";
  const imageContext = hasImages ? "visible in the image" : "described in the prompt";
  
  let constructedPrompt;
  
  switch (issueType) {
    case "Bug":
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed bug report for mobile app dont include react native or mobile app in title. Format your output like this, and include a blank line between each list item: Issue Summary: Short, concise bug title - max 8 words Steps to Reproduce: # Step 1  # Step 2  # Step 3  Expected Behavior: * What should happen.  Actual Behavior: * What is happening instead — ${imageContext}.  Possible Causes: * List possible reasons — e.g., font rendering, input field style, etc.`;
      break;
    
    case "Task":
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed task description for mobile app development. Format your output like this, and include a blank line between each list item: Task Summary: Short, concise task title - max 8 words Description: * Detailed description of what needs to be done based on the ${hasImages ? "image and " : ""}prompt.  Acceptance Criteria: # Criteria 1  # Criteria 2  # Criteria 3  Implementation Notes: * Technical notes or considerations for implementation.  Dependencies: * Any dependencies or prerequisites needed.`;
      break;
    
    case "Story":
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed user story for mobile app. Format your output like this, and include a blank line between each list item: Story Summary: Short, concise story title - max 8 words User Story: * As a user type, I want functionality so that benefit/value.  Description: * Detailed description based on the ${hasImages ? "image and " : ""}prompt.  Acceptance Criteria: # Criteria 1  # Criteria 2  # Criteria 3  Definition of Done: * What constitutes completion of this story.`;
      break;
    
    default:
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed description. Format your output like this: Summary: Short, concise title - max 8 words Description: * Detailed description based on the ${hasImages ? "image and " : ""}prompt.`;
  }

  // Prepare messages for OpenAI compatible API
  let messages;
  
  if (hasImages) {
    const imageContent = images.map(image => {
      let base64Data = image;
      let mediaType = "image/jpeg";
      
      if (image.startsWith('data:')) {
        const [header, data] = image.split(',');
        base64Data = data;
        const mediaTypeMatch = header.match(/data:([^;]+)/);
        if (mediaTypeMatch) {
          mediaType = mediaTypeMatch[1];
        }
      } else {
        if (image.startsWith('/9j/') || image.startsWith('iVBORw0KGgo')) {
          mediaType = image.startsWith('/9j/') ? "image/jpeg" : "image/png";
        }
      }
      
      return {
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data: base64Data
        }
      };
    });

    messages = [
      {
        role: "user",
        content: [
          { type: "text", text: constructedPrompt },
          ...imageContent
        ]
      }
    ];
  } else {
    messages = [
      {
        role: "user",
        content: constructedPrompt
      }
    ];
  }

  const requestPayload = {
    model: process.env.OPENAI_COMPATIBLE_MODEL,
    messages,
    max_tokens: 2000,
    temperature: 0.7,
    stream: true
  };

  let fullContent = "";

  try {
    const response = await axios.post(`${process.env.OPENAI_COMPATIBLE_BASE_URL}/chat/completions`, requestPayload, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_COMPATIBLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: 'stream',
      timeout: 60000
    });

    return new Promise((resolve, reject) => {
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
  } catch (error) {
    logger.error(`OpenAI streaming error: ${error.message}`);
    throw error;
  }
}

async function generateJiraContentWithOpenAIStreamingTextOnly(prompt, images, issueType, res) {
  const hasImages = images && images.length > 0;
  const imageReference = hasImages ? "& image" : "";
  const imageContext = hasImages ? "described in the prompt (note: images were provided but this model doesn't support vision)" : "described in the prompt";
  
  let constructedPrompt;
  
  switch (issueType) {
    case "Bug":
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed bug report for mobile app dont include react native or mobile app in title. Format your output like this, and include a blank line between each list item: Issue Summary: Short, concise bug title - max 8 words Steps to Reproduce: # Step 1  # Step 2  # Step 3  Expected Behavior: * What should happen.  Actual Behavior: * What is happening instead — ${imageContext}.  Possible Causes: * List possible reasons — e.g., font rendering, input field style, etc.`;
      break;
    
    case "Task":
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed task description for mobile app development. Format your output like this, and include a blank line between each list item: Task Summary: Short, concise task title - max 8 words Description: * Detailed description of what needs to be done based on the ${hasImages ? "image and " : ""}prompt.  Acceptance Criteria: # Criteria 1  # Criteria 2  # Criteria 3  Implementation Notes: * Technical notes or considerations for implementation.  Dependencies: * Any dependencies or prerequisites needed.`;
      break;
    
    case "Story":
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed user story for mobile app. Format your output like this, and include a blank line between each list item: Story Summary: Short, concise story title - max 8 words User Story: * As a user type, I want functionality so that benefit/value.  Description: * Detailed description based on the ${hasImages ? "image and " : ""}prompt.  Acceptance Criteria: # Criteria 1  # Criteria 2  # Criteria 3  Definition of Done: * What constitutes completion of this story.`;
      break;
    
    default:
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed description. Format your output like this: Summary: Short, concise title - max 8 words Description: * Detailed description based on the ${hasImages ? "image and " : ""}prompt.`;
  }

  const messages = [
    {
      role: "user",
      content: constructedPrompt
    }
  ];

  const requestPayload = {
    model: process.env.OPENAI_COMPATIBLE_MODEL,
    messages,
    max_tokens: 2000,
    temperature: 0.7,
    stream: true
  };

  let fullContent = "";

  try {
    const response = await axios.post(`${process.env.OPENAI_COMPATIBLE_BASE_URL}/chat/completions`, requestPayload, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_COMPATIBLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      responseType: 'stream',
      timeout: 60000
    });

    return new Promise((resolve, reject) => {
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
  } catch (error) {
    logger.error(`OpenAI text-only streaming error: ${error.message}`);
    throw error;
  }
}

async function generateJiraContentWithOllamaStreaming(prompt, images, issueType, res) {
  const model = process.env.OLLAMA_MODEL || "llava";
  const hasImages = images && images.length > 0;
  const imageReference = hasImages ? "& image" : "";
  const imageContext = hasImages ? "visible in the image" : "described in the prompt";
  
  let constructedPrompt;
  
  switch (issueType) {
    case "Bug":
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed bug report for mobile app dont include react native or mobile app in title. Format your output like this, and include a blank line between each list item: Issue Summary: Short, concise bug title - max 8 words Steps to Reproduce: # Step 1  # Step 2  # Step 3  Expected Behavior: * What should happen.  Actual Behavior: * What is happening instead — ${imageContext}.  Possible Causes: * List possible reasons — e.g., font rendering, input field style, etc.`;
      break;
    
    case "Task":
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed task description for mobile app development. Format your output like this, and include a blank line between each list item: Task Summary: Short, concise task title - max 8 words Description: * Detailed description of what needs to be done based on the ${hasImages ? "image and " : ""}prompt.  Acceptance Criteria: # Criteria 1  # Criteria 2  # Criteria 3  Implementation Notes: * Technical notes or considerations for implementation.  Dependencies: * Any dependencies or prerequisites needed.`;
      break;
    
    case "Story":
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed user story for mobile app. Format your output like this, and include a blank line between each list item: Story Summary: Short, concise story title - max 8 words User Story: * As a user type, I want functionality so that benefit/value.  Description: * Detailed description based on the ${hasImages ? "image and " : ""}prompt.  Acceptance Criteria: # Criteria 1  # Criteria 2  # Criteria 3  Definition of Done: * What constitutes completion of this story.`;
      break;
    
    default:
      constructedPrompt = `${prompt} - Based on the prompt ${imageReference}, generate a detailed description. Format your output like this: Summary: Short, concise title - max 8 words Description: * Detailed description based on the ${hasImages ? "image and " : ""}prompt.`;
  }

  let fullContent = "";

  try {
    const response = await axios.post(`${process.env.OLLAMA_BASE_URL}/api/generate`, {
      model,
      prompt: constructedPrompt,
      images,
      stream: true,
    }, {
      responseType: 'stream'
    });

    return new Promise((resolve, reject) => {
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
  } catch (error) {
    logger.error(`Ollama streaming error: ${error.message}`);
    throw error;
  }
}

async function generateJiraContentStreaming(prompt, images, issueType, res) {
  const hasImages = images && images.length > 0;
  let usedProvider = "unknown";
  let fullContent = "";

  // Check if the model likely supports vision based on model name
  const modelSupportsVision = process.env.OPENAI_COMPATIBLE_MODEL && (
    process.env.OPENAI_COMPATIBLE_MODEL.includes('vision') ||
    process.env.OPENAI_COMPATIBLE_MODEL.includes('gpt-4') ||
    process.env.OPENAI_COMPATIBLE_MODEL.includes('claude-3') ||
    process.env.OPENAI_COMPATIBLE_MODEL.includes('llava')
  );

  // Send initial status
  res.write(`data: ${JSON.stringify({
    type: 'status',
    message: 'Starting content generation...',
    provider: 'Initializing'
  })}\n\n`);

  // If we have images but the model likely doesn't support vision, start with text-only
  if (hasImages && !modelSupportsVision) {
    logger.info("Model likely doesn't support vision, starting with text-only mode");
    try {
      logger.info("Attempting to generate content using OpenAI compatible server (text-only mode)");
      res.write(`data: ${JSON.stringify({
        type: 'status',
        message: 'Using OpenAI Compatible (Text-Only)...',
        provider: 'OpenAI Compatible (Text-Only)'
      })}\n\n`);
      
      fullContent = await generateJiraContentWithOpenAIStreamingTextOnly(prompt, images, issueType, res);
      usedProvider = "OpenAI Compatible (Text-Only)";
      logger.info("Successfully generated content using OpenAI compatible server (text-only mode)");
    } catch (textOnlyError) {
      logger.warn(`OpenAI compatible server (text-only) failed: ${textOnlyError.message}. Falling back to Ollama.`);
      res.write(`data: ${JSON.stringify({
        type: 'status',
        message: 'OpenAI failed, trying Ollama...',
        provider: 'Ollama'
      })}\n\n`);
      fullContent = await generateJiraContentWithOllamaStreaming(prompt, images, issueType, res);
      usedProvider = "Ollama";
    }
  } else {
    // Try vision mode first if model might support it
    try {
      logger.info("Attempting to generate content using OpenAI compatible server");
      res.write(`data: ${JSON.stringify({
        type: 'status',
        message: 'Using OpenAI Compatible...',
        provider: 'OpenAI Compatible'
      })}\n\n`);
      
      fullContent = await generateJiraContentWithOpenAIStreaming(prompt, images, issueType, res);
      usedProvider = "OpenAI Compatible";
      logger.info("Successfully generated content using OpenAI compatible server");
    } catch (error) {
      logger.warn(`OpenAI compatible server failed: ${error.message}`);
      
      // If the error suggests vision model issues and we have images, try text-only mode
      if (hasImages && (
        error.message.includes('400') || 
        error.message.includes('image') || 
        error.message.includes('vision') ||
        error.message.includes('multimodal') ||
        error.message.includes('user messages are valid')
      )) {
        try {
          logger.info("Attempting to generate content using OpenAI compatible server (text-only mode)");
          res.write(`data: ${JSON.stringify({
            type: 'status',
            message: 'Switching to text-only mode...',
            provider: 'OpenAI Compatible (Text-Only)'
          })}\n\n`);
          
          fullContent = await generateJiraContentWithOpenAIStreamingTextOnly(prompt, images, issueType, res);
          usedProvider = "OpenAI Compatible (Text-Only)";
          logger.info("Successfully generated content using OpenAI compatible server (text-only mode)");
        } catch (textOnlyError) {
          logger.warn(`OpenAI compatible server (text-only) also failed: ${textOnlyError.message}. Falling back to Ollama.`);
          res.write(`data: ${JSON.stringify({
            type: 'status',
            message: 'OpenAI failed, trying Ollama...',
            provider: 'Ollama'
          })}\n\n`);
          fullContent = await generateJiraContentWithOllamaStreaming(prompt, images, issueType, res);
          usedProvider = "Ollama";
        }
      } else {
        res.write(`data: ${JSON.stringify({
          type: 'status',
          message: 'OpenAI failed, trying Ollama...',
          provider: 'Ollama'
        })}\n\n`);
        fullContent = await generateJiraContentWithOllamaStreaming(prompt, images, issueType, res);
        usedProvider = "Ollama";
      }
    }
  }

  if (!fullContent) {
    throw new Error("Invalid response structure from AI provider");
  }

  // Parse the final content
  const summaryMatch = fullContent.match(
    /(?:h3\. (?:Issue Summary|Task Summary|Story Summary|Summary):|(?:Issue Summary|Task Summary|Story Summary|Summary):)\s*(.+)/
  );
  let summary = summaryMatch?.[1]?.trim();
  
  // Clean up any remaining brackets from the summary
  if (summary) {
    summary = summary.replace(/^\[|\]$/g, '').trim();
  }
  
  let description = fullContent
    .replace(/(?:h3\. (?:Issue Summary|Task Summary|Story Summary|Summary):|(?:Issue Summary|Task Summary|Story Summary|Summary):)\s*.+/, "")
    .trim();
  
  // Clean up any remaining h3. formatting from the description
  if (description) {
    description = description.replace(/h3\.\s*/g, '').trim();
  }

  // Send final result
  res.write(`data: ${JSON.stringify({
    type: 'complete',
    message: `${issueType} preview generated successfully`,
    bugReport: fullContent,
    summary: summary || `${issueType}: Summary not available`,
    description: description || "Description not available",
    provider: usedProvider,
  })}\n\n`);
}

async function generateJiraContent(prompt, images, issueType = "Bug") {
  let generatedContent;
  let usedProvider = "unknown";
  const hasImages = images && images.length > 0;

  // Check if the model likely supports vision based on model name
  const modelSupportsVision = process.env.OPENAI_COMPATIBLE_MODEL && (
    process.env.OPENAI_COMPATIBLE_MODEL.includes('vision') ||
    process.env.OPENAI_COMPATIBLE_MODEL.includes('gpt-4') ||
    process.env.OPENAI_COMPATIBLE_MODEL.includes('claude-3') ||
    process.env.OPENAI_COMPATIBLE_MODEL.includes('llava')
  );

  // If we have images but the model likely doesn't support vision, start with text-only
  if (hasImages && !modelSupportsVision) {
    logger.info("Model likely doesn't support vision, starting with text-only mode");
    try {
      logger.info("Attempting to generate content using OpenAI compatible server (text-only mode)");
      generatedContent = await generateJiraContentWithOpenAITextOnly(prompt, images, issueType);
      usedProvider = "OpenAI Compatible (Text-Only)";
      logger.info("Successfully generated content using OpenAI compatible server (text-only mode)");
    } catch (textOnlyError) {
      logger.warn(`OpenAI compatible server (text-only) failed: ${textOnlyError.message}. Falling back to Ollama.`);
    }
  } else {
    // Try vision mode first if model might support it
    try {
      logger.info("Attempting to generate content using OpenAI compatible server");
      generatedContent = await generateJiraContentWithOpenAI(prompt, images, issueType);
      usedProvider = "OpenAI Compatible";
      logger.info("Successfully generated content using OpenAI compatible server");
    } catch (error) {
      logger.warn(`OpenAI compatible server failed: ${error.message}`);
      
      // If the error suggests vision model issues and we have images, try text-only mode
      if (hasImages && (
        error.message.includes('400') || 
        error.message.includes('image') || 
        error.message.includes('vision') ||
        error.message.includes('multimodal') ||
        error.message.includes('user messages are valid')
      )) {
        try {
          logger.info("Attempting to generate content using OpenAI compatible server (text-only mode)");
          generatedContent = await generateJiraContentWithOpenAITextOnly(prompt, images, issueType);
          usedProvider = "OpenAI Compatible (Text-Only)";
          logger.info("Successfully generated content using OpenAI compatible server (text-only mode)");
        } catch (textOnlyError) {
          logger.warn(`OpenAI compatible server (text-only) also failed: ${textOnlyError.message}. Falling back to Ollama.`);
        }
      }
    }
  }
  
  // If still no content, try Ollama
  if (!generatedContent) {
    try {
      logger.info("Attempting to generate content using Ollama");
      generatedContent = await generateJiraContentWithOllama(prompt, images, issueType);
      usedProvider = "Ollama";
      logger.info("Successfully generated content using Ollama");
    } catch (ollamaError) {
      logger.error(`All providers failed. Ollama: ${ollamaError.message}`);
      throw new Error(`Failed to generate content with all providers. Ollama: ${ollamaError.message}`);
    }
  }

  if (!generatedContent) {
    throw new Error("Invalid response structure from AI provider");
  }

  const summaryMatch = generatedContent.match(
    /(?:h3\. (?:Issue Summary|Task Summary|Story Summary|Summary):|(?:Issue Summary|Task Summary|Story Summary|Summary):)\s*(.+)/
  );
  let summary = summaryMatch?.[1]?.trim();
  
  // Clean up any remaining brackets from the summary
  if (summary) {
    summary = summary.replace(/^\[|\]$/g, '').trim();
  }
  
  let description = generatedContent
    .replace(/(?:h3\. (?:Issue Summary|Task Summary|Story Summary|Summary):|(?:Issue Summary|Task Summary|Story Summary|Summary):)\s*.+/, "")
    .trim();
  
  // Clean up any remaining h3. formatting from the description
  if (description) {
    description = description.replace(/h3\.\s*/g, '').trim();
  }

  return {
    summary: summary || `${issueType}: Summary not available`,
    description: description || "Description not available",
    bugReport: generatedContent,
    provider: usedProvider,
  };
}

async function previewBugReport(req, res) {
  const { prompt, images = [], issueType = "Bug" } = req.body;

  if (!prompt || !Array.isArray(images)) {
    return res.status(400).json({ error: "Invalid request payload" });
  }

  // Set up Server-Sent Events headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  try {
    await generateJiraContentStreaming(prompt, images, issueType, res);
  } catch (error) {
    logger.error(`Error generating ${issueType} preview: ${error.message}`);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: `Failed to generate ${issueType} preview`,
      details: error.message
    })}\n\n`);
  }
  
  res.end();
}

async function createJiraIssue(req, res) {
  const { summary, description, issueType, priority } = req.body;

  if (!summary || !description || !issueType) {
    return res.status(400).json({ error: "Invalid request payload" });
  }

  try {
    const jiraBaseUrl = process.env.JIRA_URL;
    const jiraToken = process.env.JIRA_TOKEN;

    const jiraUrl = `${jiraBaseUrl}/rest/api/2/issue`;
    
    // Create base payload
    const baseFields = {
      project: { key: "CUDI" },
      summary,
      description,
      issuetype: { name: issueType },
      priority: {
        name: priority,
      },
    };

    // Add issue type specific custom fields using switch case
    let payload;
    switch (issueType) {
      case "Task":
        payload = {
          fields: {
            ...baseFields,
            customfield_11400: "11222",
            customfield_10006: "CUDI-11449"
          },
        };
        break;
      
      case "Bug":
        payload = {
          fields: {
            ...baseFields,
            customfield_16302: { id: "21304" },
            customfield_16300: { id: "21302" },
            customfield_11301: { id: "11023" },
            customfield_11302: { id: "11029" },
            customfield_11400: "11222",
          },
        };
        break;
      
      default:
        payload = {
          fields: {
            ...baseFields,
            customfield_11400: "11222",
          },
        };
        break;
    }

    const response = await axios.post(jiraUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jiraToken}`,
      },
    });

    res.status(200).json({
      message: "Jira issue created successfully",
      jiraIssue: response.data,
    });
  } catch (error) {
    logger.error(`Error creating Jira issue: ${error.message}`);
    res
      .status(500)
      .json({ error: "Failed to create Jira issue", details: error.message });
  }
}

// Controller to upload an image to a Jira issue
async function uploadImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: "Missing file in request" });
  }

  const issueKey = req.body.issueKey; 
  const originalFileName = req.body.fileName;

  if (!issueKey) {
    return res
      .status(400)
      .json({ error: "Missing issueKey in request payload" });
  }

  try {
    const jiraBaseUrl = process.env.JIRA_URL;
    const jiraToken = process.env.JIRA_TOKEN;

    const jiraUrl = `${jiraBaseUrl}/rest/api/2/issue/${issueKey}/attachments`;

    let filePath = req.file.path;
    let fileName = originalFileName || req.file.originalname;

    // Use the reusable function to convert .mov to .mp4 if necessary
    ({ filePath, fileName } = await convertMovToMp4(filePath, fileName));

    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath), fileName);

    const response = await axios.post(jiraUrl, formData, {
      headers: {
        ...formData.getHeaders(),
        "X-Atlassian-Token": "no-check",
        Authorization: `Bearer ${jiraToken}`,
      },
    });

    fs.unlinkSync(filePath);

    res.status(200).json({
      message: "Image uploaded to Jira successfully",
      jiraResponse: response.data,
      fileName,
    });
  } catch (error) {
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    logger.error(`Error uploading image to Jira: ${error.message}`);
    res
      .status(500)
      .json({
        error: "Failed to upload image to Jira",
        details: error.message,
      });
  }
}

const fetchJiraIssue = async (issueId) => {
  const jiraUrl = `${process.env.JIRA_URL}/rest/api/2/issue/${issueId}`;
  const jiraToken = process.env.JIRA_TOKEN;

  return axios.get(jiraUrl, {
    headers: {
      Authorization: `Bearer ${jiraToken}`,
      "Content-Type": "application/json",
    },
  });
};

async function fetchJiraSummaries(issueKeys) {
  const jiraToken = process.env.JIRA_TOKEN;
  const jql = `issueKey in (${issueKeys.join(',')})`;
  const url = `${process.env.JIRA_URL}/rest/api/2/search?jql=${encodeURIComponent(jql)}&fields=summary`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${jiraToken}`,
        'Accept': 'application/json'
      }
    });

    const issues = response.data.issues;

    return Object.fromEntries(
      issues.map(issue => [issue.key, issue.fields.summary])
    );
  } catch (error) {
    console.error('Error fetching Jira summaries:', error.message);
    return {};
  }
}

async function getJiraIssue(req, res) {
  const issueId = req.params.id;

  try {
    const response = await fetchJiraIssue(issueId);
    res.status(200).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      message: error.response?.data || "Failed to fetch Jira issue",
    });
  }
}


export {
  previewBugReport,
  createJiraIssue,
  uploadImage,
  getJiraIssue,
  fetchJiraIssue,
  fetchJiraSummaries
};

export default {
  previewBugReport,
  createJiraIssue,
  uploadImage,
  getJiraIssue,
  fetchJiraIssue,
  fetchJiraSummaries
};
