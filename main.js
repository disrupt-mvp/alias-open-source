const he = require('he');
const { levenshteinDistance, longestCommonSubstring } = require('./helpers/string-utils');
const { openAIGroupResponse, openAIEffortCategorization, openAISentimentAnalysis, openAIThemeExtraction, openAIPIIDetection, openAIGenerateProbe } = require('./helpers/openai-utils');
const { checkForCrossDuplicateResponses, checkIfMatch } = require('./helpers/cross-duplicate-utils');
const { isJsonString, parseQueryString, parseJSON } = require('./helpers/json-utils');
const config = require('./config');

// -- -- --
// Script starts here
// -- -- --

// Remove HTML tags from a string
function convertHTMLEntities(html) {
  // Ensure we always pass a string to he.decode (it calls .replace internally)
  return he.decode(String(html ?? ""));
}

// Remove special characters from a string
const cleanFinalStateString = (str) => {
    return str.toString().toLowerCase().replace(/\n/g, ' ').replace(/[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g, '');
}

// Check for self-duplicate responses
const checkForSelfDuplicateResponses = (obj) => {
    let keys = Object.keys(obj);
    const duplicatedResponsesDict = {};
    keys.forEach(key => {
        duplicatedResponsesDict[key] = false;
    });
    for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
            let key1 = keys[i];
            let key2 = keys[j];
            const maxStringLength = Math.max(obj[key1].length, obj[key2].length);
            if (maxStringLength === 0) continue;
            let s1 = obj[key1];
            let s2 = obj[key2];
            const rlev = levenshteinDistance(s1, s2);
            const nlev = rlev / maxStringLength;
            const rlcs = longestCommonSubstring(s1, s2);
            const nlcs = rlcs / maxStringLength;
            const match = checkIfMatch(s1, s2, nlev, rlev, nlcs, rlcs);
            if (match) {
                duplicatedResponsesDict[key1] = true;
                duplicatedResponsesDict[key2] = true;
            }
        }
    }
    return duplicatedResponsesDict;
}

// Check if two objects have the same keys
const haveSameKeys = (...args) => {
    let allKeys = args.map(obj => Object.keys(obj).sort().join(','));

    for (let i = 1; i < allKeys.length; i++) {
        if (allKeys[i] !== allKeys[0]) {
            return false;
        }
    }
    return true;
}

