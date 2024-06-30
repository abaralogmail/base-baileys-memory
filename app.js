const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')
const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/json')
const run = require('./mensajes/logica')

// Set para almacenar los usuarios bloqueados
const blockedUsers = new Set();

// Función para manejar el bloqueo y desbloqueo de usuarios
const handleBlockUnblock = async (ctx, flowDynamic) => {
    const userId = ctx.from;
    if (ctx.body === '.') {
        blockedUsers.add(userId);
        await flowDynamic('Chat detenido. Envía ".." para reanudar.');
        return true;
    } else if (ctx.body === '..') {
        blockedUsers.delete(userId);
        await flowDynamic('Chat reanudado.');
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
    const adapterDB = new MockAdapter()
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
