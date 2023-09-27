import axios from "axios";
import Transaction from "../../model/Transaction.js";
import Wallet from "../../model/Wallet.js";
import moment from 'moment-timezone';


const get_uinsure_motor_plans = async (request, response) => {
    
    const url = `https://api-service.vtpass.com/api/service-variations?serviceID=ui-insure`;

    try {

        // make api call
        const { data } = await axios
            .get(
                url,
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
        response.status(500).json({ message: "Network Error" });
    }
};

const purchase_uisure_plan = async (request, response) => {
    const url = "https://sandbox.vtpass.com/api/pay";

    const { 
        billersCode,
        varation_code,
        amount,
        phone,
        insured_name,
        engine_number,
        chasis_number,
        plate_number,
        vehicle_make,
        vehicle_color,
        vehicle_model,
        year_of_make,
        contact_address

     } = request.body;

    try {
        // validate the request
        if (!Object.values(request.body).every(value => value !== undefined && value !== "")) {
            throw new Error("Kindly provide all required fields");
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
                    phone: phone,
                    request_id,
                    Insured_Name: insured_name,
                    Engine_Number: engine_number,
                    Chasis_Number: chasis_number,
                    Plate_Number: plate_number,
                    Vehicle_Make: vehicle_make,
                    Vehicle_Color: vehicle_color,
                    Vehicle_Model: vehicle_model,
                    Year_of_Make: year_of_make,
                    Contact_Address: contact_address

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
                    subscription_type: `${subscription_type}`,
                }
            ]
        });
        // send response
        response.status(200).json(transaction);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Network Error, Kindly try again.." });
    }
}


export {
    get_uinsure_motor_plans,
    purchase_uisure_plan
};