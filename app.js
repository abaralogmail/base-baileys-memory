const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/json')

const run = require('./mensajes/logica')


const flowWelcome = addKeyword(EVENTS.WELCOME)
    .addAnswer('🙌 Hola bienvenido a este *Chatbot*')

//.addAction(async (ctx, { flowDynamic, state }) => {
/*    .addAnswer('hola',async (ctx, { flowDynamic, state }) => {
    try{
        const newHistory = (state.getMyState()?.history ?? [])
        const name = ctx?.pushName ?? ''

        newHistory.push({
            role: 'user',
            content: ctx.body
        })
const largeResponse = await run(ctx, newHistory)
     //   console.log(`[RESPONSE]:`,largeResponse);
        const chunks = largeResponse.split(/(?<!\d)\.\s+/g);
        for (const chunk of chunks) {
            await flowDynamic(chunk)
        }

        newHistory.push({
            role: 'assistant',
            content: largeResponse
        })
    
        await state.update({history: newHistory})

    }catch(err){
        console.log(`[ERROR]:`,err)
    }
})*/


const flowPrincipal = addKeyword(EVENTS.WELCOME)
 //   .addAnswer('🙌 Hola bienvenido a este *Chatbot*')
    .addAction(async (ctx, { flowDynamic, state }) => {
        try {
            const newHistory = (state.getMyState()?.history ?? [])
            const name = ctx?.pushName ?? ''

            newHistory.push({
                role: 'user',
                content: ctx.body
            })
            const largeResponse = await run(ctx, newHistory)
            //   console.log(`[RESPONSE]:`,largeResponse);
            const chunks = largeResponse.split(/(?<!\d)\.\s+/g);
            for (const chunk of chunks) {
                await flowDynamic(chunk)
            }

            newHistory.push({
                role: 'assistant',
                content: largeResponse
            })

            await state.update({ history: newHistory })

        } catch (err) {
            console.log(`[ERROR]:`, err)
        }
    })

    


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
