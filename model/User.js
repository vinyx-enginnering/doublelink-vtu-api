import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

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

UserSchema.plugin(timestamps);

const User = mongoose.model("User", UserSchema);

export default User;