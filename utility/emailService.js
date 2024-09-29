import { createTransport } from "nodemailer";


const transporter = createTransport({
    host: "smtp-relay.brevo.com",
    secure: false,
    port: 587,
    auth: {
        user: "elechigeorgepro@gmail.com",
        pass: `zEb5mqJOP4R78FdA`,
    }
})

const sendVerificationEmail = async (email, verificationToken, user) => {
    // Define the email message
    const mailOptions = {
        from: "Doublelink Online <onboarding@doublelinkng.com>",
        to: [email],
        subject: `Hello ${user.username} | Verify your account`,
        html: `
                    <div style="background-color: #f3f3f3; padding: 1px; text-align: center;">
            <div style="display: inline-block; background-color: #fff; font-size: 20px; border-radius: 10px; text-align: left;">
                <div style="background-color: #5e17eb; color: white; padding: 10px;">
                    <h2 style="margin: 0;">Doublelink <span>Online</span></h2>
                </div>
                <p style="margin-left: 10px">Hello, ${user.username}</p>
                <p style="padding: 10px 10px;">Thank you for signing up. Find the token to verify your account below:</p>
                <p style="padding: 10px; font-size: 30px; font-weight: bold; color: #007bff;">${verificationToken}</p>
                <p style="padding: 10px;">Please click on the link below to verify your email:</p>
                <a href="https://doublelinkonline.com.ng/verify-email" style="display: inline-block; background-color: #5e17eb; color: white; text-decoration: none; padding: 10px 20px; margin-bottom: 10px; margin-left: 10px;">Verify Email</a>
                <p style="padding: 10px;">Use the above token to verify your account, when you open the link</p>

                <div style="background-color: #737373; color: #f1f1f1; padding: 10px; ">
                    <p style="margin: 0; font-size: 15px; text-align: center;">© 2024 Doublelink Telecommunication Limited. All Rights Reserved. Suite 32, Premier Plaza, Otta</p>
                    <p style="margin: 0; font-size: 15px; text-align: center;">This email was sent to ${user.email}.</p>
                </div>
            </div>
        </div>
            `,
            };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });

}

export {
    sendVerificationEmail
}

