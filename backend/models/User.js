const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    ward: { type: String, default: '' },
    role: { type: String, enum: ['citizen', 'admin'], default: 'citizen' },
  },
  { timestamps: true, strict: false }
);

// Store hashes in the existing Atlas field; never persist a plain-text password.
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return Boolean(this.passwordHash)
    && bcrypt.compare(candidatePassword, this.passwordHash);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
