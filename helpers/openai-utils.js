const OpenAI = require("openai");
const { groupResponsePrompt, effortPrompt, sentimentPrompt, themePrompt, piiPrompt, probePrompt, translationPrompt, humanityScorePrompt } = require('./prompts');
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

// Call OpenAI API to score human authenticity (0-100) using keystroke features + content checks
const openAIHumanityScore = async (question, userResponse, keystrokeFeatures, cursorFeatures, existingChecks, effortRating) => {

    if (userResponse === '') return { result: '50' };

    const checksStr = (existingChecks && existingChecks.length) ? existingChecks.join(', ') : 'None';
    const effort = effortRating !== undefined && effortRating !== null ? `${effortRating}/10` : 'N/A';

    let keystrokeStr;
    if (!keystrokeFeatures) {
        keystrokeStr = 'null (no telemetry captured)';
    } else {
        const f = keystrokeFeatures;
        keystrokeStr = [
            `- IKI mean: ${f.ikiMean !== null ? f.ikiMean + 'ms' : 'null'}  CV: ${f.ikiCv !== null ? f.ikiCv : 'null'}`,
            `- Gross WPM: ${f.grossWpm !== null ? f.grossWpm : 'null'}`,
            `- Backspace rate: ${f.backspaceRate}  Backspace count: ${f.backspaceCount}  Correction present: ${f.correctionPresent}`,
            `- Paste events: ${f.pasteCount}  Total pasted chars: ${f.pasteCharTotal}  Large paste present: ${f.largePastePresent}  Paste char fraction: ${f.pasteCharFraction}`,
            `- Focus/blur cycles: ${f.focusCount}/${f.blurCount}  Tab away present: ${f.tabAwayPresent}  Paste after blur: ${f.pasteAfterBlur}`,
            `- Time to first keystroke: ${f.timeToFirstKeystroke !== null ? f.timeToFirstKeystroke + 'ms' : 'null'}  Total duration: ${f.totalDurationMs}ms`,
            `- Burst count: ${f.burstCount}`,
            `- Suspect flags: regularTiming=${f.suspectRegularTiming}  highSpeed=${f.suspectHighSpeed}  aiPaste=${f.suspectAIPaste}  farming=${f.suspectSurveyFarming}`,
        ].join('\n');
    }

    let cursorStr;
    if (!cursorFeatures) {
        cursorStr = 'null (no telemetry captured)';
    } else {
        const c = cursorFeatures;
        cursorStr = [
            `- Move events: ${c.totalMoveEvents}  Total distance: ${c.totalDistancePx}px`,
            `- Avg velocity: ${c.avgVelocityPxMs !== null ? c.avgVelocityPxMs + ' px/ms' : 'null'}  Max: ${c.maxVelocityPxMs !== null ? c.maxVelocityPxMs + ' px/ms' : 'null'}  Velocity CV: ${c.velocityCv !== null ? c.velocityCv : 'null'}`,
            `- Clicks: ${c.clickCount}  Hover sessions: ${c.hoverSessions}  Total hover time: ${c.totalHoverMs}ms`,
            `- Time to first hover: ${c.timeToFirstEnterMs !== null ? c.timeToFirstEnterMs + 'ms' : 'null'}`,
            `- Suspect flags: noMovement=${c.suspectNoMovement}  smoothMotion=${c.suspectSmoothMotion}  noHover=${c.suspectNoHover}`,
        ].join('\n');
    }

    const userText = `Question: ${question}\nResponse: ${userResponse}\nContent checks: ${checksStr}\nEffort rating: ${effort}\n\nKeystroke features:\n${keystrokeStr}\n\nCursor features:\n${cursorStr}`;

    const messages = [
        ...humanityScorePrompt,
        {
            "role": "user",
            "content": [{ "type": "text", "text": userText }]
        }
    ];

    const response = await callOpenAI(messages, 5);
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

module.exports = { openAIGroupResponse, openAIEffortCategorization, openAISentimentAnalysis, openAIThemeExtraction, openAIPIIDetection, openAIGenerateProbe, openAITranslate, openAIHumanityScore };
