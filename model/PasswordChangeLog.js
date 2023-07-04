import mongoose from "mongoose";


const passwordChangeLogSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
});

const PasswordChangeLog = mongoose.model('PasswordChangeLog', passwordChangeLogSchema);

export default PasswordChangeLog;
