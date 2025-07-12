const axios = require("axios");
require('dotenv').config();

async function testOpenAICompatibleServer() {
  console.log("Testing OpenAI Compatible Server Configuration:");
  console.log(`Base URL: ${process.env.OPENAI_COMPATIBLE_BASE_URL}`);
  console.log(`Model: ${process.env.OPENAI_COMPATIBLE_MODEL}`);
  console.log(`API Key: ${process.env.OPENAI_COMPATIBLE_API_KEY ? 'Set' : 'Not Set'}`);
  
  // Test 1: Simple text-only request
  console.log("\n--- Test 1: Text-only request ---");
  try {
    const response = await axios.post(`${process.env.OPENAI_COMPATIBLE_BASE_URL}/chat/completions`, {
      model: process.env.OPENAI_COMPATIBLE_MODEL,
      messages: [
        {
          role: "user",
          content: "Hello, can you respond with a simple greeting?"
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_COMPATIBLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log("✅ Text-only request successful");
    console.log("Response:", response.data.choices[0].message.content);
  } catch (error) {
    console.log("❌ Text-only request failed");
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Error data:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.log(`Error:`, error.message);
    }
  }
  
  // Test 2: Request with image (vision model test)
  console.log("\n--- Test 2: Vision model test ---");
  try {
    // Create a small test base64 image (1x1 pixel red PNG)
    const testImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
    
    const response = await axios.post(`${process.env.OPENAI_COMPATIBLE_BASE_URL}/chat/completions`, {
      model: process.env.OPENAI_COMPATIBLE_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "What do you see in this image?" },
            {
              type: "image_url",
              image_url: { 
                url: `data:image/png;base64,${testImage}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_COMPATIBLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log("✅ Vision model request successful");
    console.log("Response:", response.data.choices[0].message.content);
  } catch (error) {
    console.log("❌ Vision model request failed");
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Error data:`, JSON.stringify(error.response.data, null, 2));
      console.log(`Error headers:`, JSON.stringify(error.response.headers, null, 2));
    } else {
      console.log(`Error:`, error.message);
    }
  }
  
  // Test 3: Check server capabilities
  console.log("\n--- Test 3: Server capabilities ---");
  try {
    const response = await axios.get(`${process.env.OPENAI_COMPATIBLE_BASE_URL}/models`, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_COMPATIBLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log("✅ Models endpoint accessible");
    console.log("Available models:", response.data.data?.map(m => m.id) || "Unable to parse models");
  } catch (error) {
    console.log("❌ Models endpoint failed");
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Error data:`, JSON.stringify(error.response.data, null, 2));
    } else {
      console.log(`Error:`, error.message);
    }
  }
}

testOpenAICompatibleServer().catch(console.error);
