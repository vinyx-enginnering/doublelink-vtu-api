import Transaction from "../../model/Transaction.js";
import Wallet from "../../model/Wallet.js";
import moment from "moment-timezone";
import axios from "axios";

const get_jamb_vending_plans = async (request, response) => {
    const url = "https://sandbox.vtpass.com/api/service-variations?serviceID=jamb";

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

const verify_jamb_profile = async (request, response) => {
    const { billersCode, variation_code } = request.body;
    const url = `https://sandbox.vtpass.com/api/merchant-verify`;

    try {
        // validate the request
        if (billersCode === "" || !billersCode || variation_code === "" || !variation_code) {
            response
                .status(400)
                .json({ message: "Kindly fill out all required fields" });
            return;
        }

        // make api call
        const { data } = await axios
            .post(
                url,
                { billersCode, serviceID: "jamb", type: variation_code },
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
        response.status(500).json({ message: "Service Error, Kindly try again.." });
    }
};


const purchase_jamb_pin = async (request, response) => {
    const url = "https://sandbox.vtpass.com/api/pay";

    const serviceID = "jamb";

    const { variation_code, billersCode, variation_amount, phone } = request.body;


    try {
        // validate the request
        if (
            variation_code === "" || !variation_code ||
            variation_amount === "" || !variation_amount ||
            phone === "" || !phone ||
            billersCode === "" || !billersCode
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
                    amount: variation_amount,
                    billersCode,
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
            narration: `Jamb Pin Vending Payment`,
            referrence_id: data.requestId,
            status: data.content.transactions.status,
            user: request.user._id,
            commission: cash_back,
            type: "Payable",
            logs: [
                {
                    product: `${data.content.transactions.product_name}`,
                    purchased_token: data.purchased_code,
                    pin: data.Pin,
                    profileID: billersCode,
                    variation: variation_code

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
    get_jamb_vending_plans,
    verify_jamb_profile,
    purchase_jamb_pin
}