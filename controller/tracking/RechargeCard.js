import RechargeCard from "../../model/RechargeCard.js"; // Adjust the path as needed





const get_rechargecards_stock = async (request, response) => {
    try {
        const { network, denomination } = request.query; // Get network and denomination from query parameters

        // Validate query parameters
        if (!network || !denomination) {
            return response.status(400).json({ message: "Network and denomination are required." });
        }

        // Fetch recharge cards that match the specified network and denomination
        const rechargeCards = await RechargeCard.find({
            network: network,
            denomination: parseInt(denomination), // Convert denomination to a number
            isActive: true, // Only get active recharge cards
        });

        // Prepare the response object
        const result = {
            quantity: rechargeCards.length, // Total number of recharge cards found
            cards: rechargeCards, // Array of recharge cards
        };

        return response.status(200).json(result);
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "An error occurred while fetching recharge cards." });
    }
};


export {
    get_rechargecards_stock
}
