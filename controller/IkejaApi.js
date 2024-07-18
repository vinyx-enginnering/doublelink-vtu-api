import Transaction from "../model/Transaction.js";
import Wallet from "../model/Wallet.js";
import moment from "moment-timezone";
import axios from "axios";

// verify meter
const verify_meter = async (request, response) => {
    const url = "https://api-service.vtpass.com/api/merchant-verify";

    const { billersCode, meterType, serviceID } = request.body;
    try {
        // check if the request body is valid
        if (!billersCode || !meterType || billersCode === "" || meterType === "") {
            response.status(400).json({ message: "Invalid request, fill in all fields" });
            return;
        }

        // make api call
        const { data } = await axios
            .post(
                url,
                { billersCode, serviceID, type: meterType },
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
            console.log(data);
            response.status(200).json(data);
        }
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Service Error" });
    }
};

// purchase ikedc
const purchase_ikeja = async (request, response) => {
    const url = `https://api-service.vtpass.com/api/pay`;

    const { billersCode, meterType, amount, phone, serviceID } = request.body;


    try {
        // validate the request
        if (
            serviceID === "" || !serviceID ||
            amount === "" || !amount ||
            billersCode === "" || !billersCode ||
            meterType == "" || !meterType
        ) {
            response.status(400).json({ message: "Kindly fill in the empty fields" });
            return;
        };

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
        };

        // check the electricity amount is above 500 Naira
        if (amount < 500) {
            response.status(400).json({ message: "500 Hundred Naira, is the minimum amount to purchase" });
            return;
        }

        // make api call
        const { data } = await axios
            .post(
                url,
                {
                    serviceID,
                    billersCode,
                    variation_code: meterType,
                    amount,
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

        if (!data || data == undefined || data === undefined) {
            response.status(400).json({ message: "Service is not available yet" });
            return;
        }
        // check if there was an error
        if (
            (data && data.response_description === "TRANSACTION FAILED") ||
            data.response_description === "INVALID ARGUMENTS" || !data || data.response_description === "LOW WALLET BALANCE"
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
        const calculative_amount = parseInt(amount);
        const cash_back = (calculative_amount * 0.2) / 100;

        // debit wallet
        await Wallet.findOneAndUpdate(
            { user: request.user._id },
            { $inc: { balance: -parseInt(amount) } }
        );

        // credit cash back wallet
        await Wallet.findOneAndUpdate(
            { user: request.user._id },
            { $inc: { cashback: cash_back } }
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
                    meterNumber: `${billersCode}`,
                    meterType: `${meterType}`,
                    token: data.token,
                    Token: data.Token,
                    tokenAmount: data.tokenAmount && data.tokenAmount,
                    Amount: data.Amount,
                    units: data.units,
                    Units: data.Units,
                    tariff: data.tariff && data.tariff,
                    Tariff: data.Tariff,
                    CustomerName: data.CustomerName,
                    customerName: data.customerName,
                    customerBalance: data.customerBalance,
                    customerAddress: data.customerAddress,
                    exchangeReference: data.exchangeReference,
                    externalReference: data.externalReference,
                    utilityName: data.utilityName && data.utilityName,
                    ReceiptNumber: data.ReceiptNumber,
                    businessUnit: data.businessUnit,
                    undertaking: data.undertaking,
                    tariffCode: data.tariffCode,
                    tokenValue: data.tokenValue,
                    energyAmt: data.energyAmt,
                    vat: data.vat,
                    arrears: data.arrears,
                    address: data.address,
                    customerNumber: data.customerNumber,
                    Receipt: data.Receipt,
                    DebtTax: data.DebtTax,
                    DebtAmount: data.DebtAmount,
                    DebtValue: data.DebtValue,
                    DebtRem: data.DebtRem,
                    FixedTax: data.FixedTax,
                    FixedAmount: data.FixedAmount,
                    FixedValue: data.FixedValue,
                    taxAmount: data.taxAmount,
                    receiptNumber: data.receiptNo,
                    MeterNumber: data.MeterNumber,

                    PurchasedUnits: data.PurchasedUnits,
                    DebtDescription: data.DebtDescription,
                    RefundUnits: data.RefundUnits,
                    ServiceChargeVatExcl: data.ServiceChargeVatExcl,
                    Name: data.Name,
                    Address: data.Address,
                    Reference: data.Reference,
                    Vat: data.Vat,
                    ResponseTime: data.ResponseTime,
                    TariffRate: data.TariffRate,
                    FreeUnits: data.FreeUnits,
                    MeterCategory: data.MeterCategory,
                    arrearsBalance: data.arrearsBalance,
                    appliedToArrears: data.appliedToArrears,
                    wallet: data.wallet,
                    invoiceNumber: data.invoiceNumber,
                    appliedToWallet: data.appliedToWallet,

                }
            ]
        });
        // send response
        console.log(data);
        response.status(200).json(transaction);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Network Error, Kindly try again.." });
    }
}



export {
    verify_meter,
    purchase_ikeja
}