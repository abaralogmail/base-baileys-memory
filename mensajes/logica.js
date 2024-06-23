//import { BotContext } from "@bot-whatsapp/bot";
//import('module').then(module => module);

async function query(data) {
    const response = await fetch(
        //Flowise - LLM Chain - Conversational Chain
        //        "http://localhost:3001/api/v1/prediction/df9d26ed-a9b3-4a7f-948d-812d5e57dd9d",
        //Flowise - MarIADono
        //"http://localhost:3001/api/v1/prediction/1acd8aeb-0679-41be-958b-08d87dc763cf",
        //MariaDono Conversational Retrieval QA Chain
        "http://localhost:3001/api/v1/prediction/df604ad1-e6a2-4a96-85cc-a9962d7d37c0",
        
        {
            headers: {
                Authorization: "Bearer RjE9WJ6byHrM5tnJ3KRT0REESsfsvGq9S5ZYt2jlovg=",
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify(data)
        }
    );
    const result = await response.json();
    return result;
}


async function analizarPreguna(data) {
    const response = await fetch(
        //Flowise - LLM Chain - Conversational Chain
        //        "http://localhost:3001/api/v1/prediction/df9d26ed-a9b3-4a7f-948d-812d5e57dd9d",
        //Flowise - MarIADono
        //"http://localhost:3001/api/v1/prediction/1acd8aeb-0679-41be-958b-08d87dc763cf",
        //MariaDono Conversational Retrieval QA Chain
//        "http://localhost:3001/api/v1/prediction/df604ad1-e6a2-4a96-85cc-a9962d7d37c0",
        //Analiza Preguna        
        "http://localhost:3001/api/v1/prediction/f499de19-48a7-4938-98be-73972e487d30",

        {
            headers: {
                Authorization: "Bearer RjE9WJ6byHrM5tnJ3KRT0REESsfsvGq9S5ZYt2jlovg=",
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify(data)
        }
    );
    const result = await response.json();
    return result;
}



const run =  async (ctx, history) => {
    
    data = {
        "question": history[history.length - 1].content,
        "context": history,
        "overrideConfig": {
            "sessionId": ctx.from,
            "returnSourceDocuments": true
        }
    };

    /*
    const response = await analizarPreguna({
        question: history[history.length - 1].content,
        chat_history: history
    });

    console.log(`[RESPONSE]:`,response.text);*/

    const queryResponse = await query(data);
    
        return queryResponse.text;
    }


    


module.exports = run;