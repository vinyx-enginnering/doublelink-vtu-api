import PhoneBook from "../../model/bulksms/Phonebook.js";
import mongoose from "mongoose";
import generateSlug from "../../utility/generateSlug.js";


const get_phonebooks = async (request, response) => {
    try {
        // Fetch all phonebooks
        const phonebooks = await PhoneBook.find({ user: request.user }).sort({ createdAt: -1 });

        // Check if phonebooks were found
        response.status(200).json(phonebooks)
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: `Network Error: ${error}` });
    }
};

const get_phonebook = async (request, response) => {
    try {
        const phonebookId = request.params.id;
        const user = request.user;

        // Validate that the provided ID is a valid MongoDB ObjectID
        if (!mongoose.isValidObjectId(phonebookId)) {
            return response.status(400).json({ message: 'Invalid ID' });
        };

        // Find the phonebook by ID
        const phonebook = await PhoneBook.findOne({ _id: phonebookId, user: user });

        // Check if the phonebook with the specified ID was found
        if (phonebook) {
            response.status(200).json(phonebook);
        } else {
            response.status(404).json({ message: 'Phonebook not found.' });
        }
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: `Network Error: ${error}` });
    }
};

const create_phonebook = async (request, response) => {
    try {
        // Extract the data from the request body
        const { name, description, contacts } = request.body;
        const user = request.user;

        let contactArray = [];

        // Check for empty or invalid title, country_code, and country
        if (!name || name === "") {
            response.status(400).json({ message: 'Invalid request! Phonebook Name can not be empty..' })
            return;
        };

        if (!contacts || contacts === "") {
            response.status(400).json({ message: 'Invalid request! Kindly add numbers to your phonebook...' })
            return;
        };


        if (contacts && contacts !== "") {
            contactArray = contacts.split(',').map((contact) => {
                const cleanedContact = contact.trim();
                return cleanedContact;
            });
        }

        const validContacts = contactArray.filter((contact) => /^\d{11}$/.test(contact));
        const invalidContacts = contactArray.filter((contact) => !/^\d{11}$/.test(contact));
        // Check if the slug exist
        const slug = generateSlug(name);
        const phonebookExist = await PhoneBook.findOne({ slug: slug });

        if (phonebookExist) {
            response.status(400).json({ message: 'Invalid request! Phonebook with that name already exist...' });
            return;
        };

        // Create a new phonebook with the valid contacts
        const phonebook = new PhoneBook({
            name,
            slug: slug,
            contacts: validContacts,
            description,
            user: user._id, // Set the user field
        });

        // Set total_contacts if the contacts parameter is not empty
        if (validContacts.length > 0) {
            phonebook.total_contacts = validContacts.length;
        };

        // Save the phonebook to the database
        await phonebook.save();

        // Prepare the response message
        let responseMessage = "";

        if (validContacts.length > 0 || invalidContacts.length > 0) {
            responseMessage = `Your phonebook has been created successfully with ${validContacts.length} valid contacts and ${invalidContacts.length} invalid contacts. Kindly review your invalid contacts, if there are any and update your phonebook accordingly.`;
        } else {
            responseMessage = `Your phonebook has been created successfully.`;
        };

        response.status(201).json({ message: responseMessage, contacts: invalidContacts });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: `Network Error: ${error}` });
    }
};


const update_phonebook = async (request, response) => {
    try {
        const phonebookId = request.params.id;
        const { name, description, contacts } = request.body;
        const user = request.user;

        let contactArray = [];
        const slug = generateSlug(name);

        // Check for empty or invalid request submissions
        if (!name || name === "") {
            response.status(400).json({ message: 'Invalid request! Phonebook Name can not be empty..' })
            return;
        };

        if (!contacts || contacts === "") {
            response.status(400).json({ message: 'Invalid request! Kindly add numbers to your phonebook...' })
            return;
        };

        if (contacts && contacts !== "") {
            contactArray = contacts.split(',').map((contact) => {
                const cleanedContact = contact.trim();
                return cleanedContact;
            });
        };

        const validContacts = contactArray.filter((contact) => /^\d{11}$/.test(contact));
        const invalidContacts = contactArray.filter((contact) => !/^\d{11}$/.test(contact));

        // Validate that the provided ID is a valid MongoDB ObjectID
        if (!mongoose.isValidObjectId(phonebookId)) {
            return response.status(400).json({ message: 'Invalid ID' });
        };

        // Find the existing phonebook by ID
        const existingPhonebook = await PhoneBook.findOne({ _id: phonebookId, user: user });

        // Check if the phonebook with the specified ID was found
        if (!existingPhonebook) {
            response.status(404).json({ message: 'Phonebook not found.' });
            return;
        }

        // Ensure the new phonebook name or slug doesn't already exist, excluding the current record
        const isExisting = await PhoneBook.findOne({
            $or: [{ name }, { slug }],
            _id: { $ne: phonebookId }
        });

        if (isExisting) {
            response.status(400).json({ message: 'Phonebook with the same name or slug already exists' });
            return;
        };

        // Update the phonebook details
        existingPhonebook.name = name;
        existingPhonebook.description = description;

        // Update contacts and total_contacts if the contacts parameter is not empty
        if (validContacts.length > 0) {
            existingPhonebook.contacts = validContacts;
            existingPhonebook.total_contacts = validContacts.length;
        }

        // Save the updated phonebook to the database
        await existingPhonebook.save();

        // Prepare the response message
        let responseMessage = "";

        if (validContacts.length > 0 || invalidContacts.length > 0) {
            responseMessage = `Your phonebook has been updated successfully with ${validContacts.length} valid contacts and ${invalidContacts.length} invalid contacts. Kindly review your invalid contacts and update your phonebook.`;
        } else {
            responseMessage = `Your phonebook has been updated successfully.`;
        };

        response.status(200).json({ message: responseMessage, contacts: invalidContacts });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: `Network Error: ${error}` });
    }
};

const delete_phonebook = async (request, response) => {
    try {
        const phonebookId = request.params.id;
        const user = request.user;

        // Find the existing phonebook by ID
        const existingPhonebook = await PhoneBook.findOne({ _id: phonebookId, user: user });

        // Validate that the provided ID is a valid MongoDB ObjectID
        if (!mongoose.isValidObjectId(phonebookId)) {
            return response.status(400).json({ message: 'Invalid ID' });
        };

        // Check if the phonebook with the specified ID was found
        if (!existingPhonebook) {
            response.status(404).json({ message: 'Phonebook not found.' });
            return;
        };

        // If the user is the owner, delete the phonebook
        await existingPhonebook.remove();

        response.status(200).json({ message: 'Phonebook deleted successfully' });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: `Network Error: ${error}` });
    }
};


export {
    create_phonebook,
    get_phonebook,
    get_phonebooks,
    delete_phonebook,
    update_phonebook
}