exports.handler = async function (event, context) {

    // Set CORS headers
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    let errorText = '';
    let problemParsingResponse = false;

    const api = async () => {

        let isValidQueryString;
        try {
            parseQueryString(event.body);
            isValidQueryString = true;
        } catch (error) {
            isValidQueryString = false;
        }

        const isValidJSON = isJsonString(event.body);

        if (!isValidJSON && !isValidQueryString) {
            errorText = `Must pass a serialized JSON object or a query string`;
            throw new Error(errorText);
        }

        // Determine which parsing function to use (decipher uses query strings)
        const parsingFunction = isValidJSON ? parseJSON : parseQueryString;

        // Parse the body
        problemParsingResponse = true;
        let { questions, survey_id, participant_id, responses, low_effort_threshold, include_sentiment, include_themes, include_pii, include_probes } = parsingFunction(event.body);
        const lowEffortThreshold = low_effort_threshold || 0;
        problemParsingResponse = false;

        // If any of these are undefined, raise error
        const missing = Object.entries({ questions, survey_id, participant_id, responses })
            .filter(([, v]) => v == null)          // catches undefined or null
            .map(([k]) => k);
        if (missing.length) throw new Error(`Missing ${missing.join(', ')}`);

        // If type of questions or is not object, raise error
        const nonObjects = Object.entries({ questions, responses })
            .filter(([, v]) => v === null || typeof v !== 'object')
            .map(([k]) => k);
        if (nonObjects.length) {
            throw new Error(`The following fields must be objects: ${nonObjects.join(', ')}`);
        }

        // If survey_id or participant_id are not strings, raise error
        const badStrings = Object.entries({ survey_id, participant_id })
            .filter(([, v]) => typeof v !== 'string')
            .map(([k]) => k);
        if (badStrings.length) {
            throw new Error(`The following fields must be strings: ${badStrings.join(', ')}`);
        }

        // Make sure keys of questions and responses are the same
        if (haveSameKeys(questions, responses) === false) {
            errorText = 'Questions and responses must have the same keys';
            throw new Error(errorText);
        }

        // Clean responses with convertHTMLEntities
        Object.keys(responses).forEach(id => {
            responses[id] = convertHTMLEntities(responses[id]);
        });

        // Clean the responses for duplicate matching
        const cleanedResponses = {};
        Object.keys(responses).forEach(id => {
            cleanedResponses[id] = cleanFinalStateString(responses[id]);
        });

        // Start duplication promise
        const duplicateResponsePromise = checkForCrossDuplicateResponses(cleanedResponses, survey_id);

        // Start categorization but do not wait for it to complete
        const uniqueIds = Object.keys(questions);
        const categorizationPromises = uniqueIds.map(id => {
            return openAIGroupResponse(questions[id], responses[id]).then(({ result }) => { return { id, result }} );
        });
        const lowEffortPromises = uniqueIds.map(id => {
            return openAIEffortCategorization(questions[id], responses[id]).then(({ result }) => { return { id, result }} );
        });

        // Optional QA feature promises (only launched if requested)
        const sentimentPromises = include_sentiment ? uniqueIds.map(id => {
            return openAISentimentAnalysis(questions[id], responses[id]).then(({ result }) => ({ id, result }));
        }) : [];

        const themePromises = include_themes ? uniqueIds.map(id => {
            return openAIThemeExtraction(questions[id], responses[id]).then(({ result }) => ({ id, result }));
        }) : [];

        const piiPromises = include_pii ? uniqueIds.map(id => {
            return openAIPIIDetection(questions[id], responses[id]).then(({ result }) => ({ id, result }));
        }) : [];

        const probePromises = include_probes ? uniqueIds.map(id => {
            return openAIGenerateProbe(questions[id], responses[id]).then(({ result }) => ({ id, result }));
        }) : [];

        const selfDuplicateResponses = checkForSelfDuplicateResponses(cleanedResponses);

        // Wait for duplication results from duplicatedResponsesPromise
        const { duplicateResponses, responseGroups } = await duplicateResponsePromise;

        // Wait for all AI results in parallel
        const [openAIResults, lowEffortResults, sentimentResults, themeResults, piiResults, probeResults] = await Promise.all([
            Promise.all(categorizationPromises),
            Promise.all(lowEffortPromises),
            Promise.all(sentimentPromises),
            Promise.all(themePromises),
            Promise.all(piiPromises),
            Promise.all(probePromises),
        ]);

        // Initialize checks, effort ratings and categorization results
        const checks = {};
        uniqueIds.forEach(id => { checks[id] = [] });
        const effortRatings = {};
        const failureTypes = ["Profane", "Off-topic", 'Gibberish', 'GPT'];

        // Loop through the results and categorize them
        Object.keys(questions).forEach(id => {
            // -- OpenAI categorizations --
            const openAIResult = openAIResults.find(result => result.id === id);
            // Make sure result exists and is string
            if (openAIResult && typeof openAIResult.result === 'string') {
                const lowerCaseResult = openAIResult.result.toLowerCase();
                if (failureTypes.includes(lowerCaseResult)) {
                    // Add punctuation
                    let cleanedResultWithCapitalization = lowerCaseResult.charAt(0).toUpperCase() + lowerCaseResult.slice(1);
                    // If gpt, capitalize every character
                    if (cleanedResultWithCapitalization === 'Gpt') cleanedResultWithCapitalization = cleanedResultWithCapitalization.toUpperCase();
                    checks[id].push(`Automated test: ${cleanedResultWithCapitalization}`);
                }
            }

            // -- Effort ratings --
            const effortResult = lowEffortResults.find(result => result.id === id);
            if (effortResult) {
                if (parseInt(effortResult.result) <= lowEffortThreshold) {
                    if (responses[id].length > 0) checks[id].push('Low-effort');
                }
                effortRatings[id] = parseInt(effortResult.result);
            } else {
                effortRatings[id] = 0;
            };

            // -- PII check (add to checks array if PII is detected) --
            if (include_pii) {
                const piiResult = piiResults.find(result => result.id === id);
                if (piiResult && typeof piiResult.result === 'string' && piiResult.result.toLowerCase() !== 'none') {
                    checks[id].push('Contains PII');
                }
            }
        });

        // Add cross duplicate response to checks
        Object.keys(duplicateResponses).forEach(id => {
            if (typeof responses[id] !== 'string' || responses[id].length < 20) return;
            if (duplicateResponses[id].length > 0) checks[id].push('Cross-duplicate response');
        });

        // Add self duplicate response to checks
        Object.keys(selfDuplicateResponses).forEach(id => {
            if (typeof responses[id] !== 'string') return;
            if (selfDuplicateResponses[id]) checks[id].push('Self-duplicate response');
        });

        // Build optional result maps
        const sentimentRatings = include_sentiment ? Object.fromEntries(
            sentimentResults.map(({ id, result }) => [id, result])
        ) : undefined;

        const themes = include_themes ? Object.fromEntries(
            themeResults.map(({ id, result }) => {
                const cleaned = result && result.toLowerCase() !== 'none' ? result.split(',').map(t => t.trim()).filter(Boolean) : [];
                return [id, cleaned];
            })
        ) : undefined;

        const piiFlags = include_pii ? Object.fromEntries(
            piiResults.map(({ id, result }) => {
                const types = result && result.toLowerCase() !== 'none' ? result.split(',').map(t => t.trim()).filter(Boolean) : [];
                return [id, types];
            })
        ) : undefined;

        const followupProbes = include_probes ? Object.fromEntries(
            probeResults.map(({ id, result }) => {
                const probe = result && result.toLowerCase() !== 'none' ? result : null;
                return [id, probe];
            })
        ) : undefined;

        const returnBody = {
            error: false,
            checks,
            response_groups: responseGroups,
            effort_ratings: effortRatings,
            ...(sentimentRatings !== undefined && { sentiment_ratings: sentimentRatings }),
            ...(themes !== undefined && { themes }),
            ...(piiFlags !== undefined && { pii_flags: piiFlags }),
            ...(followupProbes !== undefined && { followup_probes: followupProbes }),
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(returnBody),
        }
    };

    const requestTimedOutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            errorText = 'Request timed out';
            reject(new Error(errorText));
        }, config.TIMEOUT_MS);
    });

    const mainLogicPromise = api();

    return Promise.race([mainLogicPromise, requestTimedOutPromise])
        .catch(error => {
            console.error(error);
            const errorTextForReturn = errorText === '' ? problemParsingResponse ? 'Problem parsing request body' : "An unknown error occured" : errorText;
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    error: true,
                    problem: errorTextForReturn,
                })
            }
        });
}
