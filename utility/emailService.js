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

const sendVerificationEmail = async (email, verificationToken) => {
    // Define the email message
    const mailOptions = {
        from: "Doublelink <onboarding@doublelinkng.com>",
        to: [email],
        subject: "Account Verification",
        html: `<p>Thank you for signing up. Please verify your email by clicking the following link:</p>
          <a href="https://doublelink.vercel.app/verify/${verificationToken}">Verify Email</a>`,
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

