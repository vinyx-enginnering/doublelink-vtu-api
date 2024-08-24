import Setting from '../model/Setting.js';
import Wallet from '../model/Wallet.js';
import Transaction from '../model/Transaction.js';
import mongoose from 'mongoose';
import moment from 'moment';

export const enableAirtimePrinting = async (request, response) => {
    try {
        const userId = request.user._id;
        const chargeAmount = 7000;

        // Validate settings
        const setting = await Setting.findOne({ user: userId });

        if (!setting) {
            return response.status(404).json({ message: 'This setting is not supported on your account! Contact Support' });
        }

        // Check if airtime printing is already enabled
        if (setting.airtimePrintingEnabled) {
            return response.status(400).json({ message: 'Airtime printing is already enabled! Proceed to buy new e-Pins' });
        }

        // Charge the user's wallet in a single query
        const wallet = await Wallet.findOneAndUpdate(
            { user: userId, balance: { $gte: chargeAmount } },
            { $inc: { balance: -chargeAmount } },
            { new: true } // Returns the updated document
        );

        // Check if the wallet was found and updated
        if (!wallet) {
            return response.status(400).json({ message: 'Insufficient wallet balance or wallet not found' });
        }

        // Create a new transaction record
        await Transaction.create({
            amount: chargeAmount,
            narration: 'Activation of Airtime Printing feature',
            referrence_id: new mongoose.Types.ObjectId(), // Generate a unique reference ID
            status: 'Success',
            user: userId,
            type: 'Payable',
            logs: [
                {
                    description: 'Airtime Printing activation charge',
                },
            ],
        });

        // Enable airtime printing in the settings
        setting.airtimePrintingEnabled = true;
        await setting.save();

        response.status(200).json({
            message: "Congrat! We've enabled airtime printing on your account",
        });
    } catch (error) {
        response.status(500).json({ message: 'Error enabling airtime printing' });
    }
};


export const updateVoucherName = async (request, response) => {
    try {
        const userId = request.user._id;
        const { voucherName } = request.body;


        // check for empty request body
        if(!voucherName || voucherName === '') {
            return response.status(400).json({message: "Invalid Request! Kindly enter a new voucher name"})
        };

        if(voucherName.length > 10) {
            return response.status(400).json({message: "Invalid Request! Voucher name should be 9 character long"})

        };

        // Find the user's settings
        const setting = await Setting.findOne({ user: userId });

        if (!setting) {
            return response.status(404).json({ message: 'Settings not found! Contact Support' });
        }

        // Check when the voucher name was last updated
        const now = moment();
        const lastUpdated = moment(setting.updatedAt);

        if (setting.voucherName !== 'Doublelink') {
            const weeksSinceLastUpdate = now.diff(lastUpdated, 'weeks');

            if (weeksSinceLastUpdate < 2) {
                const daysRemaining = 14 - now.diff(lastUpdated, 'days');
                return response.status(400).json({
                    message: `You can only update the voucher name once every 2 weeks. Please wait ${daysRemaining} more days.`,
                });
            }
        }

        // Update the voucher name
        setting.voucherName = voucherName;
        await setting.save();

        response.status(200).json({
            message: 'Voucher name updated successfully',
        });
    } catch (error) {
        response.status(500).json({ message: 'Error updating voucher name' });
    }
};

export const get_user_setting = async (request, response) => {
    try {
        const setting = await Setting.findOne({user: request.user._id});

        if (!setting) {
            return response.status(404).json({ message: 'Settings not found' });
        };

        response.status(200).json(setting);
    } catch (error) {
        response.status(500).json({message: 'Something went wrong! try again later'})
    }
}
