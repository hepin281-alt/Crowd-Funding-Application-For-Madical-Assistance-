import mongoose from 'mongoose'

const medicalCaseSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true },
    description: { type: String, required: true },
    amountNeeded: { type: Number, required: true },
    amountRaised: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    documents: [{ type: String }],
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verificationNotes: String,
  },
  { timestamps: true }
)

export default mongoose.model('MedicalCase', medicalCaseSchema)
