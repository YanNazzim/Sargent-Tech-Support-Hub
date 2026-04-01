// netlify/functions/chat.js
const { VertexAI } = require("@google-cloud/vertexai");

/* VIDEO LIBRARY CONFIGURATION */
const VIDEO_LIBRARY = {
  "Rehanding Mortise Locks (8200/7800/9200)": {
    id: "3alaDlEST1k", 
    title: "How to Change the Handing of a SARGENT Mortise Lock",
  },
  "Ordering Sargent Exit Devices": {
    id: "qr2lvvIOfXs", 
    title: "How to Order SARGENT Exit Devices",
  },
  "Ordering Sargent Bored Locks": {
    id: "VJYuw2poXJ4", 
    title: "How to Order SARGENT Bored Locks",
  },
  "Ordering Sargent Mortise Locks": {
    id: "90c06zoJt_E", 
    title: "How to Order SARGENT Mortise Locks",
  },
  "Electric Latch Retraction (MELR 56-8200)": {
    id: "HTRW27b37TU", 
    title: "SARGENT 8200 Series Mortise Lock with Motorized Electric Latch Retraction 56",
  },
  "Changing Locking Slide on ET Control": {
    id: "YriRFZK7loU", 
    title: "How to Change the Locking Slide on a SARGENT ET Lever Control",
  },
  "Rehanding 700 Series ET Trim (80 Series)": {
    id: "x8Eq1moV97Y",
    title: "How to Rehand a 700 Series Lever Trim in an 80 Series Exit Device",
  },
  "Rehanding P700 Series Trim (PE80 Series)": {
    id: "Mm9RR3Q3SCI", 
    title: "How to Rehand a P700 Series Lever Trim in an PE80 Series Exit Device",
  },
  "80 Series Keyed Cylinder Dogging (16-)": {
    id: "tKgbjR2U8Gw", 
    title: "How to Retrofit an 816 Cylinder Dogging Kit into a SARGENT 80 Series Exit Device",
  },
  "PE80 Series Keyed Cylinder Dogging (16-)": {
    id: "XwrEIV0mEeo", 
    title: "How to Retrofit a Keyed Cylinder Dogging Kit into a PE80 Series Exit Device",
  },
  "21- Lost Ball Construction Cylinders": {
    id: "KfJLfwyZoWQ", 
    title: "Information on 21- Option Lost Ball for SARGENT Cylinders",
  },
  "Installing VN1 Escutcheon Indicator": {
    id: "7TjVrhmkh0k", 
    title: "SARGENT Escutcheon Indicator Installation",
  },
  "Installing Sectional Indicators (V Series)": {
    id: "lyODTUue6mU", 
    title: "SARGENT Sectional Indicator Installation",
  },
  "Installing 7300 Series Multi-Point Lock": {
    id: "Pf8kJ4doXM4", 
    title: "SARGENT FM7300 Series Multi-Point Lock Factory Installation Procedure",
  },
  "Installing 8700 Series SVR Exit Device": {
    id: "RO7eNs3p9IQ", 
    title: "How to Install the SARGENT 8700 Series Surface Vertical Rod Exit Device",
  },
  "PE80 Series General Info": {
    id: "fF2tbpJxAI8", 
    title: "The SARGENT PE80 Series: A New Standard for Design and Performance",
  },
  "PE80 Series Rod Adjustment (CVR)": {
    id: "iC_4u2jrn6s", 
    title: "How to Easily Adjust the Center Case on SARGENT PE80 Series Exit Devices",
  },
  "10X Bored Lock Status Indicators": {
    id: "5Tj1SJcT824", 
    title: "SARGENT 10X Line Bored Lock Now Available With Status Indicators",
  },
  "8200 Mortise Lock Status Indicators": {
    id: "7bSGmF-z9eE", 
    title: "Enhancing Privacy and Security with 8200 Series Mortise Lock Indicators",
  },
  "PE80 Chassis Indicators (49-)": {
    id: "ZDSJ3hollSA", 
    title: "Chassis Indicator for PE80 Series Exit Device",
  },
  "PE80 Series Hex Dogging": {
    id: "9NBHGMUkx_U",  
    title: "How to Retrofit Hex Dogging Kit (No Keys Involved) into a PE80 Series Exit Device",
  },
  "80 Series Hex Dogging": {
    id: "G6hFZg9QsYI",  
    title: "Installing Hex Key Dogging Kits on an 80 Series Exit Device",
  },
  "80 Series Black Lexan Touchpad Kit": {
    id: "T32cOWrcOO8",  
    title: "How to Install the Black Lexan Touchpad Kits on an 80 Series Exit Device",
  },
  "Changing Spindles on ET Trim": {
    id: "sB8LWq5EKx4", 
    title: "Changing Spindles on Our ET Lever Trims",
  },
  "Changing Mortise Lock Functions (8200)": {
    id: "M_B9fDqIvQY", 
    title: "How to Change Functions on a SARGENT Mortise Lock",
  },
};

/* AUTHENTICATION LOGIC */
const getAuthOptions = () => {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.error("CRITICAL: Missing GOOGLE_SERVICE_ACCOUNT_JSON environment variable.");
    throw new Error("Server Configuration Error: Missing Credentials");
  }

  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    return {
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
    };
  } catch (error) {
    console.error("Auth Parse Error:", error);
    throw new Error("Invalid service credentials.");
  }
};

// Initialize Vertex AI with Environment Variables
const vertex_ai = new VertexAI({
  project: process.env.GCP_PROJECT_ID,
  location: "global",
  // FIX 1: Explicitly set the API endpoint to bypass the invalid URL generation
  apiEndpoint: "aiplatform.googleapis.com", 
  googleAuthOptions: getAuthOptions(),
});

