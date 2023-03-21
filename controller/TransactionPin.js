import User from "../model/User.js";
import TransactionPin from "../model/TransactionPin.js";


const set_transaction_pin = async (request, response) => {
    const { pin } = request.body;
    try {
        // check if the pin is there
        if (pin === "" || !pin) {
            response.status(400).json({ message: "Invalid request, kindly enter a valid pin format" });
            return;
        };

        // check if the pin is not a consecutive number

        // set the pin 
        await TransactionPin.create({
            pin: pin,
            user: request.user._id
        });

        // return response
        response.status(201).json({ message: "successful" });

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Service Error" });
    }
};


const update_transaction_pin = async (request, response) => {
    const { pin } = request.body;
    try {
        // check if the pin is there
        if (pin === "" || !pin) {
            response.status(400).json({ message: "Invalid request, kindly enter a valid pin format" });
            return;
        };

        // check if the pin is not a consecutive number

        // check if the user has set a pin
        const userHasPin = await TransactionPin.findOne({ user: request.user._id });

        if (!userHasPin) {
            response.status(400).json({ message: "You dont have a pin set" });
            return;
        };

        // update user pin
        await TransactionPin.updateOne({ user: request.user._id }, { pin: pin })

        // send reponse 
        response.status(200).json({ message: "successful update" })
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Service Error" });
    }
};

const validate_pin = async (request, response) => {
    const { pin } = request.body;
    try {
        // check if the pin is valid
        if (pin === "" || !pin) {
            response.status(400).json({ message: "Invalid request, kindly enter a valid pin format" });
            return;
        };

        // get the current user's pin
        const userPin = await TransactionPin.findOne({ user: request.user._id }).select("pin");

        if (!userPin) {
            response.status(400).json({ message: "Invalid request, you dont a transaction pin set" });
            return;
        }
        // check if they match 
        console.log(userPin);
        console.log(pin);

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Service Error..." })
    }
}


export {
    set_transaction_pin,
    update_transaction_pin,
    validate_pin
}