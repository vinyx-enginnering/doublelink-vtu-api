import RechargeCard from "../model/RechargeCard.js";


const delete_pins = async (request, response) => {
    // const { denomination, network } = request.body;

    let denomination = 100;
    let network = "mtn"

    console.log(request.body);
    try {
        // Validate the request
        if (!denomination || !network || denomination === "" || network === "") {
            return response.status(400).json({ message: "Invalid Request" });
        }

        // Delete e-PINs that match the denomination and network
        const result = await RechargeCard.deleteMany({
            network: network,
            denomination: parseInt(denomination)
        });

        // Check if any documents were deleted
        if (result.deletedCount === 0) {
            return response.status(404).json({ message: `No e-PINs found for network: ${network} and denomination: ${denomination}` });
        }

        // Send a success response
        return response.status(200).json({ 
            message: `${result.deletedCount} e-PIN(s) successfully deleted for network: ${network} and denomination: ${denomination}`
        });

    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: "Something went wrong! Try again" });
    }
};


export {
    delete_pins
}