import Wallet from "../model/Wallet.js";
import axios from "axios";
import Settlement from "../model/Settlement.js";

// GET /wallet
const user_wallet = async (request, response) => {
    try {
        const userId = request.user._id;

        // find customer wallet data
        const wallet = await Wallet.findOne({ user: userId });

        response.status(200).json(wallet);
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: "Server Error " });
    }
};

// Validate Settlement Details
const validate_user_details = async (request, response) => {
    const url = "https://api.monnify.com/api/v1/auth/login";
    const { bankCode, accountNumber } = request.params;

    const api_key = process.env.MONNIFY_API_KEY;
    const api_secret = process.env.MONNIFY_API_SECRET;

    const monnify_string = Buffer.from(api_key + ":" + api_secret).toString("base64");

    try {
        // Check if this user Already has a settlement account
        const settlementExists = await Settlement.findOne({ user: request.user._id });

        if (settlementExists) {
            response.status(400).json({ message: "You already have a settlement account" });
            return;
        }
        // Authenticate Request 
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

        // Validate Account Details
        if (api_token) {
            const { data } = await axios
                .get(
                    `https://api.monnify.com/api/v1/disbursements/account/validate?accountNumber=${accountNumber}&bankCode=${bankCode}`,
                    {
                        headers: {
                            Authorization: `Bearer ${api_token}`,
                        },
                    }
                )
                .then((res) => res)
                .catch((err) => console.log(err));


            // Create Settlement Data
            const settlement = {
                account_name: data.responseBody.accountName,
                account_number: data.responseBody.accountNumber,
                bank_code: data.responseBody.bankCode,
                user: request.user._id
            }

            await Settlement.create(settlement);

            // Send Response
            response.status(201).json({ message: "Settlement Account Added." });
        }

    } catch (error) {
        console.log(error);
        response.status(500).json({ message: "Server Error " });
    }
};

// Get User Settlement Account
const user_settlement_account = async (request, response) => {
    try {
        const settlement = await Settlement.findOne({user: request.user._id});

        response.status(200).json(settlement);
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: "Server Error " });
    }
};

export {
    user_wallet,
    validate_user_details,
    user_settlement_account
}