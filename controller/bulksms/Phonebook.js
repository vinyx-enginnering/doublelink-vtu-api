import PhoneBook from "../../model/bulksms/Phonebook.js";
import User from "../../model/User.js";


const get_phonebooks = async (request, response) => {
    try {
        // Fetch all phonebooks
        const phonebooks = await PhoneBook.find().sort({ createdAt: -1 });

        // Check if phonebooks were found
        if (phonebooks.length > 0) {
            response.status(200).json({ phonebooks });
        } else {
            response.status(404).json({ message: 'No phonebooks found.' });
        }
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: `Network Error: ${error}` });
    }
};

const get_phonebook = async (request, response) => {
    try {
        const phonebookId = request.params.id;
        const user = request.user;

        // Find the phonebook by ID
        const phonebook = await PhoneBook.findOne({ _id: phonebookId, user: user });

        // Check if the phonebook with the specified ID was found
        if (phonebook) {
            response.status(200).json({ phonebook });
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
        const { title, contacts, country_code, country } = request.body;
        const user = request.user;

        let contactArray = [];

        if (contacts && contacts !== "") {
            contactArray = contacts.split(',').map((contact) => {
                const cleanedContact = contact.trim();
                return cleanedContact;
            });
        }

        const validContacts = contactArray.filter((contact) => /^\d{10}$/.test(contact));
        const invalidContacts = contactArray.filter((contact) => !/^\d{10}$/.test(contact));

        // Check for empty or invalid title, country_code, and country
        const errors = [];

        if (!title || title === "") {
            errors.push('Title cannot be empty.');
        }

        if (!country_code || country_code === "") {
            errors.push('Country code cannot be empty.');
        }

        if (!country || country === "") {
            errors.push('Country cannot be empty.');
        }

        // If there are validation errors, return a 400 "Bad Request" response
        if (errors.length > 0) {
            response.status(400).json({ message: 'Invalid request. Please make the following corrections:', errors });
            return;
        }

        // Create a new phonebook with the valid contacts
        const phonebook = new PhoneBook({
            title,
            contacts: validContacts,
            country_code,
            country,
            user, // Set the user field
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
            responseMessage = `Your phonebook has been created successfully with ${validContacts.length} valid contacts and ${invalidContacts.length} invalid contacts. Kindly review your invalid contacts and update your phonebook.`;
        } else {
            responseMessage = `Your phonebook has been created successfully.`;
        };

        response.status(201).json({ message: responseMessage, phonebook });
    } catch (error) {
        console.error(error);
        response.status(500).json({ message: `Network Error: ${error}` });
    }
};

const update_phonebook = async (request, response) => {
    try {
        const phonebookId = request.params.id;
        const { title, contacts, country_code, country } = request.body;
        const user = request.user;

        let contactArray = [];

        if (contacts && contacts !== "") {
            contactArray = contacts.split(',').map((contact) => {
                const cleanedContact = contact.trim();
                return cleanedContact;
            });
        };

        const validContacts = contactArray.filter((contact) => /^\d{10}$/.test(contact));
        const invalidContacts = contactArray.filter((contact) => !/^\d{10}$/.test(contact));

        // Check for empty or invalid title, country_code, and country
        const errors = [];

        if (!title || title === "") {
            errors.push('Title cannot be empty.');
        }

        if (!country_code || country_code === "") {
            errors.push('Country code cannot be empty.');
        }

        if (!country || country === "") {
            errors.push('Country cannot be empty.');
        }

        // If there are validation errors, return a 400 "Bad Request" response
        if (errors.length > 0) {
            response.status(400).json({ message: 'Invalid request. Please make the following corrections:', errors });
            return;
        }

        // Find the existing phonebook by ID
        const existingPhonebook = await PhoneBook.findOne({ _id: phonebookId, user: user });

        // Check if the phonebook with the specified ID was found
        if (!existingPhonebook) {
            response.status(404).json({ message: 'Phonebook not found.' });
            return;
        }

        // Ensure that the user has permission to update the phonebook (e.g., ownership check)

        // Update the phonebook details
        existingPhonebook.title = title;
        existingPhonebook.country_code = country_code;
        existingPhonebook.country = country;

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

        response.status(200).json({ message: responseMessage, invalidContacts });
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