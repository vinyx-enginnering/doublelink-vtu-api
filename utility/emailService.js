import { Resend } from "resend";


const sendVerificationEmail = async (email, verificationToken) => {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const data = await resend.emails.send({
        from: "Doublelink <onboarding@resend.dev>",
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
