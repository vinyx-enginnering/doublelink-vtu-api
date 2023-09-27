import axios from "axios";
import Transaction from "../model/Transaction.js";
import Wallet from "../model/Wallet.js";
import moment from 'moment-timezone';


// Purchase Airtime
const airtime_topup = async (request, response) => {
    const url = "https://vtpass.com/api/pay";

    const { serviceID, amount, phone } = request.body;
    console.log({ serviceID, amount, phone })
    try {
        // validate the request
        if (serviceID === "" || amount === "" || phone === "") {
            response.status(400).json({ message: "Kindly fill in the empty fields" });
            return;
        }

        // check if the number has the valid format
        if (phone.length > 11) {
            response.status(400).json({ message: "Invalid Mobile number format" });
            return;
        }

        // generate a mtn request id

        const random = (Math.random() + 1).toString(36).substring(7).toUpperCase();

        const now = moment().tz("Africa/Lagos");

        // Format the date and time as YYYYMMDDHHII
        const requestID = now.format("YYYYMMDDHHmm");
        const request_id = `${requestID}${random}`

        // check wallet
        // grab user wallet data
        const wallet = await Wallet.findOne({ user: request.user._id });

        // check if the user has sufficient balance for transaction
        if (wallet.balance < amount) {
            response
                .status(400)
                .json({ message: "Insufficient wallet balance, for this transaction" });
            return;
        }
        const price = parseInt(amount);
        const number_format = `0${phone}`
        const mobile = parseInt(number_format);
        // make api call
        const { data } = await axios
            .post(
                url,
                { serviceID, amount: price, phone: mobile, request_id },
                {
                    headers: {
                        "api-key": process.env.VT_API_KEY,
                        "secret-key": process.env.VT_PRIVATE_KEY,
                    },
                }
            )
            .then((res) => res)
            .catch((error) => console.log(error));

        // check if there was an error
        if (
            (data && data.response_description === "TRANSACTION FAILED") ||
            data.response_description === "INVALID ARGUMENTS" ||
            data.response_description === 'LOW WALLET BALANCE' ||
            data.response_description === 'BELOW MINIMUM AMOUNT ALLOWED'
        ) {
            console.log(data);
            response.status(400).json({
                message: `${data.response_description}`,
            });
            return;
        }

        // calculate cashback
        const cash_back = (amount * 2) / 100;

        // debit wallet
        await Wallet.findOneAndUpdate(
            { user: request.user._id },
            { $inc: { balance: -parseInt(amount) } }
        );

        // credit cash back wallet
        await Wallet.findOneAndUpdate(
            { user: request.user._id },
            { $inc: { cashback: parseInt(cash_back) } }
        );

        console.log(data)

        // create transaction
        const transaction = await Transaction.create({
            amount: parseInt(amount),
            narration: `${data.content.transactions.product_name}`,
            referrence_id: data.requestId,
            status: data.content.transactions.status,
            user: request.user._id,
            commission: cash_back,
            type: "Payable",
            logs: [
                {
                    phone_number: `${phone}`,
                    network: `${serviceID}`,
                }
            ]
        });
        // send response
        response.status(200).json(transaction);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Network Error, Kindly try again.." });
    }
};


export {
    airtime_topup
}