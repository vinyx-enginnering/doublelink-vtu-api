// controllers/profileController.js
import Profile from '../model/Profile.js';
import fs from 'fs';

// Create or update a profile
const saveProfile = async (request, response) => {
    const {
        type,
        idType,
        businessName,
        businessEmail,
        businessAddress,
        name,
        email,
        address
    } = request.body;
    console.log(request.body)
    const { cacDocument, idCard } = request.files;

    try {
        const profileFields = {
            type,
            idType,
            businessName,
            businessEmail,
            businessAddress,
            name,
            email,
            address,
            status: 'pending',
        };

        const pendingRequest = await Profile.findOne({ user: request.user, status: 'pending' });


        if (pendingRequest) {
            return response.status(400).json({ message: "Hi you already have a pending profile update request" });
        };


        // Handle CAC document upload
        if (cacDocument) {
            // Save the uploaded file
            const cacPath = `uploads/${cacDocument.name}`;
            await cacDocument.mv(cacPath);
            profileFields.cacDocument = cacPath;
        }

        // Handle ID card upload
        if (idCard) {
            // Save the uploaded file
            const idCardPath = `uploads/${idCard.name}`;
            await idCard.mv(idCardPath);
            profileFields.idCard = idCardPath;
        }

        const profile = await Profile.findOneAndUpdate(
            { user: request.user._id },
            { $set: profileFields },
            { upsert: true, new: true }
        );

        response.status(200).json({ message: 'Profile saved successfully', profile });
    } catch (error) {
        // Remove uploaded files in case of an error
        if (cacDocument) {
            fs.unlinkSync(cacPath);
        }
        if (idCard) {
            fs.unlinkSync(idCardPath);
        }

        console.error(error);
        res.status(500).json({ message: 'Network Error' });
    }
};


export {
    saveProfile
}