// Define Sargent Data Store with Environment Variable
const sargentDataStore = {
  retrieval: {
    vertexAiSearch: {
      datastore: process.env.GCP_DATASTORE_PATH,
    },
  },
};

exports.handler = async (event) => {
  // --- 🔒 SECURITY: DYNAMIC ORIGIN CHECK ---
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : [];

  const origin = event.headers.origin || event.headers.referer || "";
  
  const isAllowed = allowedOrigins.some(ao => origin === ao || origin.startsWith(ao + "/"));

  if (!isAllowed) {
    console.warn(`Blocked unauthorized origin: ${origin}`);
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Access Denied: Request must originate from authorized Sargent Template tool." }),
    };
  }

  // Handle preflight OPTIONS requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
      },
      body: "OK"
    };
  }

  if (event.httpMethod !== "POST")
    return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const requestBody = JSON.parse(event.body);
    const { query, history, answerGenerationSpec } = requestBody;

    // --- 🛡️ SECURITY: INPUT VALIDATION & SANITIZATION ---

    if (query.text && query.text.length > 2000) {
       return {
         statusCode: 400,
         body: JSON.stringify({ error: "Query too long. Please restrict to 2000 characters." })
       };
    }

    const safeHistory = (history || []).slice(-10);

    if (query.images && query.images.length > 4) {
       return {
         statusCode: 400,
         body: JSON.stringify({ error: "Too many images. Maximum 4 allowed." })
       };
    }

    // --- CONSTRUCT SYSTEM INSTRUCTIONS ---
    
    const STRICT_SCOPE_PROTOCOL = `
*** MISSION CRITICAL PROTOCOL ***
ROLE: You are an AI Specialized exclusively in SARGENT MANUFACTURING hardware.
RESTRICTION: You are NOT a general purpose assistant. You are a closed-domain technical bot.

RULES OF ENGAGEMENT:
1. OFF-TOPIC REFUSAL: If the user asks about weather, coding (outside this tool), general life advice, or other brands (Schlage, Yale, Corbin) *without* asking for a cross-reference to Sargent, you MUST reply:
   "I am an AI trained exclusively on Sargent Hardware. I cannot assist with [topic]. Please ask me about Sargent locks, exits, or cylinders."
   
2. COMPETITOR DATA: Only mention competitors (Schlage/Yale/Best) if converting THEIR part number to a SARGENT equivalent. Do not offer support for their products.

3. NO HALLUCINATION: If you cannot find the specific Sargent part number in your context, do not invent one. State: "I cannot identify a specific part number based on the current data. Please contact Sargent Technical Support for verification."

4. HUMAN HANDOFF: If the user explicitly asks for a human, rep, or real person, provide the contact info: "I am an AI. For human assistance, please call Sargent Tech Support at 1-800-727-5477."
`;

    let baseInstruction = answerGenerationSpec?.promptSpec?.preamble || 
      `You are the Sargent Hardware Expert AI. Provide immediate, accurate technical data.`;

    const videoInstruction = `
\n\nVIDEO RECOMMENDATION PROTOCOL (MANDATORY):
You have access to a curated video library for the specific topics listed below.

LIST OF VIDEO TOPICS:
${Object.keys(VIDEO_LIBRARY).map((topic) => `- ${topic}`).join("\n")}

TRIGGER RULES:
1. CHECK: Is the user's query RELEVANT to any of the topics above?
2. ACTION: If there is a match, you MUST append a hidden tag: ||VIDEO: [Exact Topic Name]||
`;

    const fullSystemInstruction = STRICT_SCOPE_PROTOCOL + "\n\n" + baseInstruction + videoInstruction;

    // --- INITIALIZE MODEL ---
    const model = vertex_ai.getGenerativeModel({
      // FIX 2: Restored the valid Preview model name string
      model: "gemini-3-flash-preview", 
      tools: [sargentDataStore],
      generationConfig: {
        temperature: 0.1, 
        maxOutputTokens: 1536,
        topP: 0.8,
        topK: 40,
      },
      systemInstruction: {
        parts: [{ text: fullSystemInstruction }],
      },
    });

    // --- PREPARE CONTENT ---
    const userContentParts = [];
    if (query.text) userContentParts.push({ text: query.text });

    if (query.images && Array.isArray(query.images)) {
      query.images.forEach((img) => {
        if (img.data && ["image/jpeg", "image/png", "image/webp"].includes(img.mimeType)) {
          userContentParts.push({
            inlineData: { mimeType: img.mimeType, data: img.data },
          });
        }
      });
    }

    // --- MANAGE HISTORY ---
    const recentHistory = safeHistory.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    // --- GENERATE RESPONSE ---
    const chat = model.startChat({ history: recentHistory });
    const result = await chat.sendMessage(userContentParts);
    const response = await result.response;
    const candidate = response.candidates[0];

    // --- VIDEO DETECTION LOGIC ---
    let finalAnswer = candidate.content.parts[0].text;
    let videoData = null;

    const videoTagRegex = /\|\|VIDEO: (.*?)\|\|/;
    const match = finalAnswer.match(videoTagRegex);

    if (match) {
      const videoKey = match[1].trim();
      if (VIDEO_LIBRARY[videoKey]) {
        videoData = VIDEO_LIBRARY[videoKey];
      }
      finalAnswer = finalAnswer.replace(match[0], "").trim();
    }

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": origin
      },
      body: JSON.stringify({
        answer: {
          answerText: finalAnswer,
          citations: candidate.citationMetadata?.citations || [],
          video: videoData,
        },
      }),
    };
  } catch (error) {
    console.error("Vertex AI Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Service Error: " + error.message }),
    };
  }
};