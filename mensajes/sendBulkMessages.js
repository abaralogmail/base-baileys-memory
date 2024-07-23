const XLSX = require('xlsx');
//const { delay } = require('./utils');
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


async function sendBulkMessages(excelFilePath, provider) {
//    const excelFilePath = "./mensajes/Conexion - sendBulkMessages.xlsx"
    const workbook = XLSX.readFile(excelFilePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (row.enviar === 'true') {
            try {
  //              await provider.sendText(row.telefono, row.mensaje);
              await provider.sendText(`${row.telefono}@c.us`, row.mensaje);

                console.log(`Message sent to ${row.telefono}`);
                
                // Delay between messages (e.g., 5 seconds)
                await delay(5000);

                // Take a break every 10 messages
                if ((i + 1) % 10 === 0) {
                    console.log('Taking a break...');
                    await delay(60000); // 1 minute break
                }
            } catch (error) {
                console.error(`Failed to send message to ${row.telefono}:`, error);
            }
        }
    }
}

module.exports = sendBulkMessages;
