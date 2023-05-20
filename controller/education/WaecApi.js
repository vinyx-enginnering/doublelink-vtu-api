import Transaction from "../../model/Transaction.js";
import Wallet from "../../model/Wallet.js";
import moment from "moment-timezone";
import axios from "axios";

// verify meter
const get_registration_plans = async (request, response) => {
    const url = "https://sandbox.vtpass.com/api/service-variations?serviceID=waec-registration";

    try {


        // make api call
        const { data } = await axios
            .get(
                url,
                {
                    headers: {
                        "api-key": process.env.SANDBOX_VT_API_KEY,
                        "secret-key": process.env.SANDBOX_VT_PRIVATE_KEY,
                    },
                }
            )
            .then((res) => res)
            .catch((error) => console.log(error));

        // check for error
        if (data && data.content.error) {
            response.status(400).json({ message: data.content.error });
            return;
        } else {
            response.status(200).json(data);
        }
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Service Error" });
    }
};

const purchase_waec = async (request, response) => {
    const url = "https://sandbox.vtpass.com/api/pay";
    const serviceID = "waec-registration";

    const { variation_code, variation_amount, quantity, phone } = request.body;


    try {
        // validate the request
        if (
            variation_code === "" || !variation_code ||
            variation_amount === "" || !variation_amount ||
            quantity === "" || !quantity ||
            phone == "" || !phone
        ) {
            response.status(400).json({ message: "Kindly fill in the empty fields" });
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
        if (wallet.balance < parseFloat(variation_amount)) {
            response
                .status(400)
                .json({ message: "Insufficient wallet balance, for this transaction" });
            return;
        }

        // make api call
        const { data } = await axios
            .post(
                url,
                {
                    serviceID,
                    variation_code,
                    variation_amount,
                    quantity,
                    phone,
                    request_id,
                },
                {
                    headers: {
                        "api-key": process.env.SANDBOX_VT_API_KEY,
                        "secret-key": process.env.SANDBOX_VT_PRIVATE_KEY,
                    },
                }
            )
            .then((res) => res)
            .catch((error) => console.log(error));


        // check if there was an error
        if (
            (data && data.response_description === "TRANSACTION FAILED") ||
            data.response_description === "INVALID ARGUMENTS" || !data
        ) {
            response.status(400).json({
                message: data.content.error,
            });
            return;
        }

        // logs
        console.log(data);
        console.log(data.response_description)

        // calculate cashback

        const cash_back = 150;

        // debit wallet
        await Wallet.findOneAndUpdate(
            { user: request.user._id },
            { $inc: { balance: -parseInt(variation_amount) } }
        );

        // credit cash back wallet
        await Wallet.findOneAndUpdate(
            { user: request.user._id },
            { $inc: { cashback: cash_back } }
        );

        // create transaction
        const transaction = await Transaction.create({
            amount: parseInt(variation_amount),
            narration: `${data.content.transactions.product_name}`,
            referrence_id: data.requestId,
            status: data.content.transactions.status,
            user: request.user._id,
            commission: cash_back,
            type: "Payable",
            logs: [
                {
                    purchased_token: data.purchased_code,
                    tokens: data.tokens

                }
            ]
        });
        // send response
        response.status(200).json(transaction);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Server Error, Kindly try again.." });
    }
}


export {
    get_registration_plans,
    purchase_waec
}