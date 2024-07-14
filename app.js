const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const JsonFileAdapter = require('@bot-whatsapp/database/json')
const run = require('./mensajes/logica')
const fs = require('fs').promises

let blockedUsers = new Set();
const BLOCKED_USERS_FILE = 'blocked_users.json';
let messageCount = 0;

const flowOperador = addKeyword(['operadora', 'op', 'desactivar', 'pausa', 'pausar'])
    .addAction(async (ctx, { flowDynamic }) => {
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
        flowDynamic("El asistente virtual ha sido reactivado 🟢. La operadora está disponible de lunes a viernes de 16hs a 20hs. Si necesitas desactivarlo, escribe 'operadora', 'op', 'desactivar', 'pausa' o 'pausar' 🚫.");
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
            flowDynamic("Recuerda que puedes desactivar el asistente escribiendo 'operadora', 'op', 'desactivar', 'pausa' o 'pausar' 🚫. La operadora está disponible de lunes a viernes de 16hs a 20hs. Para reactivarlo, escribe 'asistente', 'chat', 'activar' o 'reanudar' 🟢.");
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
                sendChunksWithDelay(chunks, 2000, userId, flowDynamic);

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
    const adapterFlow = createFlow([flowPrincipal, flowOperador, flowAsistente])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
