import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const senderIdSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    title: {
        type: String,
        required: true,
        validate: {
            validator: function (value) {
                return /^[a-zA-Z0-9]{3,11}$/.test(value);
            },
            message: 'Sender ID should be alphanumeric and have a length between 3 and 11 characters.',
        },
    },
    usecase: {
        type: String,
        required: true
    },
    company: {
        type: String,
        required: true,
    },

    status: {
        type: String,
        enum: ['pending', 'declined', 'approved'],
        default: 'pending',
    },
    country: {
        type: String,
        required: true
    },
});

senderIdSchema.plugin(timestamps);

const SenderId = mongoose.model('SenderId', senderIdSchema);

export default SenderId;