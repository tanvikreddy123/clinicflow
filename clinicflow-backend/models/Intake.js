const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const IntakeSchema = new Schema({
  patientName: { type: String, required: true },
  appointmentTime: { type: String, required: true },

  intakeStatus: {
    type: String,
    enum: ['Complete', 'In Progress'],
    default: 'In Progress',
  },

  chiefComplaint: { type: String, default: '' },
  symptoms: [{ type: String }],
  medicalHistory: [{ type: String }],

  createdAt: { type: Date, default: Date.now },

  // review workflow
  reviewed: { type: Boolean, default: false },
  reviewedAt: { type: Date, default: null },
  reviewedBy: { type: String, default: '' },
});

// indexes for faster queries
IntakeSchema.index({ createdAt: -1 });                  
IntakeSchema.index({ reviewed: 1, createdAt: -1 });     
IntakeSchema.index({ patientName: 1, createdAt: -1 });  

module.exports = mongoose.model('intakes', IntakeSchema);
