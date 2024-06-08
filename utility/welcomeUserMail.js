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
            <p>Thank you for signing up. Find the token to verify your account below:</p>
            <p><strong>${verificationToken}</strong></p>
            <p>Please click on the link below to verify your email:</p>
            <a href="https://doublelinkng.com/verify/email">Verify Email</a>
            <p>Use the above token to verify your account, when you open the link</p>
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

