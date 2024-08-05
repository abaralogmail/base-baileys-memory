const { Configuration, OpenAIApi, OpenAI } = require('openai');
//const OpenAI = require('./Assistant');
require('dotenv/config');
const fs = require('fs').promises;
const path = require('path');

// Reemplaza 'your-api-key' con tu clave API de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY

});

// Mapeo para almacenar los hilos de conversación de los usuarios
//const userThreads = {"5493812010781":"thread_tWAdefP1xDPko4qOoicTKhZj"};
let userThreads = {};

// Path to the storage file
const STORAGE_FILE = path.join(__dirname, 'userThreads.json');

// Function to get or create a thread for a user
let userThreadsLoaded = false;

// Load userThreads from file
async function loadUserThreads() {
  try {
    const data = await fs.readFile(STORAGE_FILE, 'utf8');
    userThreads = JSON.parse(data);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error loading user threads:', error);
    }
    userThreads = {};
  }
}

// Save userThreads to file
async function saveUserThreads() {
  try {
    await fs.writeFile(STORAGE_FILE, JSON.stringify(userThreads));
  } catch (error) {
    console.error('Error saving user threads:', error);
  }
}

// Function to create a new thread
async function createThread() {
  try {
    const thread = await openai.beta.threads.create();
    return thread.id; // Return the new thread ID
  } catch (error) {
    console.error('Error creating thread:', error);
    throw error;
  }
}


async function getOrCreateThread(ctx) {
  if (!userThreadsLoaded) {
    await loadUserThreads();
    userThreadsLoaded = true;
  }

  if (!userThreads[ctx.from]) {
    userThreads[ctx.from] = await createThread();
    ctx.key.remoteJid = userThreads[ctx.from];
    await saveUserThreads();
  }

  return userThreads[ctx.from];
}
async function chatWithAssistant(ctx, history) {
  // Verificar si el usuario ya tiene un hilo de conversación

  try {
    const userId = ctx.from
    const threadId = await getOrCreateThread(ctx);
    ctx.remoteJid = threadId;



    //  console.log(`Using thread ${threadId} for user ${userId}`);
    // Continue with your chat logic using the threadId


    const response = await openai.beta.threads.messages.create(threadId,
      { role: 'user', content: ctx.body });

    const messagesResponse = await openai.beta.threads.messages.list(threadId);

    // Obtener la respuesta del asistente
    let respuesta = "sin respuesta";
    const run = await openai.beta.threads.runs.create(threadId,
      { assistant_id: process.env.ASSISTANT_ID });


    // Polling mechanism to see if runStatus is completed
    // Imediately fetch run-status, which will be "in_progress"
    let runStatus = await openai.beta.threads.runs.retrieve(
      threadId,
      run.id
    );

    // Polling mechanism to see if runStatus is completed
    while (runStatus.status !== "completed") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(
        threadId,
        run.id
      );

      // Check for failed, cancelled, or expired status
      if (["failed", "cancelled", "expired"].includes(runStatus.status)) {
        //           console.log(
        //              `Run status is '${runStatus.status}'. Unable to complete the request.`);
        break; // Exit the loop if the status indicates a failure or cancellation
      }
    }

    // Get the last assistant message from the messages array
    const messages = await openai.beta.threads.messages.list(threadId);

    // Find the last message for the current run
    const lastMessageForRun = messages.data
      .filter(
        (message) =>
          message.run_id === run.id && message.role === "assistant"
      )
      .pop();

    // If an assistant message is found, console.log() it
    if (lastMessageForRun) {
      respuesta = lastMessageForRun.content[0].text.value;
      console.log(`${lastMessageForRun.content[0].text.value} \n`);
    } else if (
      !["failed", "cancelled", "expired"].includes(runStatus.status)
    ) {
      console.log("No response received from the assistant.");
    }


    return respuesta;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

module.exports = { chatWithAssistant };



