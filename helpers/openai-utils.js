const OpenAI = require("openai");
const { groupResponsePrompt, effortPrompt, sentimentPrompt, themePrompt, piiPrompt, probePrompt, translationPrompt } = require('./prompts');
const config = require('../config');

// OpenAI setup
const openai = new OpenAI({ apiKey: process.env.API_SECRET.replace("Bearer ", "") });

// Call OpenAI API to categorize the response
const openAIGroupResponse = async (question, userResponse) => {

    if (userResponse === '') return { result: 'Valid' };

    const messages = [
        ...groupResponsePrompt,
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": `Survey ID: sxRGirIK\nParticipant ID: F6nDnJLE\n--\nQuestion: ${question}\nResponse: ${userResponse}`
                }
            ]
        }
    ];

    const response = await callOpenAI(messages);
    return response;
}


// Call OpenAI API to assign an effort score
const openAIEffortCategorization = async (question, userResponse) => {

    if (userResponse === '') return { result: '0' };

    const messages = [
        ...effortPrompt,
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": `Survey ID: sxRGirIK\nParticipant ID: F6nDnJLE\n--\nQuestion: ${question}\nResponse: ${userResponse}`
                }
            ]
        },
    ];

    const response = await callOpenAI(messages);
    return response;

}

// Call OpenAI API to classify sentiment (Positive, Negative, Neutral, Mixed)
const openAISentimentAnalysis = async (question, userResponse) => {

    if (userResponse === '') return { result: 'Neutral' };

    const messages = [
        ...sentimentPrompt,
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": `Question: ${question}\nResponse: ${userResponse}`
                }
            ]
        }
    ];

    const response = await callOpenAI(messages, 10);
    return response;
}

// Call OpenAI API to extract key themes (comma-separated noun phrases)
const openAIThemeExtraction = async (question, userResponse) => {

    if (userResponse === '') return { result: 'None' };

    const messages = [
        ...themePrompt,
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": `Question: ${question}\nResponse: ${userResponse}`
                }
            ]
        }
    ];

    const response = await callOpenAI(messages, 60);
    return response;
}

// Call OpenAI API to detect PII (None or comma-separated PII types)
const openAIPIIDetection = async (question, userResponse) => {

    if (userResponse === '') return { result: 'None' };

    const messages = [
        ...piiPrompt,
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": `Response: ${userResponse}`
                }
            ]
        }
    ];

    const response = await callOpenAI(messages, 30);
    return response;
}

// Call OpenAI API to generate a follow-up probe question
const openAIGenerateProbe = async (question, userResponse) => {

    if (userResponse === '') return { result: 'None' };

    const messages = [
        ...probePrompt,
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": `Question: ${question}\nResponse: ${userResponse}`
                }
            ]
        }
    ];

    const response = await callOpenAI(messages, 150);
    return response;
}

// Call OpenAI API to detect language and translate to English (returns text unchanged if already English)
const openAITranslate = async (userResponse) => {

    if (userResponse === '') return { result: '' };

    const messages = [
        ...translationPrompt,
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": userResponse
                }
            ]
        }
    ];

    const response = await callOpenAI(messages, 500);
    return response;
}

// Call the OpenAI API
const callOpenAI = async (messages, maxTokens = 10) => {

    const response = await openai.chat.completions.create({
        model: config.openAIModel,
        messages,
        temperature: 0,
        max_tokens: maxTokens,
        top_p: 1
    });

    const content = response.choices[0].message.content.trim();
    return { result: content };
};

module.exports = { openAIGroupResponse, openAIEffortCategorization, openAISentimentAnalysis, openAIThemeExtraction, openAIPIIDetection, openAIGenerateProbe, openAITranslate };
