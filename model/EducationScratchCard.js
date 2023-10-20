import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const EducationScratchCard = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    transaction_referrence: String,
    card_or_pin_type: String,
    cards: [Array]
});

EducationScratchCard.plugin(timestamps);

const ScratchCard = mongoose.model("ScratchCard", EducationScratchCard);

export default ScratchCard;