import mongoose from "mongoose";


const campaignSchema = mongoose.Schema({
    from: {
        type: String,
        required: true,
    },
    to: {
        type: [String],
        required: function () {
            return this.schedule_sms_status !== 'scheduled';
        },
    },
    channel: {
        type: String,
        required: true,
    },
    message_type: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },

    type: {
        type: String,
        required: function () {
            return this.schedule_sms_status !== 'scheduled';
        },
    },
    country_code: {
        type: String,
        required: function () {
            return this.schedule_sms_status === 'scheduled';
        },
    },
    sender_id: {
        type: String,
        required: function () {
            return this.schedule_sms_status === 'scheduled';
        },
    },
    phonebook_id: {
        type: String,
        required: true,
    },
    campaign_type: {
        type: String,
        required: function () {
            return this.schedule_sms_status === 'scheduled';
        },
    },
    schedule_sms_status: {
        type: String,
        required: function () {
            return this.schedule_time !== undefined;
        },
    },
    schedule_time: {
        type: String,
    },
});


const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;

