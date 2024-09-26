import axios from "axios";
import SenderId from "../model/bulksms/SenderId.js";

const fetchAllSenderIdsFromAPI = async (url) => {
    let allSenderIds = [];
    let currentPage = 1;
    let lastPage = 1;

    try {
        do {
            const { data: apiResponse } = await axios.get(`${url}&page=${currentPage}`, {
                headers: {
                    "Content-Type": ["application/json", "application/json"],
                },
            });

            allSenderIds = [...allSenderIds, ...apiResponse.content];
            lastPage = apiResponse.last;
            currentPage++;
        } while (currentPage <= lastPage);
    } catch (error) {
        console.error('Error fetching sender IDs from API:', error);
        throw error;
    }

    return allSenderIds;
};

const update_sender_ids = async (request, response) => {
    const url = `https://api.ng.termii.com/api/sender-id?api_key=${process.env.TERMII_API_KEY}`;

    try {
        // Fetch all sender IDs from API with pagination
        const apiSenderIds = await fetchAllSenderIdsFromAPI(url);

        // Fetch all sender IDs from database
        const dbSenderIds = await SenderId.find();

        // Create a map for easy lookup
        const apiSenderIdsMap = new Map();
        apiSenderIds.forEach(senderId => {
            apiSenderIdsMap.set(senderId.sender_id, senderId.status);
        });

        // Update the database sender IDs based on the API response
        await Promise.all(dbSenderIds.map(async dbSenderId => {
            if (dbSenderId.status === 'pending') {
                const apiStatus = apiSenderIdsMap.get(dbSenderId.title);
                if (apiStatus && apiStatus !== 'pending') {
                    dbSenderId.status = 'active';
                    await dbSenderId.save();
                }
            }
        }));

        response.status(200).json({ message: 'Sender IDs updated successfully.' });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: `${error}` });
    }
};

export {
    update_sender_ids
};
