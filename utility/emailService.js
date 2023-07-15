import { Resend } from "resend";


const sendVerificationEmail = async (email, verificationToken) => {
    const resend = new Resend("re_123456789");

    const data = await resend.emails.send({
        from: "Doublelink <account@doublelinkng.com>",
        to: [email],
        subject: "Account Verification",
        html: `<p>Thank you for signing up. Please verify your email by clicking the following link:</p>
          <a href="https://doublelink.vercel.app/verify/${verificationToken}">Verify Email</a>`,
    });

    return data;

}

export {
    sendVerificationEmail
}
