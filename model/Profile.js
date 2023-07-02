import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";


const ProfileSchema = new mongoose.Schema({
    // Profile fields
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['personal', 'business'], required: true },
    idCard: { type: String },
    idType: { type: String },
    businessName: { type: String },
    businessAddress: { type: String },
    cacDocument: { type: String },
    businessEmail: { type: String },
    name: { type: String },
    age: { type: Number },
    email: { type: String },
    status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
});

ProfileSchema.plugin(timestamps);

const Profile = mongoose.model('Profile', ProfileSchema);

export default Profile;