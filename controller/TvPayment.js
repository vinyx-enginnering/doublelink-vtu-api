import axios from "axios";
import moment from 'moment-timezone';
import Wallet from "../model/Wallet.js";
import Transaction from "../model/Transaction.js";

const get_tv_plans = async (request, response) => {
    const biller = request.params.biller;

    const url = `https://vtpass.com/api/service-variations?serviceID=${biller}`;


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
        response.status(500).json({ message: "Network Error, Kindly try again.." });
    }
};


const verify_tv_details = async (request, response) => {
    const { number } = request.body;
    const url = `https://api-service.vtpass.com/api/merchant-verify`;

    try {
        // validate the request
        if (number === "") {
            response
                .status(400)
                .json({ message: "Kindly fill out, your Number" });
            return;
        }

        // make api call
        const { data } = await axios
            .post(
                url,
                { billersCode: number, serviceID: "dstv" },
                {
                    headers: {
                        "api-key": process.env.VT_API_KEY,
                        "secret-key": process.env.VT_PRIVATE_KEY,
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
        response.status(500).json({ message: "Network Error, Kindly try again.." });
    }
};

const purchase_tv_plan = async (request, response) => {
    const url = "https://api-service.vtpass.com/api/pay";

    const { billersCode, varation_code, amount, subscription_type, serviceID } = request.body;

    try {
        // validate the request
        if (
            serviceID === "" ||
            amount === "" ||
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
                    variation_code: varation_code && varation_code,
                    amount,
                    phone: billersCode,
                    subscription_type,
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
            data.response_description === "INVALID ARGUMENTS" || !data
            || data.response_description === "LOW WALLET BALANCE"
        ) {
            response.status(400).json({
                message: data.content.error || data.response_description,
            });
            return;
        }

        console.log(data);

        // calculate cashback
        const cash_back = (amount * 1) / 100;

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
                    billersCode: `${billersCode}`,
                    subscription_type: `${subscription_type}`,
                }
            ]
        });
        // send response
        response.status(200).json(transaction);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Service Error, Kindly try again.." });
    }
};

const purchase_showmax_plan = async (request, response) => {
    const url = "https://sandbox.vtpass.com/api/pay";

    const { serviceID, billersCode, varation_code, amount } = request.body;
    console.log(request.body);

    try {
        // validate the request
        if (
            serviceID === "" ||
            amount === "" ||
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
                    phone: billersCode,
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

        console.log(data)
        // check if there was an error
        if (
            (data && data.response_description === "TRANSACTION FAILED") ||
            data.response_description === "INVALID ARGUMENTS" || 
            !data || data.response_description === "LOW WALLET BALANCE"
        ) {
            response.status(400).json({
                message: data.content.error,
            });
            return;
        }

        // logs
        console.log(data);
        console.log(request.body);
        console.log(data.response_description)

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
            narration: `${data.content.transactions.product_name}`,
            referrence_id: data.requestId,
            status: data.content.transactions.status,
            user: request.user._id,
            commission: cash_back,
            type: "Payable",
            logs: [
                {
                    billersCode: `${billersCode}`,
                    mobile: `${billersCode}`
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
    get_tv_plans,
    verify_tv_details,
    purchase_tv_plan,
    purchase_showmax_plan
}