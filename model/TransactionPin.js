import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const TransactionPinSchema = mongoose.Schema({
    pin: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
});

TransactionPinSchema.plugin(timestamps);

const TransactionPin = mongoose.model("TransactionPin", TransactionPinSchema);

export default TransactionPin;