
import Settlement from "../model/Settlement.js";
import axios from "axios";


const validate_account = async (request, response) => {
    const { account_number, bank_code } = request.body;

    try {

        // validate user request
        if (!account_number || !bank_code) {
            return response.status(400).json({ message: "Enter an account number and select your bank!" })
        };

        if (account_number.length < 10) {
            return response.status(400).json({ message: "Invalid account number, check your account number!" });
        };


        // construct url
        const url = `https://maylancer.org/api/nuban/api.php?account_number=${account_number}&bank_code=${bank_code}`;

        // make api call
        const { data } = await axios
            .get(
                url,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${process.env.NUBAN_API}`
                    },
                }
            )
            .then((res) => res)
            .catch((error) => console.log(error));


        if (data.status == "error") {
            return response.status(400).json({ message: data.message });

        } else {
            response.status(200).json(data);
        };


    } catch (error) {
        console.log(error);
        response.status(500).json({ message: "Service Error! Contact Support " });
    }
};



const save_settlement_details = async (request, response) => {
    const { account_number, account_name, bank_name, bank_code, status } = request.body;

    try {
        if (!account_name || !account_number || !bank_code || !bank_name) {
            return response.status(400).json({ message: "Bad request! Please provide all required fields." });
        }

        const filter = { user: request.user }; // Filter condition based on the user
        const update = {
            account_name,
            account_number,
            bank_code,
            bank_name,
            status,
            user: request.user,
        };

        const options = { upsert: true, new: true }; // Upsert: Create if not found, new: return the updated record

        const settlement = await Settlement.findOneAndUpdate(filter, update, options);

        response.status(200).json(settlement);
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: "Network Error" });
    }
};



const get_settlement = async (request, response) => {
    try {
        const settlement = await Settlement.findOne({ user: request.user });

        if (!settlement) {
            return response.status(404).json({ message: 'you dont have a settlement account yet!' })
        };

        response.status(200).json(settlement);
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: "Network Error " });
    }
}



export {
    validate_account,
    save_settlement_details,
    get_settlement
};