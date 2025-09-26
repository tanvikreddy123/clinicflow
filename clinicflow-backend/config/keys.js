require('dotenv').config();

module.exports = {
  mongoURI: process.env.MONGODB_URI,
  googleProjectID: process.env.GOOGLE_PROJECT_ID,
  dialogflowAgentID: process.env.DIALOGFLOW_AGENT_ID,
  dialogflowLocation: process.env.DIALOGFLOW_LOCATION,
  googleClientEmail: process.env.GOOGLE_CLIENT_EMAIL,
  googlePrivateKey: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
};