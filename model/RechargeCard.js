import mongoose from "mongoose";
import timestamp from "mongoose-timestamp";

const RechargeCardSchema = mongoose.Schema({
    pin: {
        type: String,
        required: true
    },
    network: {
        type: String,
        required: true,
        enum: ['airtel', 'glo', '9mobile', 'mtn']
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

RechargeCardSchema.index({ isActive: 1, network: 1, denomination: 1 });

RechargeCardSchema.plugin(timestamp);

const RechargeCard = mongoose.model("RechargeCard", RechargeCardSchema);

export default RechargeCard;