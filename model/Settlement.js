import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const SettlementSchema = mongoose.Schema({
    account_name: String,
    account_number: String,
    bank_code: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
});

SettlementSchema.plugin(timestamps);

const Settlement = mongoose.model("Settlement", SettlementSchema);

export default Settlement;