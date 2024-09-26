import RechargeCard from "../model/RechargeCard.js";
import Wallet from "../model/Wallet.js";
import Transaction from "../model/Transaction.js";
import Voucher from "../model/Voucher.js";
import { v4 as uuid } from "uuid";
import path from "path";
const __dirname = path.resolve();
import fs from 'fs';
import { PdfReader } from 'pdfreader';
import Setting from "../model/Setting.js";
import * as XLSX from 'xlsx'; // Import xlsx library

// Regex patterns for each network's pin format
const pinPatterns = {
    airtel: /\b\d{4}-\d{4}-\d{4}-\d{4}\b/g,   // Airtel: 4-4-4-4 (16 digits)
    glo: /\b\d{3}-\d{4}-\d{4}-\d{4}\b/g,      // Glo: 3-4-4-4 (15 digits)
    mtn: /\b\d{4}-\d{4}-\d{4}-\d{5}\b/g,      // MTN: 4-4-4-5 (17 digits)
    '9mobile': /\b\d{4}-\d{4}-\d{4}-\d{3}\b/g // 9mobile: 4-4-4-3 (15 digits)
};


// PDF Extraction Helper
const extractTextFromPDF = async (filePath) => {
    const pdfBuffer = fs.readFileSync(filePath);

    return new Promise((resolve, reject) => {
        let pdfText = '';
        new PdfReader().parseBuffer(pdfBuffer, (err, item) => {
            if (err) {
                return reject(err);
            } else if (!item) {
                // End of buffer
                return resolve(pdfText);
            } else if (item.text) {
                pdfText += item.text + ' ';
            }
        });
    });
};

// PDF Extraction
// Upload e-Pins
const create_pin = async (request, response) => {
    try {
        if (!request.files || !request.files.file) {
            return response.status(400).json({ message: "No file uploaded" });
        }

        const file = request.files.file;
        const { network, denomination } = request.body;

        const filePath = path.join(__dirname, 'uploads', file.name);

        // Save the uploaded file to a temporary location
        await file.mv(filePath);

        const text = await extractTextFromPDF(filePath);

        // Define regex patterns for each network
        const patterns = {
            airtel: /\d{4}-\d{4}-\d{4}-\d{4}/g,
            glo: /\d{3}-\d{4}-\d{4}-\d{4}/g,
            mtn: /\d{4}-\d{4}-\d{4}-\d{5}/g,
            '9mobile': /\d{4}-\d{4}-\d{4}-\d{3}/g,
        };

        const snPattern = /S\/N\s*:\s*(\d+)/g;

        // Validate network
        if (!patterns[network]) {
            return response.status(400).json({ message: "Invalid network" });
        }

        // Extract pins and serial numbers
        const pinPattern = patterns[network];
        const pins = [];
        let match;

        // Extract pins
        while ((match = pinPattern.exec(text)) !== null) {
            const pin = match[0];
            pins.push({ pin });
        }

        // Extract serial numbers
        pins.forEach(pinObject => {
            const snMatch = snPattern.exec(text);
            if (snMatch) {
                pinObject.serial_number = snMatch[1];
            }
        });

        // Format the pins according to the RechargeCardSchema
        const rechargeCards = pins.map(pinObject => ({
            pin: pinObject.pin,
            network: network,
            denomination: parseInt(denomination, 10),
            serial: pinObject.serial_number,
            isActive: true
        }));

        // Check for duplicates
        const uniquePins = [];
        const duplicates = [];
        
        for (const card of rechargeCards) {
            const existingPin = await RechargeCard.findOne({ pin: card.pin, network: card.network });
            if (existingPin) {
                duplicates.push(card.pin); // Add to duplicates if found
            } else {
                uniquePins.push(card); // Add to unique if not found
            }
        }

        // Store the unique pins in the database
        if (uniquePins.length > 0) {
            await RechargeCard.insertMany(uniquePins);
        }

        // Clean up: delete the uploaded file
        fs.unlinkSync(filePath);

        // Respond with the result
        return response.json({
            message: `Successfully uploaded ${uniquePins.length} pcs of ${network} pins`,
            duplicates: `Found ${duplicates.length} duplicate(s): ${duplicates.join(", ")}`
        });

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Something went wrong! Try again" });
    }
};


