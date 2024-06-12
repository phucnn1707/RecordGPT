const gptService = require('../services/gpt');

const Speech2Speech = async(req, res, next) => {
    const resSpeech = await gptService.Speech2Speech(req, res);
    return res.api(resSpeech);
};

const gptController = {
    Speech2Speech
};

module.exports = gptController;