import mongoose from "mongoose";
import timestamp from "mongoose-timestamp";

const RechargeCardSchema = new mongoose.Schema({
    pin: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['airtel', 'glo', 'etisalat', 'mtn']
    },
    denomination: {
        type: Number,
        required: true,
        enum: [100, 200, 500, 1000]
    },
    serial: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
});

RechargeCardSchema.index({ isActive: 1, type: 1, denomination: 1 });

RechargeCardSchema.plugin(timestamp);

const RechargeCard = mongoose.model("RechargeCard", RechargeCardSchema);

export default RechargeCard;