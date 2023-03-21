import axios from "axios";
import Transaction from "../model/Transaction.js";
import Wallet from "../model/Wallet.js";
import moment from "moment-timezone";


// Query Spectranet Data Bundles
const get_spectranet_bundle = async (request, response) => {
    const url = `https://vtpass.com/api/service-variations?serviceID=spectranet`;

    try {
        // make request
        const { data } = await axios
            .get(url, {
                headers: {
                    "api-key": process.env.VT_API_KEY,
                    "public-key": process.env.VT_PUBLIC_KEY,
                },
            })
            .then((res) => res)
            .catch((error) => console.log(error));

        // send response
        response.status(200).json(data.content.varations);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Server Error, Kindly try again.." });
    }
};

// Purchase Spectranet Data
const spectranet_data = async (request, response) => {
    const url = "https://vtpass.com/api/pay";

    const { billersCode, varation_code, amount, phone } = request.body;
    const serviceID = `spectranet`;

    try {
        // validate the request
        if (
            serviceID === "" ||
            amount === "" ||
            phone === "" ||
            billersCode === ""
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
        if (wallet.balance < amount) {
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
                    billersCode,
                    variation_code: varation_code,
                    amount,
                    phone,
                    request_id,
                },
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
            data.response_description ===
            "VARIATION CODE DOES NOT EXIST FOR SELECTED PRODUCT"
        ) {
            response.status(400).json({
                message: "Transaction failed, kindly check your details and try again!",
            });
            return;
        }

        // calculate cashback
        const cash_back = 10;

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

        // create transaction
        const transaction = await Transaction.create({
            amount: parseInt(amount),
            narration: `Spectranet Topup`,
            referrence_id: data.requestId,
            status: "Success",
            user: request.user._id,
            commission: cash_back,
            type: "Payable",
            logs: [
                {
                    phone_number: `${phone}`,
                    expiresOn: `${data.cards[0].expiresOn}`,
                    package: `${data.purchased_code}`
                }
            ]
        });
        // send response

        response.status(200).json(transaction);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Server Error, Kindly try again.." });
    }
};

export {
    get_spectranet_bundle,
    spectranet_data
}