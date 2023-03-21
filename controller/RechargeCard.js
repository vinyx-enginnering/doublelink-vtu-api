import RechargeCard from "../model/RechargeCard.js";
import Wallet from "../model/Wallet.js";
import Transaction from "../model/Transaction.js";
import { v4 as uuid } from "uuid";

// create new pin
const create_pin = async (request, response) => {
    const { pin, type, denomination, serial } = request.body;
    try {
        // check if the pin & type is empty
        if (pin === "" || type === "" || denomination === "" || !pin || !type || !denomination) {
            response.status(400).json({ message: "Invalid Request" });
            return;
        }

        // new pin
        const new_pin = {
            pin: pin,
            type: type,
            denomination: denomination,
            serial: serial,
            isActive: true
        }

        await RechargeCard.create(new_pin);

        response.status(201).json({ message: "Pin Created" })

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Server Error" });
    }
};

// order existing pins
const buy_pins = async (request, response) => {
    const { quantity, type, amount, denomination } = request.body;
    const price = parseInt(amount);
    const tax = (price * 3) / 100;
    try {
        // check if the request is empty
        if (!quantity || type === "" || amount === "" || denomination === "") {
            response.status(400).json({ message: "Invalid Request" });
            return;
        }

        // check if the user balance is sufficient
        const wallet = await Wallet.findOne({ user: request.user._id });

        if (wallet.balance < (price + tax)) {
            response.status(400).json({ message: "Insufficient Balance" });
            return;
        }

        // check if the order is available
        const pins = await RechargeCard.find({ isActive: true, type: type, denomination: parseInt(denomination) }).limit(quantity);

        if (pins.length < quantity) {
            response.status(400).json({ message: `Insufficient ${type} pins` });
            return;
        }

        // when all goes well (pins & balance are sufficient)
        // charge wallet with amount
        // debit wallet
        const total_amount = tax + price;
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
            narration: `Purchased EPins`,
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