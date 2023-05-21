
import Transaction from "../model/Transaction.js";

const my_previous_tokens_list = async (request, response) => {
    const { meter } = request.body;

    try {

        // check if meter is available
        if (!meter || meter === "" || meter < 10) {
            response.status(400).json({ message: "Invalid meter number, check again" });
            return;
        }

        const user_previous_electricity_bills = await Transaction.find({
            user: request.user._id,
            "logs.0.meterNumber": meter
        }).sort({ createdAt: -1 });


        if (user_previous_electricity_bills.length > 0) {
            response.status(200).json(user_previous_electricity_bills);
        } else {
            response.status(400).json({ message: "You don't have an electricity bill for that meter " })
        }



    } catch (error) {
        console.log(error);
        response.status(500).json({ message: "Network Error" });
    }
};


export {
    my_previous_tokens_list
}