const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const JsonFileAdapter = require('@bot-whatsapp/database/json')
const sendBulkMessages = require('./mensajes/sendBulkMessages');

const { run, executeNotionAssistant } = require('./mensajes/logica');
//const { chatWithAssistant } = require('./mensajes/Assistant');
const fs = require('fs').promises

let blockedUsers = new Set();
const BLOCKED_USERS_FILE = 'blocked_users.json';
let messageCount = 0;
let userMessageCounts = {};


const isWithinRestrictedHours = () => {
    const now = new Date();
    const day = now.getDay(); // 0 (Sunday) to 6 (Saturday)
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Check if it's Monday to Saturday (1-6) and between 8:30 AM and 12:30 PM
    return day >= 1 && day <= 6 && 
           ((hour === 8 && minute >= 30) || (hour > 8 && hour < 12) || (hour === 12 && minute <= 30));
};


const flowNotionAssistant = addKeyword(['notion', 'database'])
    .addAction(async (ctx, { flowDynamic }) => {
        try {
            const response = await executeNotionAssistant(ctx);
            flowDynamic(response);
        } catch (error) {
            console.error('Error executing Notion Assistant:', error);
            flowDynamic('There was an error processing your request with Notion Assistant.');
        }
    });

const flowEnviarMensaje = addKeyword(['enviar mensaje'])
    .addAction(async (ctx, { flowDynamic, provider, gotoFlow }) => {
        if (ctx.body.toLowerCase() !== 'enviar mensaje') return gotoFlow(flowPrincipal);
        const numero = '5493812010781';
        const mensaje = 'Este es un mensaje de prueba desde MariaDono';

        try {
            await sendBulkMessages('./mensajes/Conexion - sendBulkMessages.xlsx', provider);
            flowDynamic('Mensaje enviado con éxito');
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            flowDynamic('Hubo un error al enviar el mensaje');
        }
    })

const flowEnviarMensaje = addKeyword(['enviar', 'mensaje'])
    .addAction(async (ctx, { flowDynamic, provider }) => {
        const numero = '5491137556119'; // Replace with the desired phone number
        const mensaje = 'Este es un mensaje de prueba desde MariaDono';

        try {
            await provider.sendText(`${numero}@c.us`, mensaje);
            flowDynamic('Mensaje enviado con éxito');
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            flowDynamic('Hubo un error al enviar el mensaje');
        }


const flowOperador = addKeyword(['operadora', 'op', 'desactivar', 'pausa', 'pausar'])
    .addAction(async (ctx, { flowDynamic, gotoFlow }) => {
        const validKeywords = ['operadora', 'op', 'desactivar', 'pausa', 'pausar'];
        if (!validKeywords.includes(ctx.body.toLowerCase())) return gotoFlow(flowPrincipal);
        
        const userId = ctx.from;
        blockedUsers.add(userId);
        await saveBlockedUsers();
        flowDynamic('El asistente virtual ha sido desactivado 🚫. Para reactivarlo, escribe "asistente", "chat", "activar" o "reanudar" 🟢.');
        messageCount = 0;
    })

const flowAsistente = addKeyword(['chat', 'asistente', 'activar', 'reanudar'])
    .addAction(async (ctx, { flowDynamic, gotoFlow }) => {
        const validKeywords = ['chat', 'asistente', 'activar', 'reanudar'];
        if (!validKeywords.includes(ctx.body.toLowerCase())) return gotoFlow(flowPrincipal);
        
        const userId = ctx.from;
        blockedUsers.delete(userId);
        await saveBlockedUsers();
        flowDynamic("El asistente virtual ha sido reactivado 🟢. La operadora está disponible de lunes a sábado de 8.30 a 12.30 hs. Si necesitas desactivarlo, escribe 'operadora', 'op', 'desactivar', 'pausa' o 'pausar' 🚫.");
        messageCount = 0;
    })

const sendChunksWithDelay = (chunks, delay, userId, flowDynamic) => {
    let i = 0;
    const sendChunk = () => {
        if (i < chunks.length && !blockedUsers.has(userId)) {
            flowDynamic(chunks[i]);
            i++;
            setTimeout(sendChunk, delay);
        }
    }
    sendChunk();
}

const loadBlockedUsers = async () => {
    try {
        const data = await fs.readFile(BLOCKED_USERS_FILE, 'utf8');
        blockedUsers = new Set(JSON.parse(data));
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.log('Error loading blocked users:', error);
        }
    }
}

const saveBlockedUsers = async () => {
    try {
        await fs.writeFile(BLOCKED_USERS_FILE, JSON.stringify([...blockedUsers]));
    } catch (error) {
        console.log('Error saving blocked users:', error);
    }
}

const flowPrincipal = addKeyword(EVENTS.WELCOME)
    .addAction(async (ctx, { flowDynamic, state }) => {
        const userId = ctx.from;
   
        // Always store the query in history
       const newHistory = (state.getMyState()?.history ?? [])
       newHistory.push({ role: 'user', content: ctx.body })
       console.log(`[ctx.from]:`, ctx.from);
       console.log(`[ctx.body]:`, ctx.body);
       // Check if it's within restricted hours
       if (isWithinRestrictedHours()) {
           //flowDynamic("Lo siento, MariaDono está deshabilitado de lunes a sábado de 8:30 a 12:30. Por favor, intenta más tarde.");
           //newHistory.push({ role: 'assistant', content: "Lo siento, MariaDono está deshabilitado de lunes a sábado de 8:30 a 12:30. Por favor, intenta más tarde." })
           await state.update({ history: newHistory })
           return;
       }

      
     
        // Initialize or increment the message count for this user
       userMessageCounts[userId] = (userMessageCounts[userId] || 0) + 1;



       // Check if it's the 8th message (or a multiple of 8)
       if (userMessageCounts[userId] % 8 === 0) {
           flowDynamic("Recuerda que puedes desactivar el asistente escribiendo 'operadora', 'op', 'desactivar', 'pausa' o 'pausar' 🚫. La operadora está disponible de lunes a sábado de 8.30 a 12.30 hs. Para reactivarlo, escribe 'asistente', 'chat', 'activar' o 'reanudar' 🟢.");
       }

        if (!blockedUsers.has(userId)) {
            try {
      //          const newHistory = (state.getMyState()?.history ?? [])
        //        newHistory.push({ role: 'user', content: ctx.body })

                const largeResponse = await run(ctx, newHistory)
                console.log(`[RESPONSE]:`, largeResponse);

                const chunks = largeResponse.split(/(?<!\d)\.\s+/g);
                sendChunksWithDelay(chunks, 5000, userId, flowDynamic);

                newHistory.push({ role: 'assistant', content: largeResponse })
                await state.update({ history: newHistory })

            } catch (err) {
                console.log(`[ERROR]:`, err)
            }
        }
    })






const main = async () => {
    await loadBlockedUsers();

    const adapterDB = new JsonFileAdapter()
    const adapterFlow = createFlow([flowEnviarMensaje, flowOperador, flowAsistente, flowNotionAssistant, flowPrincipal])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
