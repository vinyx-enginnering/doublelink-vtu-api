import User from "../model/User.js";
import bcrypt from "bcryptjs";
import { createTransport } from "nodemailer";

const transporter = createTransport({
    host: "smtp-relay.sendinblue.com",
    secure: false,
    port: 587,
    auth: {
        user: "elechigeorgepro@gmail.com",
        pass: `zEb5mqJOP4R78FdA`,
    }
});

const PasswordResetRequest = async (request, response) => {
    const { email } = request.body;

    try {
        // validate user input
        if (!email || email === '') {
            return response.status(400).json({ message: "Kindly provide a valid email" });
        }

        // verify the email is linked to an account
        const user = await User.findOne({ email });
        if (!user) {
            return response.status(404).json({ message: "No user found with this email" });
        }

        // generate 5 digit token
        const resetToken = Math.floor(100000 + Math.random() * 900000);

        // Save the token to the user account i.e. reset_token
        user.reset_token = resetToken;
        await user.save();

        // Send reset token
        const mailOptions = {
            from: "Doublelink <onboarding@doublelinkng.com>",
            to: email,
            subject: "Password Reset Request",
            html: `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <p>We received a request to reset your password.</p>
                    <p style="font-weight: bold; color: #007bff;">Your verification code is: <span style="background-color: #f0f0f0; padding: 3px;">${resetToken}</span></p>
                    <p>Visit the link here and use the code above <a href='https://doublelinkonline.com.ng/change-password' style="color: #007bff;">Change Password</a></p>
                    <p>Please use this code to reset your password.</p>
                </div>
                `,
        };

        await transporter.sendMail(mailOptions);

        response.status(200).json({ message: "Password reset code sent successfully" });

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Network Error' });
    }
};

const PasswordReset = async (request, response) => {
    const { email, password, confirmPassword, token } = request.body;

    try {
        // Validate user input
        if (!email || email === '' || !password || password === '' || !token || token === '') {
            return response.status(400).json({ message: "Invalid submission! check your credentials and try again" });
        };

        if (password !== confirmPassword) {
            return response.status(400).json({ message: "Invalid submission! passwords dont match" });
        }

        // Find user by email and reset_token
        const user = await User.findOne({ email, reset_token: token });

        if (!user) {
            return response.status(404).json({ message: "Invalid email or token" });
        }

        // Validate new password
        if (password.length < 6) {
            return response.status(400).json({ message: "New password must be at least 6 characters long" });
        }

        // Encrypt the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update user's password and reset_token
        user.password = hashedPassword;
        user.reset_token = null;
        await user.save();

        response.status(200).json({ message: "Password reset successful" });

    } catch (error) {
        console.error(error);
        response.status(500).json({ message: 'Network Error' });
    }
};


export {
    PasswordResetRequest,
    PasswordReset
};
