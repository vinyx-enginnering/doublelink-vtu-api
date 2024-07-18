import SenderId from "../../model/bulksms/SenderId.js";
import axios from "axios";


const request_sender_id = async (request, response) => {
    const { title, usecase, company } = request.body;
    const user = request.user._id;
    const url = `https://api.ng.termii.com/api/sender-id/request`
    try {

        // Validate the user request
        if (!title || title == "" || !usecase || usecase == "" || !company || company == "") {
            response.status(400).json({ message: "Invalid Request! Kindly check your request and try again..." });
            return;
        };

        // Request data
        const requestData = {
            "api_key": process.env.TERMII_API_KEY,
            "sender_id": title,
            "usecase": usecase,
            "company": company,
            "country": "Nigeria"
        };

        // check if the requested ID already exisit
        const IdExist = await SenderId.findOne({ title: title });

        if (IdExist) {
            response.status(400).json({ message: "Invalid request! That ID Already Exists" });
            return;
        };

        // Attempt to request a new sender id
        const { data } = await axios.post(url, JSON.stringify(requestData), {
            headers: {
                "Content-Type": "application/json"
            }
        }).then(response => response)
            .catch(error => error.response);

        // Validate the termii error & response
        if (data.errors && data.errors.sender_id) {
            response.status(400).json({ message: `${data.errors.sender_id[0]}` })
            return;
        };

        if (data.errors && data.errors.usecase) {
            response.status(400).json({ message: `${data.errors.usecase[0]}` })
            return;
        };


        // Log the request
        await SenderId.create({
            title,
            usecase,
            company,
            user
        });

        // Responde
        response.status(201).json({ message: data.message });


    } catch (error) {

        console.error(error);
        response.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
    };

}


const get_my_verified_sender_ids = async (request, response) => {
    const user = request.user._id;
    try {
        const sender_ids = await SenderId.find({ user: user, status: "active" }).sort({ createdAt: -1 });

        response.status(200).json(sender_ids);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: `${error}` });
    }
};

const get_all_my_sender_ids = async (request, response) => {

    const user = request.user._id;
    try {
        const sender_ids = await SenderId.find({ user: user }).sort({ createdAt: -1 });

        response.status(200).json(sender_ids);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: `${error}` });
    }
};


export {
    request_sender_id,
    get_all_my_sender_ids,
    get_my_verified_sender_ids
}