import RechargeCard from "../model/RechargeCard.js";
import Wallet from "../model/Wallet.js";
import Transaction from "../model/Transaction.js";
import Voucher from "../model/Voucher.js";
import { v4 as uuid } from "uuid";
import path from "path";
const __dirname = path.resolve();
import fs from 'fs';
import { PdfReader } from 'pdfreader';
import Setting from "../model/Setting.js";

const extractTextFromPDF = async (filePath) => {
    const pdfBuffer = fs.readFileSync(filePath);

    return new Promise((resolve, reject) => {
        let pdfText = '';
        new PdfReader().parseBuffer(pdfBuffer, (err, item) => {
            if (err) {
                return reject(err);
            } else if (!item) {
                // End of buffer
                return resolve(pdfText);
            } else if (item.text) {
                pdfText += item.text + ' ';
            }
        });
    });
};

const create_pin = async (request, response) => {
    try {
        if (!request.files || !request.files.file) {
            return response.status(400).json({ message: "No file uploaded" });
        }

        const file = request.files.file;
        const { network, denomination } = request.body;

        const filePath = path.join(__dirname, 'uploads', file.name);

        // Save the uploaded file to a temporary location
        await file.mv(filePath);

        const text = await extractTextFromPDF(filePath);

        // Define regex patterns for each network
        const patterns = {
            airtel: /\b\d{4}-\d{4}-\d{4}-\d{4}\b/g,
            glo: /\b\d{3}-\d{4}-\d{4}-\d{4}\b/g,
            mtn: /\b\d{4}-\d{4}-\d{4}-\d{5}\b/g,
            '9mobile': /\b\d{4}-\d{4}-\d{4}-\d{3}\b/g,
        };

        const snPattern = /S\/N\s*:\s*(\d+)/g;

        // Validate network
        if (!patterns[network]) {
            return response.status(400).json({ message: "Invalid network" });
        }

        // Extract pins and serial numbers
        const pinPattern = patterns[network];
        const pins = [];
        let match;

        // Extract pins
        while ((match = pinPattern.exec(text)) !== null) {
            const pin = match[0];
            pins.push({ pin });
        }

        // Extract serial numbers
        pins.forEach(pinObject => {
            const snMatch = snPattern.exec(text);
            if (snMatch) {
                pinObject.serial_number = snMatch[1];
            }
        });

        // Format the pins according to the RechargeCardSchema
        const rechargeCards = pins.map(pinObject => ({
            pin: pinObject.pin,
            network: network,
            denomination: parseInt(denomination, 10),
            serial: pinObject.serial_number,
            isActive: true
        }));

        // Store the formatted pins in the database
        await RechargeCard.insertMany(rechargeCards);

        // Clean up: delete the uploaded file
        fs.unlinkSync(filePath);

        const pinCount = pins.length;

        response.json({ message: `Successfully uploaded ${pinCount} pcs of ${network} pins` });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Something went wrong! Try again" });
    }
};

// order bulk epins
const buy_pins = async (request, response) => {
    const { quantity, network, amount, denomination } = request.body;
    const price = parseFloat(amount);
    const tax = 0.00;

    try {
        // check if the request is empty
        if (!quantity || network === "" || amount === "" || denomination === "") {
            response.status(400).json({ message: "Invalid Request" });
            return;
        }

        // check if the user has the right permission to print airtime
        const user_setting = await Setting.findOne({ user: request.user._id });

        if (!user_setting || user_setting.airtimePrintingEnabled === false) {
            return response.status(400).json({ message: "Invalid Request! Airtime printing is disabled on your account" })
        };


        // check if the user balance is sufficient
        const wallet = await Wallet.findOne({ user: request.user._id });
        const total_amount = parseFloat(tax + (price * quantity));

        if (wallet.balance < total_amount) {
            response.status(400).json({ message: "Insufficient Balance" });
            return;
        };

        // check if the order is available
        const _network = network.toLowerCase();
        const _denomination = denomination.toLowerCase();

        const pins = await RechargeCard.find({ isActive: true, network: _network, denomination: _denomination }).limit(quantity);


        if (pins.length < quantity) {
            response.status(400).json({ message: `Insufficient ${network} pins` });
            return;
        }

        // When all goes well (pins & balance are sufficient)
        // Charge wallet with amount
        await Wallet.findOneAndUpdate(
            { user: request.user._id },
            { $inc: { balance: -total_amount } }
        );

        // Delete the used pins
        const pinIds = pins.map(pin => pin._id);
        await RechargeCard.deleteMany({ _id: { $in: pinIds } });

        // Create transaction
        await Transaction.create({
            amount: total_amount,
            narration: `Purchased ${quantity} units of ${network} ${denomination} e-Pins`,
            reference_id: uuid(),
            status: "Success",
            user: request.user._id,
            tax: tax,
            type: "Payable",
            logs: [
                {
                    price: price,
                    network: network,
                    denomination: denomination,
                }
            ]
        });

        // Record a new voucher
        await Voucher.create({
            user: request.user._id,
            pins: pins,
            network: _network,
            denomination: parseInt(denomination)
        });

        // send response
        response.status(200).json({ message: `Purchase complete!` });

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Server Error" });
    }
};


// order single epin
const buy_pin = async (request, response) => {
    const { denomination, type } = request.body;

    console.log(request.body)
    try {
        // Check if the request is valid
        if (denomination === "" || type === "" || !denomination || !type) {
            return response.status(400).json({ message: "Invalid Request" });
        }

        // Fetch that pin, if it's available
        const pin = await RechargeCard.findOne({ network: type, denomination: parseInt(denomination), isActive: true });

        if (!pin) {
            return response.status(400).json({ message: `Insufficient ${type} ${denomination} e-Pin` });
        }

        // Check wallet balance
        const wallet = await Wallet.findOne({ user: request.user._id });

        if (wallet.balance < parseFloat(denomination)) {
            return response.status(400).json({ message: "Insufficient Balance" });
        }

        // Calculate cashback
        const cash_back = 0.00;

        // Debit wallet
        await Wallet.findOneAndUpdate(
            { user: request.user._id },
            { $inc: { balance: -parseFloat(denomination) } }
        );

        // Credit cashback wallet
        await Wallet.findOneAndUpdate(
            { user: request.user._id },
            { $inc: { cashback: parseFloat(cash_back) } }
        );

        // Delete the used pin
        await RechargeCard.deleteOne({ _id: pin._id });

        // Create transaction
        const transaction = await Transaction.create({
            amount: denomination,
            narration: `Purchased Recharge Pin`,
            reference_id: uuid(),
            status: "Success",
            user: request.user._id,
            type: "Payable",
            logs: [
                {
                    pin: pin.pin,
                    network: pin.network,
                    denomination: pin.denomination,
                    serial: pin.serial
                }
            ]
        });

        // Send response
        return response.status(200).json(transaction);

    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: "Something went wrong! Try again" });
    }
};

// get my purchased vouchers
const get_vouchers = async (request, response) => {
    try {
        const vouchers = await Voucher.find({ user: request.user._id }).sort({ createdAt: -1 });

        response.status(200).json(vouchers)
    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: "Something went wrong! Try again" });
    }
}

export {
    buy_pins,
    create_pin,
    buy_pin,
    get_vouchers
}