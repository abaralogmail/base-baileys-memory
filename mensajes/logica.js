const { NotionWorkspaceAssistant } = require('./NotionWorkspaceAssistant');


async function query(data) {
    const response = await fetch(
        //Flowise - LLM Chain - Conversational Chain
        //        "http://localhost:3001/api/v1/prediction/df9d26ed-a9b3-4a7f-948d-812d5e57dd9d",
        //Flowise - MarIADono
        //"http://localhost:3001/api/v1/prediction/1acd8aeb-0679-41be-958b-08d87dc763cf",
        //MariaDono Conversational Retrieval QA Chain
        //    "http://localhost:3001/api/v1/prediction/9f84118b-4644-4c97-8740-75cf1d3de432",
        //Conversation Chat Prompt Template
        //        "http://localhost:3001/api/v1/prediction/a37d2bd6-0512-40d2-8721-f24d275e9e84",
        //Assistant
        "http://localhost:3001/api/v1/prediction/fa9be65b-215c-4136-afee-f4aa6ccdfa4f",
        {
            headers: {
                Authorization: "Bearer BIP/q4tf2Hlx4uZT3Ononiloe2pede6YS3cCfC61z/o=",
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify(data)
        }
    );
    const result = await response.json();
    return result;
}


async function analizarRespuesta(data) {
    const response = await fetch(
        //Flowise - LLM Chain - Conversational Chain
        //        "http://localhost:3001/api/v1/prediction/df9d26ed-a9b3-4a7f-948d-812d5e57dd9d",
        //Flowise - MarIADono
        //"http://localhost:3001/api/v1/prediction/1acd8aeb-0679-41be-958b-08d87dc763cf",
        //MariaDono Conversational Retrieval QA Chain
        //        "http://localhost:3001/api/v1/prediction/9f84118b-4644-4c97-8740-75cf1d3de432",
        //Analiza Respuesta        
        "http://localhost:3001/api/v1/prediction/f499de19-48a7-4938-98be-73972e487d30",

        {
            headers: {
                Authorization: "Bearer BIP/q4tf2Hlx4uZT3Ononiloe2pede6YS3cCfC61z/o=",
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify(data)
        }
    );
    const result = await response.json();
    return result;
}



const run = async (ctx, history) => {

    data = {
        "question": history[history.length - 1].content,
        //     "context": history,
        "overrideConfig": {
            "sessionId": ctx.from,
            "returnSourceDocuments": true
        }
    };
    console.log("chat_history:", history)
    /*
    const response = await analizarRespuesta({
        question: history[history.length - 1].content,
        chat_history: history
    });
    console.log(`[RESPONSE]:`,response.text);*/
    const queryResponse = await query(data);
    return queryResponse.text;
}

async function executeNotionAssistant(ctx) {
    const notionApiKey = process.env.NOTION_API_KEY;
    //https://www.notion.so/c57138e021dd478d8be823e453b0dc4d?v=fe84b86f3f0f439aa227afc385e6840c&pvs=4
    const databaseId = 'c57138e021dd478d8be823e453b0dc4d';
    
    const assistant = new NotionWorkspaceAssistant(notionApiKey, databaseId);

    const question = "¿Qué cursos están disponibles?";
    console.log(await assistant.answerQuestion(question));

    const scheduleQuestion = "¿Cuál es el horario del curso CUR-45?";
    console.log(await assistant.answerQuestion(scheduleQuestion));

    const priceQuestion = "¿Cuál es el precio del curso CUR-45?";
    console.log(await assistant.answerQuestion(priceQuestion));

    const requirementsQuestion = "¿Cuáles son los requisitos para el curso CUR-45?";
    console.log(await assistant.answerQuestion(requirementsQuestion));
}


module.exports = { run, executeNotionAssistant };



