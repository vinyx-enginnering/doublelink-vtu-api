import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";
import PasswordChangeLog from "./PasswordChangeLog.js";

const UserSchema = mongoose.Schema({
    username: String,
    email: String,
    referrer: { type: String, default: "000001" },
    status: { type: Boolean, default: false },
    password: String,
    admin_pwd: String,
    user_type: { type: String, default: "password" },
    verified: { type: Boolean, default: false },
    verification_token: { type: String },
    reset_token: { type: String },
    logs: [Array]
});

UserSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        // Create a new password change log
        const changeLog = new PasswordChangeLog({ user: this._id });
        await changeLog.save();
    }
    next();
});


UserSchema.plugin(timestamps);

const User = mongoose.model("User", UserSchema);

export default User;