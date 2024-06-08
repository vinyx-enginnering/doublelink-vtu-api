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
            from: "Doublelink Online <no-reply@doublelinkng.com>",
            to: email,
            subject: `Hello ${user.username} | Reset your account password`,
            html: `
                <div style="background-color: #f3f3f3; padding: 1px; text-align: center;">
                    <div style="display: inline-block; background-color: #fff; font-size: 20px; border-radius: 10px; text-align: left;">
                        <div style="background-color: #5e17eb; color: white; padding: 10px; border-top-left-radius: 10px; border-top-right-radius: 10px;">
                            <h2 style="margin: 0;">Doublelink <span>Online</span></h2>
                        </div>
                        <p style="margin-left: 10px">Hello, ${user.username}</p>
                        <p style="padding: 10px 10px;">We received a request to reset your password.</p>
                        <p style="padding: 10px; font-size: 30px; font-weight: bold; color: #007bff;">Your reset code is: <span style="background-color: #f0f0f0; padding: 3px;">${resetToken}</span></p>
                        <p style="padding: 10px;">Visit the link here and use the code above <a href='https://doublelinkonline.com.ng/change-password' style="color: #007bff;">Change Password</a></p>
                        <p style="padding: 10px;">Please use this code to reset your password.</p>

                        <div style="background-color: #737373; color: #f1f1f1; padding: 10px; border-bottom-left-radius: 10px; border-bottom-right-radius: 10px;">
                            <p style="margin: 0; font-size: 15px; text-align: center;">© 2024 Doublelink Telecommunication Limited. All Rights Reserved, Suite 32, Premier Plaza, Otta</p>
                            <p style="margin: 0; font-size: 15px; text-align: center;">This email was sent to ${user.email}.</p>

                        </div>
                    </div>
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
