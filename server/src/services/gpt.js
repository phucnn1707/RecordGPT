const fs = require('fs');
const OpenAI = require('openai');
const path = require('path');

require('dotenv').config({ path: '.env.example' });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const speechFile = path.join(__dirname, '../../storage/tmp', 'Response.mp3');

exports.Speech2Speech = async(req, res) => {
    try {
        let filePath = req.file.path;

        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: 'whisper-1'
        });

        console.log(transcription.text);

        const translationPrompt = `Translate the following text to English:\n\n"${transcription.text}"`;

        const translationResponse = await openai.chat.completions.create({
            messages: [{ role: 'user', content: translationPrompt }],
            model: 'gpt-3.5-turbo'
        });

        const translation = translationResponse.choices[0].message.content;

        const response = await openai.chat.completions.create({
            messages: [{ role: 'user', content: translation }],
            model: 'gpt-3.5-turbo'
        });

        console.log(response.choices[0].message.content);

        const mp3 = await openai.audio.speech.create({
            model: 'tts-1',
            voice: 'nova',
            input: response.choices[0].message.content
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        await fs.promises.writeFile(speechFile, buffer);

        const base64Data = buffer.toString('base64');

        return {
            transcription: transcription.text,
            response: response.choices[0].message.content,
            chatgptAudio: base64Data
        };
    } catch (error) {
        console.error('Error during transcription:', error);
        res.status(500).json({ error: 'Transcription failed' });
    }
};