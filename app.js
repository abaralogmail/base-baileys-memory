const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const JsonFileAdapter = require('@bot-whatsapp/database/json')
const run = require('./mensajes/logica')
const fs = require('fs').promises

let blockedUsers = new Set();
const BLOCKED_USERS_FILE = 'blocked_users.json';

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

// Función para manejar el bloqueo y desbloqueo de usuarios
const handleBlockUnblock = async (ctx, flowDynamic) => {
    const userId = ctx.from;
    if (ctx.body === '.') {
        blockedUsers.add(userId);
        await saveBlockedUsers();
        await flowDynamic('Has pausado el chat. Envía ".." para reanudar.');
        return true;
    } else if (ctx.body === '..') {
        blockedUsers.delete(userId);
        await saveBlockedUsers();
        await flowDynamic('Has reanudado el chat.');
        return true;
    }
    return false;
}

// Función para enviar chunks con delay
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

// Función principal para procesar mensajes
const processMessage = async (ctx, { flowDynamic, state }) => {
    const userId = ctx.from;

    if (await handleBlockUnblock(ctx, flowDynamic)) {
        return;
    }

    if (blockedUsers.has(userId)) {
        return;
    }

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

const flowPrincipal = addKeyword(EVENTS.WELCOME)
    .addAction(processMessage)

const main = async () => {
    await loadBlockedUsers();  // Cargar usuarios bloqueados al iniciar

    const adapterDB = new JsonFileAdapter()
    const adapterFlow = createFlow([flowPrincipal])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
