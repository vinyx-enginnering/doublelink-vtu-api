import RechargeCard from "../model/RechargeCard.js";
import Wallet from "../model/Wallet.js";
import Transaction from "../model/Transaction.js";
import Voucher from "../model/Voucher.js";
import { v4 as uuid } from "uuid";
import path from "path";
const __dirname = path.resolve();
import fs from 'fs';
import { PdfReader } from 'pdfreader';

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

// order existing pins
const buy_pins = async (request, response) => {
    const { quantity, network, amount, denomination } = request.body;
    const price = parseFloat(amount);
    const tax = 0;
    try {
        // check if the request is empty
        if (!quantity || network === "" || amount === "" || denomination === "") {
            response.status(400).json({ message: "Invalid Request" });
            return;
        }

        // check if the user balance is sufficient
        const wallet = await Wallet.findOne({ user: request.user._id });
        const total_amount = parseFloat(tax + price);

        if (wallet.balance < total_amount) {
            response.status(400).json({ message: "Insufficient Balance" });
            return;
        };

        // check if the order is available
        const pins = await RechargeCard.find({ isActive: true, network: network, denomination: parseInt(denomination) }).limit(quantity);

        if (pins.length < quantity) {
            response.status(400).json({ message: `Insufficient ${network} pins` });
            return;
        }

        // when all goes well (pins & balance are sufficient)
        // charge wallet with amount
        // debit wallet
        
        await Wallet.findOneAndUpdate(
            { user: request.user._id },
            { $inc: { balance: -total_amount } }
        );

        // update the used pins
        const updates = pins.map((pin) => ({
            updateOne: {
                filter: { _id: pin._id },
                update: { $set: { isActive: false } },
            },
        }));

        await RechargeCard.bulkWrite(updates);

        // create transaction
        const transaction = await Transaction.create({
            amount: price,
            narration: `Purchased e-Pins`,
            referrence_id: uuid(),
            status: "Success",
            user: request.user._id,
            tax: tax,
            type: "Payable",
            logs: [
                {
                    pins: `${pins}`,
                    network: `${type}`,
                    denomination: `${denomination}`,
                }
            ]
        });

        // record a new voucher
        await Voucher.create({
            user: request.user,
            pins: pins,
            network: type,
            denomination: denomination
        })
        // send response

        response.status(200).json(transaction);

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Server Error" });
    }
};

// delete in-active pins (this is a cron-job)

// order single pin
const buy_pin = async (request, response) => {
    const { denomination, type } = request.body;
    try {
        // check if the request is valid
        if (denomination === "" || type === "" || !denomination || !type) {
            response.status(400).json({ message: "Invalid Request" });
            return;
        }

        // fetch that pin, if it's available
        const pin = await RechargeCard.findOne({ type: type, denomination: parseInt(denomination) });

        if (!pin) {
            response.status(400).json({ message: `Insufficient ${type} pin` });
            return;
        }

        // check wallet balance
        const wallet = await Wallet.findOne({ user: request.user._id });
        console.log(wallet, request.user)

        if (wallet.balance < parseInt(denomination)) {
            response.status(400).json({ message: "Insufficient Balance" });
            return;
        }

        // charge wallet
        // calculate cashback
        const cash_back = (denomination * 2) / 100;

        // debit wallet
        await Wallet.findOneAndUpdate(
            { user: request.user._id },
            { $inc: { balance: -parseInt(denomination) } }
        );

        // credit cash back wallet
        await Wallet.findOneAndUpdate(
            { user: request.user._id },
            { $inc: { cashback: parseInt(cash_back) } }
        );

        // update pins collection
        // await RechargeCard.updateOne({ pin: pin.pin }, { $set: { isActive: false } });
        await RechargeCard.deleteOne({
            pin: pin.pin,
            denomination: pin.denomination
        });

        // create transaction
        const transaction = await Transaction.create({
            amount: denomination,
            narration: `Purchased Recharge Pin`,
            referrence_id: uuid(),
            status: "Success",
            user: request.user._id,
            type: "Payable",
            logs: [
                {
                    pin: `${pin.pin}`,
                    network: `${pin.type}`,
                    denomination: `${pin.denomination}`,
                    serial: `${pin.serial}`
                }
            ]
        });
        // send response

        response.status(200).json(transaction);

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Service error" })
    }
}

export {
    buy_pins,
    create_pin,
    buy_pin
}