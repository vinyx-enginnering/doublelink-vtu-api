import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const WalletSchema = mongoose.Schema({
    wallet_id: Number,
    balance: {
        type: Number,
        default: 0
    },
    cashback: {
        type: Number,
        default: 0
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
});

WalletSchema.plugin(timestamps)

const Wallet = mongoose.model("Wallet", WalletSchema);

export default Wallet;