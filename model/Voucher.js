import mongoose from "mongoose";
import timestamp from "mongoose-timestamp";

const VoucherSchema = mongoose.Schema({
    user: {
        ref: "User",
        type: mongoose.Schema.Types.ObjectId
    },
    pins: {
        type: [],
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
});

VoucherSchema.plugin(timestamp);

const Voucher = mongoose.model("Voucher", VoucherSchema);

export default Voucher;