import axios from "axios";
import Wallet from "../../model/Wallet.js";
import Transaction from "../../model/Transaction.js";
import Campaign from "../../model/bulksms/Campaign.js";

const send_bulk_messages = async (request, response) => {
    // grab the request body
    const { channel, sender, message, numbers, campaign_type } = request.body;
    const url = "https://api.ng.termii.com/api/sms/send/bulk";


    try {
        // check for invalid input data 
        if (channel == '' || sender == '' || numbers.length == 0 || campaign_type == '' || message == '') {
            response.status(400).json({ message: 'Invalid request! Fill the form complete...' });
            return;
        };

        // calculate sms charges
        const charge =
            channel === "dnd" ? numbers.length * 4 : numbers.length * 3;

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

        // convert number to international standard
        let convertedContacts = numbers.map(contact => {
            if (contact.startsWith('0')) {
                return '234' + contact.slice(1);
            }
            return contact; // in case the number doesn't start with 0, we return it as is
        });

        // construct message body
        const body = {
            to: convertedContacts,
            from: sender,
            sms: message,
            type: "plain",
            api_key: process.env.TERMII_API_KEY,
            channel: channel,
        };

        const { data } = await axios
            .post(url, JSON.stringify(body), {
                headers: {
                    "Content-Type": ["application/json", "application/json"],
                },
            })
            .then((res) => res)
            .catch((error) => console.log(error));

        // check if messages have been sent
        if (data.message === "Successfully Sent") {
            const cash_back = 0.00;

            // debit the wallet
            await Wallet.findOneAndUpdate(
                { customer: request.user._id },
                { $inc: { balance: -parseFloat(charge) } }
            );

            // Record the Transaction
            await Transaction.create({
                amount: parseFloat(charge),
                narration: `You campaigned sms messages to ${numbers.length} numbers`,
                referrence_id: data.requestId,
                status: "Success",
                user: request.user._id,
                commission: cash_back,
                type: "Payable",
            });

            // Record the campaign
            await Campaign.create({
                user: request.user,
                contacts: numbers,
                channel: channel,
                message: message,
                sender_id: sender,
                campaign_type: campaign_type,
                message_id: data.message_id
            });

            // send response to client
            response.status(201).json({ message: "Congrat! You've campaigned a bulk message" });
        }
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: "Network Error" });
    }
};

const campaign_list = async (request, response) => {
    try {
        const campaigns = await Campaign.find({ user: request.user });

        response.status(200).json(campaigns);
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: "Network Error" });
    }
};

const campaign_report = async (request, response) => {
    try {
        console.log(request.body)
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: "Network Error" });
    }
}


export { send_bulk_messages, campaign_list, campaign_report };