// Import required modules
const express = require('express');
const fs = require('fs');
const { compile } = require('handlebars');
const { RetrievalQAChain, loadQAStuffChain } = require('langchain/chains');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { Ollama } = require('langchain/llms/ollama');
const { MemoryVectorStore } = require('langchain/vectorstores/memory');
const { OllamaEmbeddings } = require('langchain/embeddings/ollama');
const cors = require('cors');

const app = express();

// Configure CORS for Tailscale (Remote access to the app without loadiong LLM etc.)
app.use(cors({
  origin: 'https://desktop.tail772ae.ts.net',
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/', express.static(__dirname));

// Initialize Ollama with specified configuration
//const ollama = new Ollama({
//  baseUrl: "http://localhost:11434",
//  model: "llama3:8b-instruct-fp16", // "solar:10.7b-instruct-v1-q8_0", //llama3:latest
//  num_ctx: 4096,
//  keepalive: -1,
//  temperature: 0.1,
//  topK: 10,
//  topP: 0.4,
//  repeatPenalty: 1.3,
//  maxtokens: 1024,
//});

const ollama = new Ollama({
  baseUrl: "http://localhost:11434",
  model: "llama3_8B_fp16_8092:latest", //"phi3:latest", //llama3:8b-instruct-fp16, "llama3_8B_fp16_8092:latest" "phi3:3.8b-mini-instruct-4k-fp16"
  num_keep: 100, //5,
  seed: 42,
  num_predict: 100,
  top_k: 20,
  top_p: 0.9,
  tfs_z: 0.5,
  typical_p: 0.1,
  repeat_last_n: -1, //33,
  temperature: 0.1,
  repeat_penalty: 1.2,
  presence_penalty: 1.5,
  frequency_penalty: 1.0,
  mirostat: 1,
  mirostat_tau: 0.8,
  mirostat_eta: 0.6,
  penalize_newline: true,
  numa: false,
  num_ctx: 8092,
  num_batch: 2,
  num_gqa: 1,
  num_gpu: 1,
  main_gpu: 0,
  low_vram: false,
  f16_kv: true,
  vocab_only: false,
  use_mmap: true,
  use_mlock: false,
  rope_frequency_base: 1.1,
  rope_frequency_scale: 0.8,
  num_thread: 16 //8
});

// Initialize embeddings-c 8192 -b 8192 --rope-scaling yarn --rope-freq-scale .75 -p 
const embeddings = new OllamaEmbeddings({
  baseUrl: "http://localhost:11435",
  model: "nomic-embed-text",
  requestOptions: {
    keepalive: -1,
    num_ctx: 8092,
    temperature: 0, 
    rope_frequency_scale: .75,
    useMMap: true,
    numThread: 6,
    numGpu: 1,
  },
});

let globalVectorRetriever = null;

// Load vector store at startup and convert it to a retriever
async function loadVectorStore() {
  const text = fs.readFileSync('./pizzamenutxt2.txt', 'utf8');
  const textSplitter = new RecursiveCharacterTextSplitter({ chunk_size: 3000, chunk_overlap: 0 });
  const docs = await textSplitter.createDocuments([text]);
  const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
  globalVectorRetriever = vectorStore.asRetriever(search_kwargs={"k": 5}); // Convert to retriever db.as_retriever(search_kwargs={"k": 3})
}

loadVectorStore().then(() => {
    console.log("\r\nVector store initialized successfully.");
}).catch(err => {
    console.error("\r\nFailed to initialize vector store:", err);
});

// Conversation buffer to store context
const conversationBuffer = [];

// Define a function to initialize the chain with the specified prompt
async function initializeChain(prompt) {
  return new RetrievalQAChain({
    llm: ollama,
    combineDocumentsChain: loadQAStuffChain(ollama),
    retriever: globalVectorRetriever,
    returnSourceDocuments: true,
    prompt: prompt
  });
}
//const systemPromptTemplate = <|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{{System}}<|eot_id|><|start_header_id|>user<|end_header_id|>\n\nWho are you?<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n
const systemPromptTemplate = "<s>[INST] <<SYS>>{{System}}<</SYS>>";

const renderSystemPrompt = compile(systemPromptTemplate);

// Define API route to handle queries
app.post('/query', async (req, res) => {
  try {
    const { isShortAnswer, query } = req.body;
    
 //Prompt -- chnage this to fit use case etc. 
const prompt = isShortAnswer ? "Do not repeat yourself. Stay business like. and prfessional at all times.  Respond in formal sentences with no summary shorthand conventions.  ONLY ANSWER ABOUT GENO'S Reastaurant Menu with the pageContent provided.  You are an order taker collecting orders for a pizza restaurant.  YOU ONLY ANSWER QUESTIONS USING THE CONTEXT PROVIDED.  You engage in a chat exchnage with the customer to gather a list of items taking care to always know what was ordered and keeping an itemized list with prices and a  running total.  Use only complete sentences when responding.   If the customer indicates they are finished ordering repeat back the final order with the total cost and ask them to please provide a Customer number to use to confirm the order.  AFTER  GETTING A Customer  NUMBER thank the customer and say good bye and telt lthem to enjoy the meal.  Respond in a short, conversational style and you never apologize.  You only answer questions from the context that have to do with Gino's Italian restaurant and ordering food.  Do not answer any questions unrelated to Geno's Restaurant. Do not explain yourself or your answers"  : "Do not repeat yourself. Stay business like. and prfessional at all times.  Respond in formal sentences with no summary shorthand conventions.  ONLY ANSWER ABOUT GENO'S Reastaurant Menu with the pageContent provided.  You are an order taker collecting orders for a pizza restaurant.  YOU ONLY ANSWER QUESTIONS USING THE CONTEXT PROVIDED.  You engage in a chat exchnage with the customer to gather a list of items taking care to always know what was ordered and keeping an itemized list with prices and a  running total.  Use only complete sentences when responding.   If the customer indicates they are finished ordering repeat back the final order with the total cost and ask them to please provide a TELEPHONE number to use to confirm the order.  AFTER  GETTING A TELEPHONE NUMBER thank the customer and say good bye and telt lthem to enjoy the meal.  Respond in a short, conversational style and you never apologize.  You only answer questions from the context that have to do with Gino's Italian restaurant and ordering food.  Do not answer any questions unrelated to Geno's Restaurant. Do not explain yourself or your answers" 
    const chain = await initializeChain(prompt);
    conversationBuffer.push(`User Query: ${query}`);
    const context = conversationBuffer.join("\n");
    const systemPrompt = renderSystemPrompt({ System: prompt + "\n" + context });
    const fullQuery = `${systemPrompt}\n\nAnswer:`;

    const result = await chain.call({ query: fullQuery });

    //conversationBuffer.push(`AI Response: ${result.text}`);
    //console.log('\r\nFull Query:', fullQuery);
   // console.log('\r\nCurrent Conversation Memory:');
    //conversationBuffer.forEach((entry, index) => {
   //   console.log(`\r\nTurn ${index + 1}: ${entry}`);
   // });

    res.json(result);
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).send('An error occurred while processing your request.');
  }
});

// Endpoint to reset the conversation buffer
app.post('/reset-conversation', (req, res) => {
  conversationBuffer.length = 0;
  console.log("Conversation buffer has been reset.");
  res.status(200).send("Conversation buffer reset successfully.");
});

const port = 3001;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://10.0.0.31:${port}/`);
});
