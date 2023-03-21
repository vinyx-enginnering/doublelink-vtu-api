import timestamps from "mongoose-timestamp";
import mongoose from "mongoose";
import normalize from "normalize-mongoose/index.js";

const TransactionSchema = mongoose.Schema({
    amount: {
        type: Number,
        default: 0
    },
    narration: String,
    referrence_id: String,
    vat: {
        type: Number,
        default: 0
    },
    commission: {
        type: Number,
        default: 0
    },
    status: {
        type: String
    },
    type: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    logs: [Array]
});

TransactionSchema.plugin(timestamps);
TransactionSchema.plugin(normalize);

const Transaction = mongoose.model("Transaction", TransactionSchema);

export default Transaction;
