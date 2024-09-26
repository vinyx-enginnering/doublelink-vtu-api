import RechargeCard from "../model/RechargeCard.js";
import Voucher from "../model/Voucher.js";

const check_epins_unique = async (request, response) => {
    try {
        // Fetch all Glo 100 e-PINs
        const pins = await RechargeCard.find({
            network: "glo",
            denomination: 100
        });

        if (pins.length === 0) {
            return response.status(404).json({ message: "No Glo 100 e-PINs found" });
        }

        // Create a map to store occurrences of each pin
        const pinOccurrences = {};
        const duplicates = [];

        // Count occurrences of each pin
        pins.forEach(pinObject => {
            const pin = pinObject.pin;
            if (pinOccurrences[pin]) {
                pinOccurrences[pin]++;
                // Add to duplicates list if it's the second occurrence
                if (pinOccurrences[pin] === 2) {
                    duplicates.push(pin);
                }
            } else {
                pinOccurrences[pin] = 1;
            }
        });

        // Check if any duplicates were found
        if (duplicates.length > 0) {
            return response.status(200).json({
                message: `Found ${duplicates.length} duplicate(s) for Glo 100 e-PINs`,
                duplicates: duplicates
            });
        } else {
            return response.status(200).json({
                message: "All Glo 100 e-PINs are unique"
            });
        }

    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: "Something went wrong! Try again" });
    }
};

const check_voucher_rechargecard_duplicates = async (request, response) => {
    try {
        const { userId } = request.params;

        const voucherId = "66f4fb848a5c5ee5efb57e2d"

        // Fetch the user's Voucher e-PINs
        const userVoucher = await Voucher.findOne({ _id: voucherId });

        if (!userVoucher || userVoucher.pins.length === 0) {
            return response.status(404).json({ message: "No e-PINs found for this user in the Voucher collection" });
        }

        const voucherPins = userVoucher.pins.map(pinObject => pinObject.pin);

        // Find matching e-PINs in the RechargeCard collection
        const matchingPins = await RechargeCard.find({
            pin: { $in: voucherPins }
        });

        if (matchingPins.length > 0) {
            return response.status(200).json({
                message: `Found ${matchingPins.length} matching e-PIN(s) between the Voucher and RechargeCard collections`,
                matches: matchingPins.map(pinObj => pinObj.pin)
            });
        } else {
            return response.status(200).json({
                message: "No matching e-PINs found between the Voucher and RechargeCard collections"
            });
        }

    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: "Something went wrong! Try again" });
    }
};


const delete_voucher_rechargecard_duplicates = async (request, response) => {
    try {
        const voucherId = "66f4fb848a5c5ee5efb57e2d"

        // Fetch the user's Voucher e-PINs
        const userVoucher = await Voucher.findOne({ _id: voucherId });

        if (!userVoucher || userVoucher.pins.length === 0) {
            return response.status(404).json({ message: "No e-PINs found for this user in the Voucher collection" });
        }

        const voucherPins = userVoucher.pins.map(pinObject => pinObject.pin);

        // Find matching e-PINs in the RechargeCard collection
        const matchingPins = await RechargeCard.find({
            pin: { $in: voucherPins }
        });

        if (matchingPins.length > 0) {
            // Delete matching e-PINs from the RechargeCard collection
            await RechargeCard.deleteMany({
                pin: { $in: voucherPins }
            });

            return response.status(200).json({
                message: `Successfully deleted ${matchingPins.length} duplicate e-PIN(s) from the RechargeCard collection`,
                deletedPins: matchingPins.map(pinObj => pinObj.pin)
            });
        } else {
            return response.status(200).json({
                message: "No matching e-PINs found between the Voucher and RechargeCard collections, nothing to delete"
            });
        }

    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: "Something went wrong! Try again" });
    }
};



export {
    check_epins_unique,
    check_voucher_rechargecard_duplicates,
    delete_voucher_rechargecard_duplicates
}
