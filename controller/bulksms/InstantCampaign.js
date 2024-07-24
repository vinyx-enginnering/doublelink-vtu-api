import axios from "axios";
import Wallet from "../../model/Wallet.js";
import Transaction from "../../model/Transaction.js";
import Campaign from "../../model/bulksms/Campaign.js";

const send_bulk_messages = async (request, response) => {
    // grab the request body
    const { channel, sender, message, numbers, campaign_type } = request.body;
    const baseUrl = "https://api.ng.termii.com/api/sms/send";




    try {
        // check for invalid input data 
        if (channel == '' || sender == '' || numbers.length == 0 || campaign_type == '' || message == '') {
            response.status(400).json({ message: 'Invalid request! Fill the form complete...' });
            return;
        };

        // Calculate the number of SMS parts
        const smsParts = Math.ceil(message.length / (message.length > 160 ? 153 : 160));

        // calculate sms charges
        const chargePerSMS = channel === "dnd" ? 4 : 2.6;
        const charge = parseFloat(numbers.length * chargePerSMS * smsParts);

        // check if wallet has enough balance
        // grab user wallet data
        const wallet = await Wallet.findOne({ user: request.user._id });

        // check if the user has sufficient balance for transaction
        if (wallet.balance < charge) {
            response.status(400).json({ message: "Insufficient wallet balance, for this transaction" });
            return;
        }

        // convert number to international standard
        let convertedContacts = numbers.map(contact => {
            if (contact.startsWith('0')) {
                return '234' + contact.slice(1);
            }
            return contact; // in case the number doesn't start with 0, we return it as is
        });
        const url = convertedContacts.length > 100 ? `${baseUrl}/bulk` : baseUrl;
        // construct message body
        const body = {
            to: convertedContacts,
            from: sender,
            sms: message,
            type: "plain",
            api_key: process.env.TERMII_API_KEY,
            channel: channel,
        };


        const { data, response: api_response } = await axios
            .post(url, JSON.stringify(body), {
                headers: {
                    "Content-Type": ["application/json", "application/json"],
                },
            })
            .then((res) => res)
            .catch((error) => error);


        if (!data && api_response.status == 400) {
            return response.status(400).json({ message: api_response.data.message });
        };

        // check if messages have been sent
        if (data.message === "Successfully Sent") {
            const cash_back = 0.00;

            // debit the wallet
            await Wallet.findOneAndUpdate(
                { user: request.user._id },
                { $inc: { balance: -charge } }
            );

            // Record the Transaction
            await Transaction.create({
                amount: charge,
                narration: `You campaigned sms messages to ${numbers.length} numbers`,
                referrence_id: data.requestId,
                status: "Success",
                user: request.user._id,
                commission: cash_back,
                type: "Payable",
            });

            // Record the campaign
            await Campaign.create({
                user: request.user,
                contacts: numbers,
                channel: channel,
                message: message,
                sender_id: sender,
                campaign_type: campaign_type,
                message_id: data.message_id,
                amount: charge,
                page: smsParts,
            });

            // send response to client
            response.status(201).json({ message: "Congrat! Your sms was delivered successfully!" });
        }
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: "Network Error" });
    }
};

const campaign_list = async (request, response) => {
    try {
        const campaigns = await Campaign.find({ user: request.user }).populate('user');

        response.status(200).json(campaigns);
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: "Network Error" });
    }
};

const campaign_report = async (request, response) => {
    try {
        console.log(request.body);
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: "Network Error" });
    }
};

const campaign_history = async (request, response) => {
    const url = `https://api.ng.termii.com/api/sms/inbox?api_key=${process.env.TERMII_API_KEY}&message_id=${request.params.message_id}`;

    try {
        // Make request to get message history
        const { data } = await axios
            .get(url, {
                headers: {
                    "Content-Type": ["application/json", "application/json"],
                },
            })
            .then((res) => res)
            .catch((error) => console.log(error));


        response.status(200).json(data)
    } catch (error) {
        console.log(error);
        response.status(500).json({ message: "Network Error" });
    }
};

const get_campaign_messages = async (request, response) => {
    const apiKey = process.env.TERMII_API_KEY;
    const baseUrl = 'https://api.ng.termii.com/api/sms/inbox';
    const messages = [];
    let currentPage = 1;
    let lastPage = 1;

    try {
        // fetch current user campaigns
        const campaigns = await Campaign.find({ user: request.user });

        // fetch all messages
        while (currentPage <= lastPage) {
            const url = `${baseUrl}?api_key=${apiKey}&page=${currentPage}`;
            const { data } = await axios.get(url, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            messages.push(...data.data);
            currentPage++;
            lastPage = data.meta.last_page;
        };

        // Group messages by message_id for current user's campaigns
        const messagesByCampaign = campaigns.reduce((acc, campaign) => {
            acc[campaign.message_id] = messages.filter(
                message => message.message_id === campaign.message_id
            );
            return acc;
        }, {});

        // Attach messages to their respective campaigns
        const campaignsWithMessages = campaigns.map(campaign => {
            return {
                ...campaign._doc,
                messages: messagesByCampaign[campaign.message_id] || []
            };
        });


        // Process campaignsWithMessages to get the desired structure
        const campaignData = campaignsWithMessages.map(campaign => {
            const totalMessages = campaign.messages.length;
            const deliveredCount = campaign.messages.filter(msg => msg.status === 'Delivered').length;
            const failedCount = campaign.messages.filter(msg => msg.status === 'Rejected').length;
            const sentCount = campaign.messages.filter(msg => msg.status === 'Sent').length;

            const messageDeliveryRate = totalMessages ? (deliveredCount / totalMessages) * 100 : 0;
            const messageFailedRate = totalMessages ? (failedCount / totalMessages) * 100 : 0;
            const messageSentRate = totalMessages ? (sentCount / totalMessages) * 100 : 0;

            return {
                id: campaign._id,
                messageDeliveryRate: messageDeliveryRate.toFixed(2), // Keeping two decimal places
                messageFailedRate: messageFailedRate.toFixed(2),
                messageSentRate: messageSentRate.toFixed(2),
                dateRun: new Date(campaign.createdAt).toLocaleDateString(), // Formatting the date
            };
        });

 
        // return result
        response.status(200).json(campaignData);


    } catch (error) {
        console.log(error);
        response.status(500).json({ message: "Network Error" });
    }
}


export { send_bulk_messages, campaign_list, campaign_report, campaign_history, get_campaign_messages };