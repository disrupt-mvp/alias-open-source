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

// Call OpenAI API (Vision) to classify emotion and engagement from a single webcam frame.
// frame_b64 is a base64-encoded JPEG string (no data URI prefix).
// Returns { emotion, looking_at_screen, others_present, engagement_score } or a safe default on failure.
const openAIAnalyzeFaceFrame = async (frame_b64) => {
    const messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "You are a behavioural analyst assessing a survey respondent via webcam. Analyse the face in this image and return ONLY valid JSON with no extra text:\n{\"emotion\":\"neutral|happy|confused|frustrated|bored|engaged|distracted\",\"looking_at_screen\":true,\"others_present\":false,\"engagement_score\":7}\nengagement_score is 0-10. If no face is visible return engagement_score 0, looking_at_screen false, emotion \"unknown\"."
                },
                {
                    "type": "image_url",
                    "image_url": {
                        "url": `data:image/jpeg;base64,${frame_b64}`,
                        "detail": "low"
                    }
                }
            ]
        }
    ];

    try {
        const response = await openai.chat.completions.create({
            model: config.openAIModel,
            messages,
            temperature: 0,
            max_tokens: 60,
            top_p: 1
        });
        const raw = response.choices[0].message.content.trim();
        // Strip markdown code fences if present
        const jsonStr = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim();
        return JSON.parse(jsonStr);
    } catch (err) {
        console.warn('[alias-face] openAIAnalyzeFaceFrame error:', err?.message);
        return { emotion: 'unknown', looking_at_screen: false, others_present: false, engagement_score: 0 };
    }
};

// Call OpenAI API to score human authenticity (0-100) using keystroke features + content checks
const openAIHumanityScore = async (question, userResponse, keystrokeFeatures, cursorFeatures, existingChecks, effortRating, faceFeatures = null) => {

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

    let faceStr;
    if (!faceFeatures) {
        faceStr = 'null (face analysis not enabled or camera denied)';
    } else {
        const f = faceFeatures;
        faceStr = [
            `- Samples: ${f.samples}  Dominant emotion: ${f.dominant}  Engagement score: ${f.engagement !== null ? f.engagement + '/10' : 'null'}`,
            `- Looking away fraction: ${f.lookingAwayFraction}  Others present: ${f.othersPresent}`,
            `- Emotion distribution: ${JSON.stringify(f.distribution)}`,
            `- Suspect flags: lowEngagement=${f.suspectLowEngagement}  frequentLookAway=${f.suspectFrequentLookAway}  othersPresent=${f.suspectOthersPresent}`,
        ].join('\n');
    }

    const userText = `Question: ${question}\nResponse: ${userResponse}\nContent checks: ${checksStr}\nEffort rating: ${effort}\n\nKeystroke features:\n${keystrokeStr}\n\nCursor features:\n${cursorStr}\n\nFace analysis:\n${faceStr}`;

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

module.exports = { openAIGroupResponse, openAIEffortCategorization, openAISentimentAnalysis, openAIThemeExtraction, openAIPIIDetection, openAIGenerateProbe, openAITranslate, openAIHumanityScore, openAIAnalyzeFaceFrame };
