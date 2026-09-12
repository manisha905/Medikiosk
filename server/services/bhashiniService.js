const axios = require('axios');

const ULCA_USER_ID = process.env.ULCA_USER_ID || '';
const ULCA_API_KEY = process.env.ULCA_API_KEY || '';
const PIPELINE_ID = process.env.BHASHINI_PIPELINE_ID || '64392f96daac500b55c543cd';

const CONFIG_URL = 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline';

const configCache = {};

class BhashiniError extends Error {}

async function getAsrConfig(language) {
  if (configCache[language]) return configCache[language];

  if (!ULCA_USER_ID || !ULCA_API_KEY) {
    throw new BhashiniError('Set ULCA_USER_ID and ULCA_API_KEY env vars first.');
  }

  const body = {
    pipelineTasks: [
      { taskType: 'asr', config: { language: { sourceLanguage: language } } },
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

  configCache[language] = config;
  return config;
}

async function transcribe(audioBuffer, language = 'en', audioFormat = 'wav', samplingRate = 16000) {
  const config = await getAsrConfig(language);

  const body = {
    pipelineTasks: [
      {
        taskType: 'asr',
        config: {
          language: { sourceLanguage: language },
          serviceId: config.serviceId,
          audioFormat,
          samplingRate,
        },
      },
    ],
    inputData: {
      audio: [{ audioContent: audioBuffer.toString('base64') }],
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
    throw new BhashiniError(`Bhashini ASR call failed: ${err.response?.data ? JSON.stringify(err.response.data) : err.message}`);
  }

  return resp.data.pipelineResponse[0].output[0].source;
}

module.exports = { transcribe, BhashiniError };