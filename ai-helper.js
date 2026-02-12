/**
 * AI Helper - Detects Ollama and generates contextual responses
 * Falls back to pre-written responses if Ollama not available
 */

import http from 'http';

// Voice personalities (system prompts)
const PERSONALITIES = {
  hear: `You are "hear" - a deeply empathetic listener. Your role is to reflect back what people say, validate their feelings, and ask gentle follow-up questions. Keep responses to 1-2 sentences. Be warm, present, and non-judgmental.`,
  
  inspyre: `You are "inspyre" - a motivational voice that helps people reconnect with their inner strength. Remind them of their resilience, past victories, and inherent value. Keep responses to 1-2 sentences. Be uplifting and empowering.`,
  
  flow: `You are "flow" - a zen guide who speaks in water and nature metaphors. Help people surrender to life's currents and trust the process. Keep responses to 1-2 sentences. Be calm, fluid, and peaceful.`,
  
  you: `You are "you" - a voice that celebrates authentic self-expression. Remind people they are unique, whole, and worthy exactly as they are. Keep responses to 1-2 sentences. Be affirming and liberating.`,
  
  view: `You are "view" - a perspective-shifter who helps reframe challenges. Offer bigger picture thinking, temporal perspective, or alternative angles. Keep responses to 1-2 sentences. Be wise and insightful.`
};

let ollamaAvailable = null;

/**
 * Simple HTTP GET helper for Ollama
 */
function httpGet(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 11434,
      path: path,
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ ok: res.statusCode === 200, data: JSON.parse(data) });
        } catch (e) {
          resolve({ ok: false, data: null });
        }
      });
    });
    
    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

/**
 * Simple HTTP POST helper for Ollama
 */
function httpPost(path, body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    
    const req = http.request({
      hostname: 'localhost',
      port: 11434,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 30000 // Increased to 30 seconds for slower machines
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ ok: res.statusCode === 200, data: JSON.parse(data) });
        } catch (e) {
          resolve({ ok: false, data: null });
        }
      });
    });
    
    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.write(postData);
    req.end();
  });
}

/**
 * Check if Ollama is running (cached result)
 */
async function checkOllama() {
  if (ollamaAvailable !== null) return ollamaAvailable;
  
  try {
    const response = await httpGet('/api/tags');
    ollamaAvailable = response.ok;
    console.log(`[Ollama Check] Available: ${ollamaAvailable}`);
  } catch (err) {
    console.log(`[Ollama Check] Failed: ${err.message}`);
    ollamaAvailable = false;
  }
  
  return ollamaAvailable;
}

/**
 * Generate AI response using Ollama
 */
async function generateWithOllama(voiceName, userMessage, conversationHistory = []) {
  try {
    const systemPrompt = PERSONALITIES[voiceName] || PERSONALITIES.hear;
    
    // Build context from recent messages (last 3)
    const recentContext = conversationHistory.slice(-3).map(msg => 
      `${msg.from}: ${msg.text}`
    ).join('\n');
    
    const prompt = recentContext 
      ? `Recent conversation:\n${recentContext}\n\nUser: ${userMessage}\n\nRespond as ${voiceName}:`
      : `User: ${userMessage}\n\nRespond as ${voiceName}:`;
    
    const response = await httpPost('/api/generate', {
      model: 'llama3.2:3b',
      prompt: prompt,
      system: systemPrompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 50 // Reduced for faster responses (1-2 sentences)
      }
    });
    
    if (!response.ok || !response.data) throw new Error('Ollama request failed');
    
    return response.data.response?.trim() || null;
  } catch (err) {
    console.error(`Ollama generation error: ${err.message}`);
    return null;
  }
}

/**
 * Main function: Generate response (tries Ollama, falls back to pre-written)
 */
export async function generateResponse(voiceName, userMessage, voiceFunction, conversationHistory = []) {
  // Try Ollama first
  const hasOllama = await checkOllama();
  
  if (hasOllama) {
    const aiResponse = await generateWithOllama(voiceName, userMessage, conversationHistory);
    if (aiResponse) {
      console.log(`[AI] ${voiceName} generated contextual response`);
      return aiResponse;
    }
    console.log(`[AI] ${voiceName} failed, falling back to pre-written`);
  }
  
  // Fallback to pre-written
  console.log(`[Fallback] ${voiceName} using pre-written response for: "${userMessage}"`);
  const fallbackResponse = voiceFunction(userMessage);
  console.log(`[Fallback] Got response:`, fallbackResponse);
  
  if (!fallbackResponse || !fallbackResponse.message) {
    console.error('[Fallback] ERROR: No message in fallback response!');
    return 'I hear you.'; // Emergency fallback
  }
  
  return fallbackResponse.message;
}

export { checkOllama };
