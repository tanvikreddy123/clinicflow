const express = require('express');
const router = express.Router();
const { detectIntent } = require('../services/dialogflow');
const Intake = require('../models/Intake');
const { v4: uuidv4 } = require('uuid');

// quick health check
router.get('/ping', (_req, res) => res.json({ ok: true, ts: Date.now() }));

router.post('/echo', (req, res) => {
  console.log('ECHO BODY:', req.body);
  res.json({ ok: true, youSent: req.body });
});

// in-memory store for conversation params (resets on server restart)
const sessionParamsStore = Object.create(null);

function pick(obj, keys) {
  const out = {};
  keys.forEach((k) => { if (obj[k] !== undefined) out[k] = obj[k]; });
  return out;
}

async function saveIntakeFromParams(params) {
  const patientName = params.patient_name || params.name || 'Jane Doe';
  const chiefComplaint = params.symptom || params.chief_complaint || 'Not provided';

  const painLoc  = params.pain_location || params.location || 'N/A';
  const painType = params.pain_type || params.type || 'N/A';

  const doc = new Intake({
    patientName,
    appointmentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    intakeStatus: 'Complete',
    chiefComplaint,
    symptoms: [`Pain Location: ${painLoc}`, `Pain Type: ${painType}`],
    medicalHistory: Array.isArray(params.medical_history) ? params.medical_history : [],
  });

  const saved = await doc.save();
  return saved;
}

// main chatbot entrypoint
router.post('/chatbot/send', async (req, res) => {
  try {
    console.log('--- NEW MESSAGE RECEIVED ---', req.body);

    const { message, sessionId: clientSessionId } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing message' });
    }

    const sessionId = clientSessionId || uuidv4();
    if (!sessionParamsStore[sessionId]) sessionParamsStore[sessionId] = {};

    console.log(`Using SessionId: ${sessionId}`);

    const df = await detectIntent(sessionId, message);
    console.log('DF META:', df.meta);

    Object.assign(sessionParamsStore[sessionId], df.parameters || {});

    let saved = null;
    if (df.isConversationEnd) {
      try {
        const finalParams = sessionParamsStore[sessionId];
        saved = await saveIntakeFromParams(finalParams);
        delete sessionParamsStore[sessionId];
        console.log('--- INTAKE SAVED ---', pick(saved, ['_id', 'patientName', 'chiefComplaint']));
      } catch (e) {
        console.error('!! Failed to save intake:', e);
      }
    }

    res.json({
      response: Array.isArray(df.response) && df.response.length ? df.response : ['Okay.'],
      sessionId,
      saved: Boolean(saved),
    });
  } catch (error) {
    console.error('--- DIALOGFLOW ERROR FROM API ROUTE ---');
    console.error(error);
    res.status(500).json({ error: 'Error communicating with the chatbot.' });
  }
});

// fetch all saved intakes
router.get('/intakes', async (_req, res) => {
  try {
    const intakes = await Intake.find().sort({ createdAt: -1 });
    res.json(intakes);
  } catch (_err) {
    res.status(500).json({ msg: 'Failed to retrieve intakes' });
  }
});

// mark/unmark reviewed
router.patch('/intakes/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewed, reviewedBy } = req.body || {};

    const doc = await Intake.findById(id);
    if (!doc) return res.status(404).json({ error: 'Intake not found' });

    const isReviewed = !!reviewed;
    doc.reviewed = isReviewed;
    doc.reviewedAt = isReviewed ? new Date() : null;
    doc.reviewedBy = isReviewed ? (reviewedBy || '') : '';

    await doc.save();
    res.json(doc);
  } catch (e) {
    console.error('PATCH /intakes/:id/review error:', e);
    res.status(500).json({ error: 'Failed to update review status' });
  }
});

// debug helper to see in-progress sessions
router.get('/debug/sessions', (_req, res) => {
  res.json(sessionParamsStore);
});

module.exports = router;
