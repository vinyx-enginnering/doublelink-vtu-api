import axios from "axios";
import Wallet from "../../models/Wallet.js";
import Transaction from "../../models/Transaction.js";

const send_bulk_messages = async (request, response) => {
    // grab the request body
    const { channel, sender, message, numbers } = request.body;
    const recepients = numbers.split(",");
    const url = "https://api.ng.termii.com/api/sms/send/bulk";
    const body = {
        to: recepients,
        from: sender,
        sms: message,
        type: "plain",
        api_key: process.env.SMS_ACCESS,
        channel: channel,
    };

    try {
        // calculate sms charges
        const charge =
            channel === "dnd" ? recepients.length * 4 : recepients.length * 3;

        // check if wallet has enough balance
        // grab user wallet data
        const wallet = await Wallet.findOne({ customer: request.user._id });

        // check if the user has sufficient balance for transaction
        if (wallet.balance < charge) {
            response
                .status(400)
                .json({ message: "Insufficient wallet balance, for this transaction" });
            return;
        }

        const { data } = await axios
            .post(url, JSON.stringify(body), {
                headers: {
                    "Content-Type": ["application/json", "application/json"],
                },
            })
            .then((res) => res)
            .catch((error) => console.log(error));

        console.log(data);
        // check if messages have been sent
        if (data.message === "Successfully Sent") {
            const cash_back = 100;

            // debit the wallet
            await Wallet.findOneAndUpdate(
                { customer: request.user._id },
                { $inc: { balance: -parseInt(charge) } }
            );

            await Wallet.findOneAndUpdate(
                { customer: request.user._id },
                { $inc: { cashback: parseInt(cash_back) } }
            );

            const transaction = await Transaction.create({
                amount: parseInt(charge),
                narration: `You campaigned sms to ${recepients.length} numbers`,
                referrence_id: data.requestId,
                status: "Success",
                user: request.user._id,
                commission: cash_back,
                type: "Payable",
            });

            // send response to client
            response.status(201).json(transaction);
        }
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: "Network Error" });
    }
};


export { send_bulk_messages };