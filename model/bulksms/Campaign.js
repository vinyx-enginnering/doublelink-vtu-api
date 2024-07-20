import mongoose from "mongoose";
import timestampsPlugin from "mongoose-timestamp";


const campaignSchema = mongoose.Schema({
    user: {
        ref: 'User',
        type: mongoose.Schema.Types.ObjectId
    },
    contacts: {
        type: [String],
        required: true
    },
    channel: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    sender_id: {
        type: String,
    },
    campaign_type: {
        type: String,
        required: true
    },
    message_id: {
        type: String
    },
    status: {
        type: String,
        default: 'sent'
    }
});

campaignSchema.plugin(timestampsPlugin)



const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;

