import User from "../model/User.js";
import Wallet from "../model/Wallet.js";
import generateToken from "../utility/generateToken.js";
import { authenticateMonnify, createMonnifyAccount } from "../utility/monnify.js";
import verifyGoogleIdToken from "../utility/verifyGoogleIdToken.js";

const googleOAuth = async (request, response) => {
  const { credential } = request.body;

  try {
    // Check that the credential is not empty
    if (!credential) {
      return response.status(400).json({ message: "Unauthorized Attempt" });
    }

    // Try to get the user profile from the credential
    const userProfile = await verifyGoogleIdToken(credential);
    // If the credential is valid
    if (!userProfile) {
      response.status(400).json({ message: "Something went wrong" });
    } else {
      // Check if the email already exists in the database
      let user = await User.findOne({ email: userProfile.email });

      // If the email exists
      if (user) {
        // Check the user_type field to determine if it's a Google OAuth user
        if (user.user_type === "google") {
          return response.json({
            token: generateToken(user._id),
            _id: user._id,
            username: user.username,
            email: user.email,
          });
        } else {
          // If it's not a Google OAuth user, handle accordingly
          console.log(error)
          return response.status(400).json({ message: "Email already registered with a password user" });
        }
      }

      // If the email is not registered, create a new user
      user = new User({
        username: userProfile.name,
        email: userProfile.email,
        user_type: "google", // Set the user_type field for Google OAuth user
      });

      // Authenticate with Monnify
      const apiToken = await authenticateMonnify(
        process.env.MONNIFY_API_KEY,
        process.env.MONNIFY_API_SECRET
      );

      // Create the user
      await user.save();

      // Create Monnify account
      await createMonnifyAccount(apiToken, user);

      // Create a wallet for the user
      await Wallet.create({ user: user._id });

      response.json({
        token: generateToken(user._id),
        _id: user._id,
        username: user.username,
        email: user.email,
      });
    }
  } catch (error) {
    console.log(error);
    response.status(500).json({ message: "Network Error" });
  }
};

export { googleOAuth };
