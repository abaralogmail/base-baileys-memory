const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const JsonFileAdapter = require('@bot-whatsapp/database/json')
const sendBulkMessages = require('./mensajes/sendBulkMessages');

const run = require('./mensajes/logica')
const fs = require('fs').promises

let blockedUsers = new Set();
const BLOCKED_USERS_FILE = 'blocked_users.json';
let messageCount = 0;

const flowEnviarMensaje = addKeyword(['enviar', 'mensaje'])
    .addAction(async (ctx, { flowDynamic, provider }) => {
        const numero = '5493812010781'; // Replace with the desired phone number
        const mensaje = 'Este es un mensaje de prueba desde MariaDono';

        try {
//            await provider.sendText(`${numero}@c.us`, mensaje);
            await sendBulkMessages('./mensajes/Conexion - sendBulkMessages.xlsx', provider);
            flowDynamic('Mensaje enviado con éxito');
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            flowDynamic('Hubo un error al enviar el mensaje');
        }
    })

const flowOperador = addKeyword(['operadora', 'op', 'desactivar', 'pausa', 'pausar'])
    .addAction(async (ctx, { flowDynamic }) => {
        const exactMatch = ctx.body.toLowerCase() === 'hello';
        if (!exactMatch) {
            return endFlow();
        }
        
        const userId = ctx.from;
        blockedUsers.add(userId);
        await saveBlockedUsers();
        flowDynamic('El asistente virtual ha sido desactivado 🚫. Para reactivarlo, escribe "asistente", "chat", "activar" o "reanudar" 🟢.');
        messageCount = 0; // Reiniciar el contador de mensajes
    })

const flowAsistente = addKeyword(['chat', 'asistente', 'activar', 'reanudar'])
    .addAction(async (ctx, { flowDynamic }) => {
        const userId = ctx.from;
        blockedUsers.delete(userId);
        await saveBlockedUsers();
        flowDynamic("El asistente virtual ha sido reactivado 🟢. La operadora está disponible de lunes a sábado de 8.30 a 12.30 hs. Si necesitas desactivarlo, escribe 'operadora', 'op', 'desactivar', 'pausa' o 'pausar' 🚫.");
        messageCount = 0; // Reiniciar el contador de mensajes
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

// Función para cargar usuarios bloqueados desde el archivo
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

// Función para guardar usuarios bloqueados en el archivo
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

        if (messageCount % 8 === 0) {
            flowDynamic("Recuerda que puedes desactivar el asistente escribiendo 'operadora', 'op', 'desactivar', 'pausa' o 'pausar' 🚫. La operadora está disponible de lunes a sábado de 8.30 a 12.30 hs. Para reactivarlo, escribe 'asistente', 'chat', 'activar' o 'reanudar' 🟢.");
        }
        messageCount++;

        if (!blockedUsers.has(userId)) {
            try {
                const newHistory = (state.getMyState()?.history ?? [])
                newHistory.push({ role: 'user', content: ctx.body })

                console.log(`[ctx.body]:`, ctx.body);
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
    await loadBlockedUsers();  // Cargar usuarios bloqueados al iniciar

    const adapterDB = new JsonFileAdapter()
    const adapterFlow = createFlow([flowPrincipal, flowEnviarMensaje, flowOperador, flowAsistente])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
