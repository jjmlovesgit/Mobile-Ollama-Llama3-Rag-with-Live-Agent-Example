import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";

// Initialize embeddings
const embeddings = new OllamaEmbeddings({
    baseUrl: "http://localhost:11435",
    model: "nomic-embed-text",
    requestOptions: {
      keepalive: -1,
      useMMap: true,
      numThread: 6,
      numGpu: 1,
    },
  });

const documents = ["Hello World!", "Bye Bye"];

const documentEmbeddings = await embeddings.embedDocuments(documents);

console.log(documentEmbeddings);