import SenderId from "../../model/bulksms/SenderId.js";
import axios from "axios";


const request_sender_id = async (request, response) => {
    const { title, usecase, company, country } = request.body;
    const user = request.user._id;
    const url = `https://api.ng.termii.com/api/sender-id/request`
    try {

        // Validate the user request
        if (!title || title == "" || !usecase || usecase == "" || !company || company == "" || !country || country == "") {
            response.status(400).json({ message: "Invalid Request! Kindly check your request and try again..." });
            return;
        };

        // Request data
        const requestData = {
            "api_key": process.env.TERMII_API_KEY,
            "sender_id": title,
            "usecase": usecase,
            "company": company,
            "country": country
        };

        // Attempt to request a new sender id
        const { data } = await axios.post(url, JSON.stringify(requestData), {
            headers: {
                "Content-Type": "application/json"
            }
        }).then(response => response)
            .catch(error => console.error(error));

        // Validate the termii response
        if (data.code !== "ok" || !data || !data.code) {
            response.status(400).json({ message: "Invalid Request! Something went wrong in your request, kindly try again!" });
            return;
        };

        // Log the request
        await SenderId.create({
            title,
            usecase,
            company,
            country,
            user
        });

        // Responde
        response.status(200).json({ message: data.message });


    } catch (error) {
        console.error(error);
        response.status(500).json({ message: `${error}` });
    }
};


const get_my_sender_ids = async (request, response) => {
    const user = request.user._id;
    try {
        const sender_ids = await SenderId.find({ user: user, status: "approved" }).sort({ createdAt: -1 });

        if (!sender_ids) {
            return response.status(400).json({ message: "Something went wrong..." });
        };

        response.status(200).json(sender_ids);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: `${error}` });
    }
};


export {
    request_sender_id,
    get_my_sender_ids
}