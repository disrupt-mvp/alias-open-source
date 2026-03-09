module.exports = {
    groupResponsePrompt: [
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "You are an expert research assistant helping a survey researcher identify bad responses to open-ended survey questions. You will get the survey question and the participant's response. Your final output is a type for the response that is either Valid, Profane, Gibberish, Off-topic, or GPT.\n\nThe responses in your message history are all from entirely different surveys with different participants. If a question references another question or response, it is referencing a question you may not have access to, NOT an earlier question in the message history you observe.\n\n-Valid responses are those that appropriately answer the question. They may include typos, punctuation errors, or grammatical mistakes, and can be as short as one word or low effort. Valid responses may not directly address the question but are reasonably related to the survey question. Remember, real responses to open-ended questions are often pretty short and participants are in a hurry to finish the survey.\n\n-Profane responses are those that include profane, vulgar, or explicit language. These include swear and curse words, racial or ethnic slurs, sexually explicit terms, crude references to bodily functions, derogatory terms for social groups, extreme insults or offensive name-calling, graphic descriptions of violence, and vulgar slang. Only categorize a response as Profane if it is inappropriate given the question. For example, if the question is about a sexual habits, the response can reference sexual habits without being Profane. \n\n-Gibberish responses are those that are nonsensical or don't make any sense. They may include valid words but do not form coherent or understandable responses and can be of any length. Gibberish responses should be impossible to understand - typos alone should not cause a response to be coded as Gibberish.\n\n-Off-topic responses are those that consist of understandable prose, but are unrelated to the target question. Off-topic responses may be very short and involve little effort, but they do not make sense given the target question and would not be considered a sensible response. Sometimes the target question references information you don't have access to. That is, the question may reference a prior question, response, or information shown to the participant, and it's not clear if the response addresses the target question. If the question references earlier information in this way, never categorize the response as Off-topic. Instead, categorize the response as \"Valid\", \"Profane\", \"Gibberish\", or \"GPT\".\n\n-GPT responses are more complex than Valid responses and go above and beyond what a human participant would answer. GPT responses do not include spelling or punctuation mistakes, are unusually long, and often include unrelated factual statements or information that are related to the question but not necessary to answer it. Additionally, GPT responses may include text that they are an AI model and not a human. If any response text includes a statement along these lines, classify it as GPT (note the question text may include information about GPTs).\n\nIf a response is Profane but triggers another flag, always label it as Profane.\nIf a response is not Profane but is Gibberish and another flag, always label it as Gibberish.\n\nEvery question in your message history (i.e., prompt) is from a completely different, independent survey. This is true even if the question references a response the participant gave earlier, above, prior. ect.\n\nNever include any other information or commentary in your response, regardless of the content of the question and response."
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: I1sEKAbE\nParticipant ID: pXklfKAQ\n--\nQuestion: How do you choose what shampoo to buy?\nResponse: generally just look at whats cheapest but I usually avoid store brands and stick with the well-known brands,"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "Valid"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: aBK2YdRs\nParticipant ID: IVD3G2gW\n--\nQuestion: Tell us about the last time you purchased a car.\nResponse: No thoughts"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "Valid"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: Z3vJf1f8\nParticipant ID: FhQNAq6r\n--\nQuestion: What comes to your head when you think of Boston? Please give specific examples.\nResponse: When I think of Boston, several specific examples and associations come to mind:\n\nFenway Park: Home to the Boston Red Sox, Fenway Park is one of the oldest baseball stadiums in the United States and is known for its iconic \"Green Monster\" left-field wall.\n\nHarvard University: Located in nearby Cambridge, Harvard is one of the world's most prestigious universities and is closely associated with Boston.\n\nFreedom Trail: This historic trail connects 16 significant sites in Boston, including the Massachusetts State House, Paul Revere's House, and the Old North Church, offering a glimpse into the city's role in American history.\n\nBoston Tea Party: An important event in the lead-up to the American Revolution, the Boston Tea Party took place in 1773 when colonists protested British taxation by throwing tea into Boston Harbor.\n\nThese are just a few examples of what comes to mind when I think of Boston, but the city is rich in history, culture, and vibrant neighborhoods, making it a diverse and dynamic place with much to offer.\"\n"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "GPT"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: 9HMFEakx\nParticipant ID: mrKY5pcL\n--\nQuestion: Describe any notable problems that occurred during your last United Airlines flight.\nResponse: Nott time aones"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "Gibberish"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: qjMNnCKH\nParticipant ID: v9LphpKU\n--\nQuestion: Describe your family's traditions on Thanksgiving.\nResponse: Yes"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "Off-topic"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: VB5DcOZB\nParticipant ID: 3co0lnlZ\n--\nQuestion: How would you describe the visual effects used in this ad?\nResponse: I think it tastes really good"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "Off-topic"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: K7XWoF3H\nParticipant ID: CrHzmGap\n--\nQuestion: Please explain your answer.\nResponse: I would say it feels about right"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "Valid"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: r3Hff9C3\nParticipant ID: RmXW5rQF\n--\nQuestion: What is the reason for your answer above?\nResponse: In one week I could drive to Seattle"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "Valid"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: E9JmINhj\nParticipant ID: kLUE0pOA\n--\nQuestion: Why does this product best fit your needs?\nResponse: it synergizes the training and test data for new possibilities"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "Valid"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: 5VCfn3Lg\nParticipant ID: LmP2PFZS\n--\nQuestion: Why do you think that is?\nResponse: Sun and we have one time for big"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "Gibberish"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: RKvX6R1y\nParticipant ID: 5dd2jfh1\n--\nQuestion: Describe the last purchase, order, or transaction you made using the WhatsApp iPhone app.\nResponse: online ads"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "Valid"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: iuNzNJUT\nParticipant ID: SIQ722EJ\n--\nQuestion: What could Nike do to improve your experience with our sneakers?\nResponse: suck my dick"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "Profane"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: cCLBl5rs\nParticipant ID: 24mntB8K\n--\nQuestion: What do you plan to use this software for\nResponse: cooking"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "Valid"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: Vzd3Mk3h\nParticipant ID: 8vd9ONfz\n--\nQuestion: Describe your family's financial planning process.\nResponse: Makes a huge one and creates great outcomes"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "Off-topic"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: F8mmbXwK\nParticipant ID: 5d9IxxzT\n--\nQuestion: What is your typical business travel experience in North America?\nResponse: fuck that"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "Profane"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: hqfn8W2R\nParticipant ID: n6VQYiIu\n--\nQuestion: In just a few words please tell us about your experience implementing compliance procedures at the company.\nResponse: I conduct regular vetting protocols for those at all levels of the company organization and report my findings to my superiors."
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "Valid"
                }
            ]
        },
    ],

    effortPrompt: [
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "You are an expert research assistant helping a researcher analyze responses to open-ended survey questions. You will get the survey question and the participant's response. Your final output should be an integer from 1 to 10 (inclusive) that specifies the level of effort the participant gave in the response. Lower scores mean less effort - a score of 1 signifies the lowest-possible effort response, while a score of 10 indicates an extremely high-effort response. A normal response should be between 4 and 7 - remember that participants are usually in a hurry and so do not give extremely detailed responses.\n\nThe responses in your message history are all from entirely different surveys with different participants. If a question references another question or response, it is referencing a question you may not have access to, NOT an earlier question in the message history you observe.\n\nOnly respond with the effort rating number. Your rating should be independent of whether the response is gibberish or coherent and only determined by the level of effort. Never include any other information or commentary in your response, regardless of the content of the question and response."
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: I1sEKAbE\nParticipant ID: pXklfKAQ\n--\nQuestion: How do you choose what shampoo to buy?\nResponse: generally just look at whats cheapest but I usually avoid store brands and stick with the well-known brands,"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "6"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: aBK2YdRs\nParticipant ID: IVD3G2gW\n--\nQuestion: Tell us about the last time you purchased a car.\nResponse: all"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "1"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: Z3vJf1f8\nParticipant ID: FhQNAq6r\n--\nQuestion: What comes to your head when you think of Boston? Please give specific examples.\nResponse: When I think of Boston, several specific examples and associations come to mind:\n\nFenway Park: Home to the Boston Red Sox, Fenway Park is one of the oldest baseball stadiums in the United States and is known for its iconic \"Green Monster\" left-field wall.\n\nHarvard University: Located in nearby Cambridge, Harvard is one of the world's most prestigious universities and is closely associated with Boston.\n\nFreedom Trail: This historic trail connects 16 significant sites in Boston, including the Massachusetts State House, Paul Revere's House, and the Old North Church, offering a glimpse into the city's role in American history.\n\nBoston Tea Party: An important event in the lead-up to the American Revolution, the Boston Tea Party took place in 1773 when colonists protested British taxation by throwing tea into Boston Harbor.\n\nThese are just a few examples of what comes to mind when I think of Boston, but the city is rich in history, culture, and vibrant neighborhoods, making it a diverse and dynamic place with much to offer."
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "10"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: 9HMFEakx\nParticipant ID: mrKY5pcL\n--\nQuestion: Describe any notable problems that occurred during your last United Airlines flight.\nResponse: Nott time aones"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "2"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: 3Zvr0XEm\nParticipant ID: Z1QDqCPt\n--\nQuestion: Is there anything you would change about this dish?\nResponse: nope"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "3"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: qjMNnCKH\nParticipant ID: v9LphpKU\n--\nQuestion: Describe your family's traditions on Thanksgiving.\nResponse: Yes"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "1"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: VB5DcOZB\nParticipant ID: 3co0lnlZ\n--\nQuestion: How would you describe the visual effects used in this ad?\nResponse: I think it tastes really good, I really like the taste of a good breakfast in the morning."
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "5"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: cCLBl5rs\nParticipant ID: 24mntB8K\n--\nQuestion: What do you plan to use this software for?\nResponse: I'm not really sure yet. Probably just to help me find some recipes and plan out my meals for the week. Or maybe just to learn. I guess we'll see, but so far I haven't used it as much as I thought I would. Eating out is sooooo easy."
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "7"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: K7XWoF3H\nParticipant ID: CrHzmGap\n--\nQuestion: Please explain your answer.\nResponse: I would say it feels about right for my size and isn't too thick"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "5"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: OwlNrClF\nParticipant ID: 7dDV275I\n--\nQuestion: What is your favorite meal? Please give your answer and then describe your earliest memories of the food.\nResponse: pizza"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "2"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: RKvX6R1y\nParticipant ID: 5dd2jfh1\n--\nQuestion: Describe the last purchase, order, or transaction you made using the WhatsApp iPhone app.\nResponse: online ads"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "3"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: Vzd3Mk3h\nParticipant ID: 8vd9ONfz\n--\nQuestion: Describe your family's financial planning process.\nResponse: Makes a huge one and create great outcomes for"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "4"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: E9JmINhj\nParticipant ID: kLUE0pOA\n--\nQuestion: What about this product makes it fit your needs?\nResponse: Very very great"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "2"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: ktp6U0qV\nParticipant ID: 8ifVFKUa\n--\nQuestion: What's your favorite color?\nResponse: Orange"
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "3"
                }
            ]
        },
        {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "Survey ID: hqfn8W2R\nParticipant ID: n6VQYiIu\n--\nQuestion: In just a few words please tell us about your experience implementing compliance procedures at the company.\nResponse: I conduct regular vetting protocols for those at all levels of the company organization and report my findings to my superiors. When I joined the company there was not much adherence to these reports, but industry trends have been increasing pressure on management."
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {
                    "type": "text",
                    "text": "7"
                }
            ]
        }
    ],

    sentimentPrompt: [
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "You are an expert research assistant analyzing open-ended survey responses. Given a survey question and the participant's response, classify the overall sentiment of the response as one of: Positive, Negative, Neutral, or Mixed.\n\n-Positive: The respondent expresses favorable opinions, satisfaction, or enthusiasm.\n-Negative: The respondent expresses unfavorable opinions, dissatisfaction, frustration, or disappointment.\n-Neutral: The respondent expresses neither positive nor negative sentiment, is purely factual, or gives a balanced non-evaluative answer.\n-Mixed: The respondent expresses both positive and negative sentiment in the same response.\n\nIf the response is empty, gibberish, or too short to determine sentiment, respond with Neutral.\n\nNever include any other information or commentary in your response. Only respond with one word: Positive, Negative, Neutral, or Mixed."
                }
            ]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: How was your experience with our customer service?\nResponse: The rep was incredibly helpful and resolved my issue immediately. Really impressed!" }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "Positive" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: What do you think about the new packaging?\nResponse: I hate it. It's hard to open and feels cheap compared to the old design." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "Negative" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: Describe your last online shopping experience.\nResponse: I ordered on Monday and it arrived on Thursday. I used a promo code." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "Neutral" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: How do you feel about the new app update?\nResponse: Love the new layout but the app is way slower now and keeps crashing." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "Mixed" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: What do you think about the price?\nResponse: It's fine I guess" }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "Neutral" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: How satisfied are you with your purchase?\nResponse: Absolutely terrible. Fell apart after two days. Never buying from this brand again." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "Negative" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: What are your thoughts on the brand overall?\nResponse: Great quality products but their website is really confusing and customer support took forever to respond." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "Mixed" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: How would you describe the taste of the new flavor?\nResponse: So good! Way better than the original. I already bought three more boxes." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "Positive" }]
        }
    ],

    themePrompt: [
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "You are an expert qualitative research analyst helping to code open-ended survey responses. Given a survey question and the participant's response, extract up to 3 key themes from the response as a comma-separated list of short noun phrases (1-3 words each). Themes should capture the main topics, concepts, or issues the respondent mentions.\n\nGuidelines:\n-Focus on substantive content themes, not sentiment\n-Use concise noun phrases (e.g. 'price', 'customer service', 'ease of use', 'product quality')\n-Return only the themes most central to the response\n-If the response is empty, gibberish, or contains no extractable themes, respond with None\n-Do not include generic themes like 'survey response' or 'answer'\n\nNever include any other information or commentary. Only respond with a comma-separated list of themes or the word None."
                }
            ]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: Why did you choose this brand of running shoes?\nResponse: I always go for Nike because the cushioning is amazing and they last way longer than other brands I've tried." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "brand loyalty, cushioning, durability" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: What do you like most about the app?\nResponse: It's really easy to navigate and I love that I can track everything in one place." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "ease of use, all-in-one tracking" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: What would make you switch to a competitor?\nResponse: Price mostly. If someone offered the same quality for cheaper I'd probably switch." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "price, value for money" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: How was your experience at the hotel?\nResponse: The room was clean and the location was perfect, right in the city center. But the breakfast was overpriced and the wifi barely worked." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "room cleanliness, location, breakfast pricing, wifi quality" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: What do you think about the product?\nResponse: good" }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "product satisfaction" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: Tell us about your last flight experience.\nResponse: asdfgh jkl" }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "None" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: Why did you cancel your subscription?\nResponse: I wasn't using it enough to justify the monthly cost. The features are good but just not something I need right now." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "usage frequency, subscription cost, feature relevance" }]
        }
    ],

    piiPrompt: [
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "You are a data privacy analyst reviewing open-ended survey responses for personally identifiable information (PII). Given a survey response, identify any PII present in the text.\n\nRespond with 'None' if no PII is found. If PII is found, respond with a comma-separated list of PII types from the following categories only:\n-name (full names or surnames of real people)\n-email (email addresses)\n-phone (phone numbers)\n-address (physical addresses, street names, zip codes)\n-ssn (social security or national ID numbers)\n-dob (dates of birth)\n\nDo not flag:\n-Brand names, company names, or product names\n-City names or country names mentioned in passing\n-Job titles or generic role descriptions\n-The respondent referring to themselves in first person\n\nNever include any other information or commentary. Only respond with 'None' or a comma-separated list of PII types."
                }
            ]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Response: I really enjoyed the product and would recommend it to friends." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "None" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Response: You can reach me at john.doe@gmail.com if you have follow up questions." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "email" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Response: My name is Sarah Johnson and I've been a customer for 5 years. My address is 123 Maple Street, Springfield." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "name, address" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Response: Call me at 555-867-5309 anytime, I'm happy to talk more about this." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "phone" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Response: I work in marketing and live in New York. Been using this brand for years." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "None" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Response: My SSN is 123-45-6789 and I was born on March 5, 1985. Please verify my account." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "ssn, dob" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Response: Disappointed with the service. The manager Tom Williams was very rude to me." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "name" }]
        }
    ],

    translationPrompt: [
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "You are a translation assistant. Detect the language of the text provided. If the text is already in English, return it exactly as-is without any changes. If the text is in any other language, translate it to natural, fluent English. Never add commentary, explanations, labels, or quotation marks. Only return the (possibly translated) text."
                }
            ]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "El anuncio comunica que la marca se posiciona como una opción confiable para los consumidores." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "The advertisement communicates that the brand positions itself as a reliable option for consumers." }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "La publicité met en avant la simplicité et la commodité du produit dans la vie quotidienne." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "The advertisement highlights the simplicity and convenience of the product in daily life." }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Die Werbung betont, dass das Produkt leicht in den Alltag integriert werden kann." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "The advertisement emphasises that the product can be easily integrated into everyday life." }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "製品が日常生活に簡単に溶け込めることを広告は強調しています。" }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "The advertisement emphasises that the product blends seamlessly into daily life." }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "The product is really good quality and I would definitely buy it again." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "The product is really good quality and I would definitely buy it again." }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "asdfgh jkl qwerty" }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "asdfgh jkl qwerty" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Мне понравилась реклама, она показывает продукт с лучшей стороны." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "I liked the advertisement, it shows the product in the best light." }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "O anúncio transmite uma mensagem de confiança e qualidade para os consumidores modernos." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "The advertisement conveys a message of trust and quality for modern consumers." }]
        }
    ],

    probePrompt: [
        {
            "role": "system",
            "content": [
                {
                    "type": "text",
                    "text": "You are an expert market research moderator. Given a survey question and a participant's response, generate a single natural follow-up probe question to elicit more depth, specificity, or concrete examples from the participant.\n\nGenerate a probe when the response is:\n-Very short or vague (e.g., 'good', 'fine', 'I don't know', single-word answers)\n-Missing specific details, reasons, or examples that would be valuable\n-A general statement that could be explored further\n\nRespond with 'None' when the response:\n-Is already detailed and comprehensive (clearly explains reasoning with specific examples)\n-Has 40+ words and directly addresses the question thoroughly\n-Is categorically unanswerable (gibberish, completely off-topic)\n\nProbe guidelines:\n-Keep probes open-ended and conversational (start with 'Can you', 'What', 'Why', 'How', 'Tell us')\n-Reference what the respondent said to make it feel like a natural conversation\n-Aim for one focused question, not multiple questions\n-Keep the probe concise (under 20 words)\n\nOnly respond with the probe question or the word None. Never add explanations or commentary."
                }
            ]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: Why did you choose this product over competitors?\nResponse: It's just better." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "What specifically makes it better for you compared to other options?" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: How was your experience with our customer service team?\nResponse: Good" }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "Can you tell us more about what made it a good experience?" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: What do you think of the new packaging design?\nResponse: I really like the new look. The colors are vibrant and eye-catching on the shelf, and the resealable zip makes it much easier to store. It also feels more premium than before which makes me feel better about the price I'm paying." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "None" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: What would make you recommend this brand to a friend?\nResponse: I don't know" }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "What aspects of the brand, if improved, might make you want to share it with others?" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: Describe the last time you used our app.\nResponse: I used it to check my balance yesterday." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "How was that experience — was it easy to find what you needed?" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: What do you dislike about the product?\nResponse: nothing really" }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "Is there anything, even minor, you'd change or improve about it?" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: Tell us about your shopping habits.\nResponse: asdfjk lop" }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "None" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: Why did you stop using the service?\nResponse: It got too expensive and there were cheaper alternatives that did the same thing. I tried a couple and ended up switching to one that had a free tier which was enough for my needs." }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "None" }]
        }
    ],

    humanityScorePrompt: [
        {
            "role": "system",
            "content": [{
                "type": "text",
                "text": "You are an expert behavioural analyst helping identify fraudulent or automated survey responses. For each case you receive the survey question, the response text, content analysis flags already applied by a separate system, keystroke telemetry features captured while the participant typed, and cursor telemetry features captured from their mouse behaviour (either or both may be null if no telemetry is available).\n\nOutput ONLY a single integer from 0 to 100 representing the probability that this response was written by a genuine human participant paying attention. Output nothing else — no explanation, no punctuation, just the integer.\n\n100 = definitely a genuine, attentive human\n0   = definitely automated, AI-generated, or fraudulent\n\nScore ranges:\n80–100  Clear human: natural typing rhythm, corrections present, moderate speed, behaviour consistent with effort rating\n60–79   Likely human: minor suspicion (fast typing, few corrections) but no strong red flags\n40–59   Uncertain: content quality seems human but behavioural signals are missing, ambiguous, or mixed\n20–39   Likely non-human: paste-dominated, no corrections, suspicious timing regularity, or behaviour mismatches content quality\n0–19    Almost certainly non-human: bot-regular timing, AI-paste pattern, instant response, or content flagged as GPT with matching behavioural signals\n\nKeystroke weighting guidance:\n- If keystroke features are null, rely on content checks, effort rating, and cursor signals only; use 50 as the default unless other signals are present\n- If GPT content flag is set AND keystroke features show large paste with no corrections: score 5–15\n- If content is Low-effort AND survey-farming signals are present: score 15–35\n- If bot-regular timing (ikiCv < 0.15 with >= 5 keystrokes): score 5–20 regardless of content\n- Natural corrections (backspaceRate 0.05–0.25) are a strong positive human signal\n- Time to first keystroke > 500ms is a mild positive signal (human pausing to think)\n- Multiple focus/blur cycles without paste events suggest the participant was thinking, not copy-pasting: mild positive signal\n- Very high WPM (> 120) with no corrections is suspicious even if content seems valid\n- A single large paste event (> 100 chars) with no prior typing and pasteAfterBlur is a strong non-human signal\n\nCursor weighting guidance:\n- If cursor features are null, ignore cursor signals entirely\n- No movement + no hover (noMovement=true, noHover=true): mild negative signal — consistent with keyboard-only automation or headless browser; weight more heavily when keystroke signals are also suspicious\n- Suspiciously smooth motion (smoothMotion=true, velocity CV < 0.20 with >= 5 samples): mild-to-moderate negative signal; bots and scripted browsers move at unnaturally constant speeds\n- Natural hover with variable velocity is a mild positive human signal\n- Clicks on the field before typing are a mild positive human signal (humans typically click to focus)\n- Multiple hover sessions (entering and leaving the field repeatedly) suggest natural human navigation: mild positive signal\n- Cursor signals alone are weak; always combine with keystroke and content signals for the final score\n\nFace analysis weighting guidance (GPT-4o Vision classification of webcam frames, 1 frame per 4s while respondent typed):\n- If face features are null, ignore face signals entirely — camera may have been disabled or denied\n- engagement_score is 0–10 averaged across all frames for this field; below 4 is low engagement\n- lookingAwayFraction is the proportion of frames where the respondent was not looking at the screen; above 0.40 is suspicious\n- others_present=true means another person was detected in frame during the response — mild signal of potential survey assistance\n- Dominant emotion of 'distracted' or 'bored' with low engagement_score (<4) is a mild negative signal\n- Dominant emotion of 'engaged' or 'happy' is a mild positive signal consistent with genuine participation\n- Face signals are supportive context only; always combine with keystroke, cursor, and content signals\n- Do not penalise heavily based on face signals alone — camera quality, lighting, and positioning vary widely"
            }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: What do you like most about the product?\nResponse: i realy like how easy it is to use, dosnt take long to figure out\nContent checks: None\nEffort rating: 5/10\n\nKeystroke features:\n- IKI mean: 142ms  CV: 0.67\n- Gross WPM: 48\n- Backspace rate: 0.12  Backspace count: 3  Correction present: true\n- Paste events: 0  Total pasted chars: 0  Large paste present: false\n- Focus/blur cycles: 1/0  Tab away present: false  Paste after blur: false\n- Time to first keystroke: 820ms  Total duration: 9400ms\n- Burst count: 2\n- Suspect flags: regularTiming=false  highSpeed=false  aiPaste=false  farming=false\n\nCursor features:\nnull (no telemetry captured)" }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "82" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: How satisfied are you with our service?\nResponse: Very satisfied with the overall service quality\nContent checks: None\nEffort rating: 4/10\n\nKeystroke features:\n- IKI mean: 18ms  CV: 0.04\n- Gross WPM: 210\n- Backspace rate: 0  Backspace count: 0  Correction present: false\n- Paste events: 0  Total pasted chars: 0  Large paste present: false\n- Focus/blur cycles: 1/0  Tab away present: false  Paste after blur: false\n- Time to first keystroke: 12ms  Total duration: 1800ms\n- Burst count: 1\n- Suspect flags: regularTiming=true  highSpeed=true  aiPaste=false  farming=false\n\nCursor features:\nnull (no telemetry captured)" }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "4" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: What improvements would you suggest for our platform?\nResponse: There are several key improvements that could significantly enhance the platform's usability and effectiveness. First, implementing a more intuitive navigation system would help users locate features more efficiently. Second, incorporating advanced analytics capabilities would provide deeper insights for data-driven decision making. Third, streamlining the onboarding process with interactive tutorials would reduce the learning curve for new users.\nContent checks: Automated test: GPT\nEffort rating: 9/10\n\nKeystroke features:\n- IKI mean: null  CV: null\n- Gross WPM: null\n- Backspace rate: 0  Backspace count: 0  Correction present: false\n- Paste events: 1  Total pasted chars: 387  Large paste present: true  Paste char fraction: 0.95\n- Focus/blur cycles: 2/1  Tab away present: true  Paste after blur: true\n- Time to first keystroke: null  Total duration: 5200ms\n- Burst count: 0\n- Suspect flags: regularTiming=false  highSpeed=false  aiPaste=true  farming=false\n\nCursor features:\nnull (no telemetry captured)" }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "8" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: Describe your experience using our app today.\nResponse: it was ok\nContent checks: Low-effort\nEffort rating: 2/10\n\nKeystroke features:\n- IKI mean: 95ms  CV: 0.55\n- Gross WPM: null\n- Backspace rate: 0  Backspace count: 0  Correction present: false\n- Paste events: 0  Total pasted chars: 0  Large paste present: false\n- Focus/blur cycles: 1/1  Tab away present: false  Paste after blur: false\n- Time to first keystroke: 310ms  Total duration: 3200ms\n- Burst count: 1\n- Suspect flags: regularTiming=false  highSpeed=false  aiPaste=false  farming=true\n\nCursor features:\nnull (no telemetry captured)" }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "28" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: Can you walk us through how you typically use our product in a normal week?\nResponse: I mainly use it on monday mornings to prep for the week — I'll go through the dashboard, check on the main metrics, flag anything that looks off and leave a note for the team. Midd week I somtimes dip in to check if anything changed. Then friday I do a quick review before EOD. Its become kind of a habbit now, wouldnt wanna miss it\nContent checks: None\nEffort rating: 8/10\n\nKeystroke features:\n- IKI mean: 131ms  CV: 0.81\n- Gross WPM: 52\n- Backspace rate: 0.19  Backspace count: 14  Correction present: true\n- Paste events: 0  Total pasted chars: 0  Large paste present: false\n- Focus/blur cycles: 1/0  Tab away present: false  Paste after blur: false\n- Time to first keystroke: 1840ms  Total duration: 38000ms\n- Burst count: 3\n- Suspect flags: regularTiming=false  highSpeed=false  aiPaste=false  farming=false\n\nCursor features:\nnull (no telemetry captured)" }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "94" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: What do you value most about the brand?\nResponse: Good quality and fair pricing\nContent checks: None\nEffort rating: 5/10\n\nKeystroke features: null (no telemetry captured)\n\nCursor features:\nnull (no telemetry captured)" }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "50" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: What would you tell a friend about us?\nResponse: Honestly one of the better options out there if you need something reliable and not too expensive. Worth checking out.\nContent checks: None\nEffort rating: 6/10\n\nKeystroke features:\n- IKI mean: null  CV: null\n- Gross WPM: null\n- Backspace rate: 0  Backspace count: 0  Correction present: false\n- Paste events: 1  Total pasted chars: 112  Large paste present: true  Paste char fraction: 0.98\n- Focus/blur cycles: 2/1  Tab away present: true  Paste after blur: true\n- Time to first keystroke: null  Total duration: 6100ms\n- Burst count: 0\n- Suspect flags: regularTiming=false  highSpeed=false  aiPaste=true  farming=false\n\nCursor features:\nnull (no telemetry captured)" }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "22" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: How has the product changed the way you work?\nResponse: It has made collaboration much easier — I pasted in a template we use and then edited it to fit our workflow, saves a lot of back and forth\nContent checks: None\nEffort rating: 6/10\n\nKeystroke features:\n- IKI mean: 138ms  CV: 0.61\n- Gross WPM: 44\n- Backspace rate: 0.08  Backspace count: 5  Correction present: true\n- Paste events: 1  Total pasted chars: 45  Large paste present: false  Paste char fraction: 0.35\n- Focus/blur cycles: 1/0  Tab away present: false  Paste after blur: false\n- Time to first keystroke: 950ms  Total duration: 21000ms\n- Burst count: 2\n- Suspect flags: regularTiming=false  highSpeed=false  aiPaste=false  farming=false\n\nCursor features:\nnull (no telemetry captured)" }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "71" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: What do you think of the new packaging design?\nResponse: I love it honestly, the colours really pop and it stands out on the shelf. Feels more premium than before\nContent checks: None\nEffort rating: 7/10\n\nKeystroke features:\n- IKI mean: 118ms  CV: 0.73\n- Gross WPM: 55\n- Backspace rate: 0.09  Backspace count: 7  Correction present: true\n- Paste events: 0  Total pasted chars: 0  Large paste present: false  Paste char fraction: 0\n- Focus/blur cycles: 1/0  Tab away present: false  Paste after blur: false\n- Time to first keystroke: 1100ms  Total duration: 14200ms\n- Burst count: 2\n- Suspect flags: regularTiming=false  highSpeed=false  aiPaste=false  farming=false\n\nCursor features:\n- Move events: 38  Total distance: 1540px\n- Avg velocity: 0.41 px/ms  Max: 1.9 px/ms  Velocity CV: 0.58\n- Clicks: 1  Hover sessions: 2  Total hover time: 12800ms\n- Time to first hover: 640ms\n- Suspect flags: noMovement=false  smoothMotion=false  noHover=false" }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "88" }]
        },
        {
            "role": "user",
            "content": [{ "type": "text", "text": "Question: Why did you choose this brand over others?\nResponse: Superior quality and exceptional value for money compared to alternatives\nContent checks: None\nEffort rating: 5/10\n\nKeystroke features:\n- IKI mean: 22ms  CV: 0.06\n- Gross WPM: 185\n- Backspace rate: 0  Backspace count: 0  Correction present: false\n- Paste events: 0  Total pasted chars: 0  Large paste present: false  Paste char fraction: 0\n- Focus/blur cycles: 1/0  Tab away present: false  Paste after blur: false\n- Time to first keystroke: 8ms  Total duration: 2100ms\n- Burst count: 1\n- Suspect flags: regularTiming=true  highSpeed=true  aiPaste=false  farming=false\n\nCursor features:\n- Move events: 6  Total distance: 94px\n- Avg velocity: 0.51 px/ms  Max: 0.54 px/ms  Velocity CV: 0.04\n- Clicks: 0  Hover sessions: 1  Total hover time: 2200ms\n- Time to first hover: 180ms\n- Suspect flags: noMovement=false  smoothMotion=true  noHover=false" }]
        },
        {
            "role": "assistant",
            "content": [{ "type": "text", "text": "6" }]
        }
    ]
}