// Excel Extraction Helper 
const extractDataFromExcel = async (filePath, network) => {
    // Read the Excel file into memory
    const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // Assuming the first sheet contains the data
    const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

    const extractedData = [];
    const pinPattern = pinPatterns[network]; // Get the specific regex for the network

    // Skip the first row (headers) and iterate through the worksheet
    for (let i = 1; i < worksheet.length; i++) {
        const row = worksheet[i];
        const serial = row[0];  // Serial number in the first column
        const pin = row[1];     // Pin in the second column

        // If serial or pin is missing, stop processing
        if (!serial || !pin) break;

        const serialString = serial.toString().trim();
        const pinString = pin.toString().trim();

        console.log(`Processing row ${i + 1}: Pin = "${pinString}"`);

        // Validate pin pattern
        // if (!pinPattern.test(pinString)) {
        //     throw new Error(`Pin pattern mismatch on row ${i + 1}: ${pinString}`);
        // }

        extractedData.push({ serial: serialString, pin: pinString });
    }

    return extractedData;
};

// Upload Epins from Excel File
const upload_pins_from_excel = async (request, response) => {
    try {
        if (!request.files || !request.files.file) {
            return response.status(400).json({ message: "No file uploaded" });
        }

        const file = request.files.file;
        const { network, denomination } = request.body;

        const filePath = path.join(__dirname, 'uploads', file.name);

        // Save the uploaded file to a temporary location
        await file.mv(filePath);

        // Validate network
        const validNetworks = ['airtel', 'glo', 'mtn', '9mobile'];
        if (!validNetworks.includes(network)) {
            return response.status(400).json({ message: "Invalid network" });
        }

        // Extract data from Excel
        const data = await extractDataFromExcel(filePath, network);

        // Format the pins according to the RechargeCardSchema
        const rechargeCards = data.map(item => ({
            pin: item.pin,
            network: network,
            denomination: parseInt(denomination, 10),
            serial: item.serial,
            isActive: true
        }));

        // Store the formatted pins in the database
        await RechargeCard.insertMany(rechargeCards);

        // Clean up: delete the uploaded file
        fs.unlinkSync(filePath);

        const pinCount = data.length;

        response.json({ message: `Successfully uploaded ${pinCount} pcs of ${network} pins` });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: `Something went wrong: ${error.message}` });
    }

};

// order bulk epins
const buy_pins = async (request, response) => {
    const { quantity, network, amount, denomination } = request.body;
    const price = parseFloat(amount);
    const tax = 0.00;

    try {
        // check if the request is empty
        if (!quantity || quantity == "" || network === "" || amount === "" || denomination === "") {
            response.status(400).json({ message: "Invalid Request" });
            return;
        }

        // check if the user has the right permission to print airtime
        // const user_setting = await Setting.findOne({ user: request.user._id });

        // if (!user_setting || user_setting.airtimePrintingEnabled === false) {
        //     return response.status(400).json({ message: "Invalid Request! Airtime printing is disabled on your account" })
        // };


        // check if the user balance is sufficient
        const wallet = await Wallet.findOne({ user: request.user._id });
        const total_amount = parseFloat(tax + (price * quantity));

        if (wallet.balance < total_amount) {
            response.status(400).json({ message: "Insufficient Balance" });
            return;
        };

        // check if the order is available
        const _network = network.toLowerCase();
        const _denomination = denomination.toLowerCase();

        const pins = await RechargeCard.find({ isActive: true, network: _network, denomination: _denomination }).limit(quantity);


        if (pins.length < quantity) {
            response.status(400).json({ message: `Insufficient ${network} pins` });
            return;
        }

        // When all goes well (pins & balance are sufficient)
        // Charge wallet with amount
        await Wallet.findOneAndUpdate(
            { user: request.user._id },
            { $inc: { balance: -total_amount } }
        );

        // Delete the used pins
        const pinIds = pins.map(pin => pin._id);
        await RechargeCard.deleteMany({ _id: { $in: pinIds } });

        // Create transaction
        await Transaction.create({
            amount: total_amount,
            narration: `Purchased ${quantity} units of ${network} ${denomination} e-Pins`,
            reference_id: uuid(),
            status: "Success",
            user: request.user._id,
            tax: tax,
            type: "Payable",
            logs: [
                {
                    price: price,
                    network: network,
                    denomination: denomination,
                }
            ]
        });

        // Record a new voucher
        await Voucher.create({
            user: request.user._id,
            pins: pins,
            network: _network,
            denomination: parseInt(denomination)
        });

        // send response
        response.status(200).json({ message: `Purchase complete!` });

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: "Server Error" });
    }
};

