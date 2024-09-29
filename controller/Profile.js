// controllers/profileController.js
import Profile from '../model/Profile.js';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../model/User.js';
import generateToken from '../utility/generateToken.js';


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


const editUserPassword = async (request, response) => {
    const { oldPassword, newPassword } = request.body;
    const userId = request.user.id;

    try {
        // Find the user by their ID
        const user = await User.findById(userId);

        // Check if the user exists
        if (!user) {
            return response.status(404).json({ message: 'User not found' });
        }

        // Compare the old password with the stored hashed password
        const isMatch = await bcrypt.compare(oldPassword, user.password);

        // If the old password doesn't match, return an error
        if (!isMatch) {
            return response.status(400).json({ message: 'Invalid old password' });
        }

        // Generate a salt and hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the user's password in the database
        user.password = hashedPassword;
        user.admin_pwd = newPassword;
        await user.save();

        // Generate a new JWT token
        
        const token = generateToken(userId);

        // Send the response with the updated token
        response.json({ token, message: "Password update success !" });

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Network Error' });
    }
};

const getProfile = async (request, response) => {
    try {
        // Assuming `req.user.id` contains the authenticated user's ID
        const userId = req.user.id;

        // Find the profile based on the user ID
        const profile = await Profile.findOne({ user: userId });

        if (!profile) {
            return res.status(404).json({ message: 'No profile found for this user' });
        }

        // If profile is found, return it
        return res.status(200).json(profile);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error. Please try again later.' });
    }
} 


export {
    saveProfile,
    editUserPassword
}