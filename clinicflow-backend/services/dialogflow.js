const { SessionsClient } = require('@google-cloud/dialogflow-cx');
const keys = require('../config/keys');

// Load credentials directly from the Render environment
const credentials = process.env.GOOGLE_CREDENTIALS_JSON
  ? JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON)
  : {
      client_email: keys.googleClientEmail,
      private_key: keys.googlePrivateKey.replace(/\\n/g, '\n'),
    };

const sessionClient = new SessionsClient({
  credentials,
  apiEndpoint: `${keys.dialogflowLocation}-dialogflow.googleapis.com`,
});

// turn Dialogflow CX params into plain JS
function flattenParams(structFields = {}) {
  const out = {};
  for (const [k, v] of Object.entries(structFields)) {
    if (!v) continue;
    if (v.stringValue !== undefined) out[k] = v.stringValue;
    else if (v.numberValue !== undefined) out[k] = v.numberValue;
    else if (v.boolValue !== undefined) out[k] = v.boolValue;
    else if (v.listValue?.values) {
      out[k] = v.listValue.values.map(
        (x) =>
          x.stringValue ??
          x.numberValue ??
          x.boolValue ??
          (x.structValue?.fields ? flattenParams(x.structValue.fields) : null)
      );
    } else if (v.structValue?.fields) {
      out[k] = flattenParams(v.structValue.fields);
    } else {
      out[k] = null;
    }
  }
  return out;
}

async function detectIntent(sessionId, query) {
  const sessionPath = sessionClient.projectLocationAgentSessionPath(
    keys.googleProjectID,
    keys.dialogflowLocation,
    keys.dialogflowAgentID,
    sessionId
  );

  const request = {
    session: sessionPath,
    queryInput: {
      text: { text: query },
      languageCode: 'en-US',
    },
  };

  const [response] = await sessionClient.detectIntent(request);
  const result = response.queryResult || {};

  const responseTexts = (result.responseMessages || [])
    .filter((m) => m?.text?.text?.length)
    .flatMap((m) => m.text.text);

  const pageName = result.currentPage?.displayName || '';
  const pageNameLc = pageName.toLowerCase();

  const byEndIntent = Boolean(result.match?.intent?.isEndInteraction);
  const byEndPage =
    pageNameLc === 'end flow' ||
    (result.currentPage?.name && result.currentPage.name.endsWith('/pages/-'));

  const mergedText = responseTexts.join(' ').toLowerCase();
  const byPhrase =
    mergedText.includes('please wait for the clinic staff') ||
    mergedText.includes('thank you for providing');

  const isEnd = byEndIntent || byEndPage || byPhrase;

  const parameters = flattenParams(result.parameters?.fields || {});

  return {
    response: responseTexts,
    isConversationEnd: isEnd,
    parameters,
    meta: {
      page: pageName || null,
      intent: result.match?.intent?.displayName || null,
      endFlags: { byEndIntent, byEndPage, byPhrase },
    },
  };
}

module.exports = { detectIntent };