// order single epin
const buy_pin = async (request, response) => {
    const { denomination, type } = request.body;

    console.log(request.body)
    try {
        // Check if the request is valid
        if (denomination === "" || type === "" || !denomination || !type) {
            return response.status(400).json({ message: "Invalid Request" });
        }

        // Fetch that pin, if it's available
        const pin = await RechargeCard.findOne({ network: type, denomination: parseInt(denomination), isActive: true });

        if (!pin) {
            return response.status(400).json({ message: `Insufficient ${type} ${denomination} e-Pin` });
        }

        // Check wallet balance
        const wallet = await Wallet.findOne({ user: request.user._id });

        if (wallet.balance < parseFloat(denomination)) {
            return response.status(400).json({ message: "Insufficient Balance" });
        }

        // Calculate cashback
        const cash_back = 0.00;

        // Debit wallet
        await Wallet.findOneAndUpdate(
            { user: request.user._id },
            { $inc: { balance: -parseFloat(denomination) } }
        );

        // Credit cashback wallet
        await Wallet.findOneAndUpdate(
            { user: request.user._id },
            { $inc: { cashback: parseFloat(cash_back) } }
        );

        // Delete the used pin
        await RechargeCard.deleteOne({ _id: pin._id });

        // Create transaction
        const transaction = await Transaction.create({
            amount: denomination,
            narration: `Purchased Recharge Pin`,
            reference_id: uuid(),
            status: "Success",
            user: request.user._id,
            type: "Payable",
            logs: [
                {
                    pin: pin.pin,
                    network: pin.network,
                    denomination: pin.denomination,
                    serial: pin.serial
                }
            ]
        });

        // Send response
        return response.status(200).json(transaction);

    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: "Something went wrong! Try again" });
    }
};

// get my purchased vouchers
const get_vouchers = async (request, response) => {
    try {
        const vouchers = await Voucher.find({ user: request.user._id }).sort({ createdAt: -1 });

        response.status(200).json(vouchers)
    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: "Something went wrong! Try again" });
    }
}

export {
    buy_pins,
    create_pin,
    buy_pin,
    get_vouchers,
    upload_pins_from_excel
}

// 550-7752-5161-0547, 554-6289-4282-5813, 558-9032-1835-3633, 554-0471-9321-6207, 552-4849-0692-0484, 559-0399-6794-2239, 550-9780-7886-7207, 554-5576-8760-6803, 555-6331-3079-6124, 557-5312-5534-0944, 555-5912-6557-0860, 559-1429-3035-7145, 558-2195-7995-4538, 556-1906-9065-6660, 552-1983-9836-2160, 551-4753-7308-8833, 557-2522-5988-4601, 554-8204-6794-5842, 552-8893-3573-4970, 554-1410-0598-1896, 555-4376-0357-5146, 550-7169-4866-2896, 555-9258-2785-5931, 555-5562-4144-5154, 550-4556-2457-1584, 551-9186-1250-4857, 556-4763-3969-3775, 558-7683-4944-4984, 559-1442-9629-7606, 558-2537-8854-7276, 555-3688-0543-5640, 556-0191-9551-9638, 554-0156-9073-3151, 558-0431-1028-6093, 558-6749-3605-6156, 550-2429-2144-9954, 558-9380-8986-5385, 551-3724-2345-6406, 550-1730-2382-3239, 552-4875-4877-6588, 557-4558-8020-4878, 557-4153-6779-0575, 552-9726-5880-5920, 550-1971-6971-2230, 551-8609-0040-6357, 557-2705-5312-2720, 555-1226-6356-8446, 551-2512-0102-1618"