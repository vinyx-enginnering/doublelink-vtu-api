import { createTransport } from "nodemailer";


const transporter = createTransport({
    host: "smtp-relay.sendinblue.com",
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
        from: "Doublelink Online <onboarding@doublelinkonline.com.ng>",
        to: [email],
        subject:    `Welcome  ${user.name} | `,
        html: `
        <div style="background-color: #f3f3f3; padding: 1px; text-align: center;">
            <div style="display: inline-block; background-color: #fff; font-size: 20px; border-radius: 10px; text-align: left;">
                <div style="background-color: #5e17eb; color: white; padding: 10px;">
                    <h2 style="margin: 0;">Doublelink <span>Online</span></h2>
                </div>
            <p>Thank you for signing up. Find the token to verify your account below:</p>
            <p><strong>${verificationToken}</strong></p>
            <p>Please click on the link below to verify your email:</p>
            <a href="https://doublelinkng.com/verify/email">Verify Email</a>
            <p>Use the above token to verify your account, when you open the link</p>

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

