import axios from "axios";
import Transaction from "../model/Transaction.js";
import Wallet from "../model/Wallet.js";
import moment from 'moment-timezone';

// Query Internet Plans
// Query Data Bundle Varations
const get_data_bundles = async (request, response) => {
    const { serviceId } = request.params;

    const url = `https://vtpass.com/api/service-variations?serviceID=${serviceId}`;

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
        response.status(500).json({ message: "Service Error, Check your Internet and try again.." });
    }
};

// Purchase Data Bundle
const data_bundle = async (request, response) => {
    const url = "https://vtpass.com/api/pay";

    const { serviceId, billersCode, varation_code, amount, phone } = request.body;
    const serviceID = `${serviceId}`;

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
        };

        // check if the number has the valid format
        if (phone.length > 11 || phone.length < 11) {
            response.status(400).json({ message: "Invalid Mobile number format, kindly use 11 digit format" });
            return;
        };

        const number_format = `${phone}`
        const mobile = parseInt(number_format);

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
                    phone: mobile,
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
            data.response_description === "INVALID ARGUMENTS" ||
            data.response_description === 'LOW WALLET BALANCE'
        ) {
            response.status(400).json({
                message: `${data.response_description}`,
            });
            return;
        }

        // calculate cashback
        const cash_back = (amount * 3) / 100;

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
        console.log(data, request_id)
        response.status(200).json(transaction);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Service Error, Kindly try again.." });
    }
};

const buy_data_instant = async (request, response) => {
    const url = "https://vtpass.com/api/pay";

    const { serviceId, billersCode, varation_code, amount, phone } = request.body;
    const serviceID = `${serviceId}`;

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
        };

        // check if the number has the valid format
        if (phone.length > 11 || phone.length < 11) {
            response.status(400).json({ message: "Invalid Mobile number format, kindly use 11 digit format" });
            return;
        };

        const number_format = `${phone}`
        const mobile = parseInt(number_format);

        // generate a mtn request id
        const random = (Math.random() + 1).toString(36).substring(7).toUpperCase();

        const now = moment().tz("Africa/Lagos");

        // Format the date and time as YYYYMMDDHHII
        const requestID = now.format("YYYYMMDDHHmm");
        const request_id = `${requestID}${random}`;

        // make api call
        const { data } = await axios
            .post(
                url,
                {
                    serviceID,
                    billersCode,
                    variation_code: varation_code,
                    amount,
                    phone: mobile,
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
            data.response_description === "INVALID ARGUMENTS" ||
            data.response_description === 'LOW WALLET BALANCE'
        ) {
            response.status(400).json({
                message: `${data.response_description}`,
            });
            return;
        }


        // create transaction
        const transaction = {
            amount: parseInt(amount),
            narration: `${data.content.transactions.product_name}`,
            referrence_id: data.requestId,
            status: data.content.transactions.status,
            type: "Payable",
            logs: [
                {
                    phone_number: `${phone}`,
                    network: `${serviceID}`,
                }
            ]
        };
        // send response

        response.status(200).json(transaction);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Service Error, Kindly try again.." });
    }
}

export {
    get_data_bundles,
    data_bundle,
    buy_data_instant
}