// import components
import User from "../model/User.js";
import axios from "axios";
import Transaction from "../model/Transaction.js";
import Wallet from "../model/Wallet.js";
import Settlement from "../model/Settlement.js";
import { v4 as uuid } from "uuid";

// find my accounts
const my_accounts = async (request, response) => {
    const account_ref = request.user._id;

    const url = "https://api.monnify.com/api/v1/auth/login";

    const api_key = process.env.MONNIFY_API_KEY;
    const api_secret = process.env.MONNIFY_API_SECRET;

    const stringg = Buffer.from(api_key + ":" + api_secret).toString("base64");

    console.log(account_ref)
    try {
        const { data } = await axios
            .post(
                url,
                {},
                {
                    headers: {
                        Authorization: `Basic ${stringg}`,
                    },
                }
            )
            .then((res) => res)
            .catch((err) => console.log(err));

        const api_token = data.responseBody.accessToken;

        if (api_token) {
            const { data } = await axios
                .get(
                    `https://api.monnify.com/api/v2/bank-transfer/reserved-accounts/${account_ref}`,
                    {
                        headers: {
                            Authorization: `Bearer ${api_token}`,
                        },
                    }
                )
                .then((res) => res)
                .catch((err) => console.log(err));

            response.status(200).json(data.responseBody);
        }
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: "Server Error" });
    }
}

// confirm bank transfer - personal accounts
const confirm_bank_transfer = async (request, response) => {
    const transactionReference = request.body.eventData.transactionReference;

    const url = "https://api.monnify.com/api/v1/auth/login";

    const api_key = process.env.MONNIFY_API_KEY;
    const api_secret = process.env.MONNIFY_API_SECRET;

    const stringg = Buffer.from(api_key + ":" + api_secret).toString("base64");

    try {

        // check if this transaction already exist
        const payment_exist = await Transaction.findOne({ referrence_id: transactionReference })

        if (payment_exist) {
            response.status(409);
            return;
        }

        // fetch user details
        const user = await User.findOne({
            email: request.body.eventData.customer.email,
        });




        if (!user) {
            return response.status(404).json({ message: 'User not found..' })
        }

        // login monnify & generate a request token
        const { data } = await axios
            .post(
                url,
                {},
                {
                    headers: {
                        Authorization: `Basic ${stringg}`,
                    },
                }
            )
            .then((res) => res)
            .catch((err) => console.log(err));

        const api_token = data.responseBody.accessToken;

        // confirm transactions with payment reference
        // {{base_url}}/api/v2/transactions/{{transactionReference}}
        if (api_token) {
            const { data } = await axios
                .get(
                    `https://api.monnify.com/api/v2/transactions/${encodeURI(transactionReference)}`,
                    {
                        headers: {
                            Authorization: `Bearer ${api_token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )
                .then((res) => res)
                .catch((err) => console.log(err));

          

            // if the transaction is successfully PAID
            if (data.responseBody.paymentStatus === 'PAID') {
                const amount = parseFloat(data.responseBody.amountPaid);
                const vat = (amount * 2) / 100;
                const balance = amount - vat;

                // fund the custmomer wallet
                await Wallet.findOneAndUpdate(
                    { user: user._id },
                    { $inc: { balance: parseFloat(balance) } }
                );
                // send a transaction notification
                const transaction = await Transaction.create({
                    amount: balance,
                    narration: `We have paid ${balance} Naira to your wallet`,
                    referrence_id: transactionReference,
                    vat: vat,
                    status: "successful",
                    type: "receivable",
                    user: user,
                });

                // send response
                response.status(201).json(transaction);
            }

        }

    } catch (error) {
        console.log(error);
        response.status(500).json({ message: "Server Error" });
    }
}

// initiate bank transfer - settlement
const settlement_payment = async (request, response) => {
    const { amount } = request.body;
    const url = "https://api.monnify.com/api/v1/auth/login";

    const api_key = process.env.MONNIFY_API_KEY;
    const api_secret = process.env.MONNIFY_API_SECRET;

    const monnify_string = Buffer.from(api_key + ":" + api_secret).toString("base64");
    try {
        // Get Settlement Details
        const settlement_details = await Settlement.findOne({ user: request.user._id });


        // Get if the User is a Merchant

        // Get if the  User is has enough Funds to Transfer


        // Authenticate Request
        // login monnify & generate a request token
        const { data } = await axios
            .post(
                url,
                {},
                {
                    headers: {
                        Authorization: `Basic ${monnify_string}`,
                    },
                }
            )
            .then((res) => res)
            .catch((err) => console.log(err));

        const api_token = data.responseBody.accessToken;

        // Create Settlement Data
        const transaction_data = {
            "amount": `${amount}`,
            "reference": `${uuid()}`,
            "narration": "Settlement",
            "destinationBankCode": `${settlement_details.bank_code}`,
            "destinationAccountNumber": `${settlement_details.account_number}`,
            "currency": "NGN",
            "sourceAccountNumber": "8016472829",
            "destinationAccountName": `${settlement_details.account_name}`
        }

        // Make Request to Transfer
        if (api_token) {
            const { data } = await axios
                .post(
                    `https://api.monnify.com/api/v2/disbursements/single`,
                    transaction_data,
                    {
                        headers: {
                            Authorization: `Bearer ${api_token}`,
                        },
                    }
                )
                .then((res) => res)
                .catch((err) => console.log(err));

            response.status(200).json(data.responseBody);

            // checks
        }

    } catch (error) {
        console.log(error);
        response.status(500).json({ message: "Server Error " });
    }
};

export {
    my_accounts,
    confirm_bank_transfer,
    settlement_payment
}