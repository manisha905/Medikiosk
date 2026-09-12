const axios = require('axios');

const ULCA_USER_ID = process.env.ULCA_USER_ID || '';
const ULCA_API_KEY = process.env.ULCA_API_KEY || '';
const PIPELINE_ID = process.env.BHASHINI_PIPELINE_ID || '64392f96daac500b55c543cd';

const CONFIG_URL = 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline';

const configCache = {};

class BhashiniError extends Error {}

async function getTtsConfig(language, gender = 'female') {
  const cacheKey = `${language}:${gender}`;
  if (configCache[cacheKey]) return configCache[cacheKey];

  if (!ULCA_USER_ID || !ULCA_API_KEY) {
    throw new BhashiniError('Set ULCA_USER_ID and ULCA_API_KEY env vars first.');
  }

  const body = {
    pipelineTasks: [
      {
        taskType: 'tts',
        config: { language: { sourceLanguage: language }, gender },
      },
    ],
    pipelineRequestConfig: { pipelineId: PIPELINE_ID },
  };

  const headers = {
    userID: ULCA_USER_ID,
    ulcaApiKey: ULCA_API_KEY,
    'Content-Type': 'application/json',
  };

  let resp;
  try {
    resp = await axios.post(CONFIG_URL, body, { headers, timeout: 15000 });
  } catch (err) {
    throw new BhashiniError(`Bhashini config call failed: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
  }

  const data = resp.data;
  const config = {
    serviceId: data.pipelineResponseConfig[0].config[0].serviceId,
    callbackUrl: data.pipelineInferenceAPIEndPoint.callbackUrl,
    apiKeyName: data.pipelineInferenceAPIEndPoint.inferenceApiKey.name,
    apiKeyValue: data.pipelineInferenceAPIEndPoint.inferenceApiKey.value,
  };

  configCache[cacheKey] = config;
  return config;
}

/**
 * Convert text to speech via Bhashini.
 * @param {string} text - text to speak (should be in `language`).
 * @param {string} language - ISO-ish Bhashini language code, e.g. 'hi', 'te', 'en'.
 * @param {string} gender - 'male' | 'female'.
 * @returns {Promise<string>} base64-encoded audio (WAV) content.
 */
async function synthesize(text, language = 'en', gender = 'female') {
  const config = await getTtsConfig(language, gender);

  const body = {
    pipelineTasks: [
      {
        taskType: 'tts',
        config: {
          language: { sourceLanguage: language },
          serviceId: config.serviceId,
          gender,
          samplingRate: 8000,
        },
      },
    ],
    inputData: {
      input: [{ source: text }],
    },
  };

  const headers = {
    [config.apiKeyName]: config.apiKeyValue,
    'Content-Type': 'application/json',
  };

  let resp;
  try {
    resp = await axios.post(config.callbackUrl, body, { headers, timeout: 30000 });
  } catch (err) {
    throw new BhashiniError(`Bhashini TTS call failed: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
  }

  // audioContent is base64 WAV — hand this straight to the frontend/audio player.
  return resp.data.pipelineResponse[0].audio[0].audioContent;
}

module.exports = { synthesize, BhashiniError };