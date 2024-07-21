const XLSX = require('xlsx');
const { MessageMedia } = require('whatsapp-web.js');
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function sendBulkMessages(client, excelFilePath, message, mediaPath = null) {
    // Read Excel file
    const workbook = XLSX.readFile(excelFilePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const phoneNumbers = XLSX.utils.sheet_to_json(sheet, { header: 'A' }).map(row => row.A);

    let media = null;
    if (mediaPath) {
        media = await MessageMedia.fromFilePath(mediaPath);
    }

    for (let i = 0; i < phoneNumbers.length; i++) {
        const number = phoneNumbers[i];
        try {
            if (media) {
                await client.sendMessage(`${number}@c.us`, media, { caption: message });
            } else {
                await client.sendMessage(`${number}@c.us`, message);
            }
            console.log(`Message sent to ${number}`);

            // Delay between messages (e.g., 10 seconds)
            await delay(10000);

            // Take a break after every 10 messages
            if ((i + 1) % 10 === 0) {
                console.log('Taking a 5-minute break...');
                await delay(300000); // 5 minutes
            }
        } catch (error) {
            console.error(`Failed to send message to ${number}: ${error}`);
        }
    }
}

module.exports = sendBulkMessages;