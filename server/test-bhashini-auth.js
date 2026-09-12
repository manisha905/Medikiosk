// test-bhashini-auth.js
require('dotenv').config();
const axios = require('axios');

async function testAuth() {
  const body = {
    pipelineTasks: [
      { taskType: 'asr', config: { language: { sourceLanguage: 'en' } } },
    ],
    pipelineRequestConfig: { pipelineId: '64392f96daac500b55c543cd' },
  };

  const headers = {
    userID: process.env.ULCA_USER_ID,
    ulcaApiKey: process.env.ULCA_API_KEY,
    'Content-Type': 'application/json',
  };

  try {
    const resp = await axios.post(
      'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline',
      body,
      { headers }
    );
    console.log('SUCCESS. Full response:');
    console.log(JSON.stringify(resp.data, null, 2));
  } catch (err) {
    console.log('FAILED.');
    console.log('Status:', err.response?.status);
    console.log('Body:', JSON.stringify(err.response?.data, null, 2));
  }
}

testAuth();