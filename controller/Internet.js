import axios from "axios";
import Transaction from "../model/Transaction.js";
import Wallet from "../model/Wallet.js";
import moment from 'moment-timezone';
import { exec } from 'child_process';
import mongoose from "mongoose";

// Query VTPass Internet Plans
// Query Data Bundle Varations
const get_data_bundles = async (request, response) => {
    const { serviceId } = request.params;

    const url = `https://api-service.vtpass.com/api/service-variations?serviceID=${serviceId}`;

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
// Buy VTpass Data Plan
const data_bundle = async (request, response) => {
    const url = "https://api-service.vtpass.com/api/pay";

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

// Fetch SME Data Plans
// Mobile VTU API
const fetch_data_plans = async (request, response) => {
    const url = 'https://aidapay.ng/api/v1/service/data-bundle-sme';
    try {
        const { network } = request.params;

        // Build the curl command
        const curlCommand = `
            curl --location -g 'https://aidapay.ng/api/v1/packages/${network}' \
            --header 'Accept: application/json' \
            --header 'Authorization: Bearer ${process.env.AIDA_ACCESS_TOKEN}' \
            --silent --show-error
        `;

        // Execute the curl command
        exec(curlCommand, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing curl: ${error}`);
                return response.status(500).json({ message: "Server Error" });
            }

            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return response.status(500).json({ message: "Server Error" });
            }

            // Parse the curl response and send it as JSON
            try {
                const data = JSON.parse(stdout);
                response.status(200).json(data.data);
            } catch (parseError) {
                console.error(`Error parsing response: ${parseError}`);
                response.status(500).json({ message: "Error parsing response from server" });
            }
        });
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: "Server Error" });
    }
};

// Purchase SME Data Plan
//MobileVTU API
const topup_data = async (request, response) => {
    const url = 'https://aidapay.ng/api/v1/buy';

    try {
        const { number, package_name, price, provider_code, package_code } = request.body;

        // Grab user wallet data
        const wallet = await Wallet.findOne({ user: request.user._id });

        // Check if the user has sufficient balance for the transaction
        if (wallet.balance < parseFloat(price)) {
            return response
                .status(400)
                .json({ message: "Insufficient wallet balance for this transaction" });
        }

        // Build the curl command
        const curlCommand = `
            curl --location '${url}' \
            --header 'Accept: application/json' \
            --header 'Authorization: Bearer ${process.env.AIDA_ACCESS_TOKEN}' \
            --form 'recipient=${number}' \
            --form 'provider_code=${provider_code}' \
            --form 'package_code=${package_code}' \
            --form 'account_pin=0701' \
            --form 'ref=${new mongoose.Types.ObjectId()}' \
            --silent --show-error
        `;

        // Execute the curl command
        exec(curlCommand, async (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing curl: ${error}`);
                return response.status(500).json({ message: "Service Error" });
            }

            if (stderr) {
                console.error(`stderr: ${stderr}`);
            }

            // Parse the curl response and check if the request failed
            const data = JSON.parse(stdout);

            // Check if the API request failed
            if (!data.success) {
                return response.status(400).json({ message: data.message || "Service Error!" });
            }
            // Debit the wallet
            await Wallet.findOneAndUpdate(
                { user: request.user._id },
                { $inc: { balance: -parseInt(price) } }
            );

            // Create the transaction
            const transaction = await Transaction.create({
                amount: parseInt(price),
                narration: `Purchased ${package_name} SME data plan for ${number}`,
                referrence_id: new mongoose.Types.ObjectId(),
                status: `Successful`,
                user: request.user._id,
                commission: 0.00,
                type: "Payable",
                logs: [
                    {
                        phone_number: `${number}`,
                        plan: `${package_name}`,
                    }
                ]
            });

            // Send response to client
            return response.status(201).json(transaction);
        });
    } catch (error) {
        console.log(error);
        return response.status(500).json({ message: "Server Error" });
    }
};


// Buy Instant Data Plan
const buy_data_instant = async (request, response) => {
    const url = "https://api-service.vtpass.com/api/pay";

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
    buy_data_instant,
    fetch_data_plans,
    topup_data
}