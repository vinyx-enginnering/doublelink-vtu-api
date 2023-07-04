import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";
import PasswordChangeLog from "./PasswordChangeLog.js";

const UserSchema = mongoose.Schema({
    username: String,
    email: String,
    Referrer: {
        type: String,
        default: "000001"
    },
    status: {
        type: Boolean,
        default: false
    },
    password: String,
    admin_pwd: String
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