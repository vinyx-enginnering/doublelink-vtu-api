import mongoose from 'mongoose';
import timestamp from 'mongoose-timestamp';

const { Schema } = mongoose;

const SettingSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    airtimePrintingEnabled: {
        type: Boolean,
        default: false,
    },
    voucherName: {
        type: String,
        default: 'Doublelink',
    },
});

// Add timestamps (createdAt, updatedAt)
SettingSchema.plugin(timestamp);

const Setting = mongoose.model('Setting', SettingSchema);

export default Setting;
