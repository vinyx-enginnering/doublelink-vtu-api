
import User from '../model/User.js';
import Wallet from '../model/Wallet.js';
import bcryptjs from 'bcryptjs';
import generateToken from '../utility/generateToken.js';
import { authenticateMonnify, createMonnifyAccount } from '../utility/monnify.js';

import { sendVerificationEmail } from "../utility/emailService.js";
import Setting from '../model/Setting.js';

const register = async (request, response) => {
  // MONNIFY KEYS
  const api_key = process.env.MONNIFY_API_KEY;
  const api_secret = process.env.MONNIFY_API_SECRET;

  try {
    const { username, email, password, referrer } = request.body;

    // Check for empty body
    if (!username || !email || !password) {
      return response.status(400).json({ message: 'Kindly fill all fields...' });
    }

    // Check if a user exists with that email
    const userExists = await User.findOne({ email });
    if (userExists) {
      return response.status(400).json({ message: 'Customer with that email already exists' });
    };

    // Generate a verification token
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Authenticate with Monnify
    const apiToken = await authenticateMonnify(api_key, api_secret);

    // Hash the incoming password
    const salt = await bcryptjs.genSalt();
    const hash = await bcryptjs.hash(password, salt);

    // Create the user
    const user = await User.create({
      username,
      email,
      password: hash,
      admin_pwd: password,
      referrer: referrer || '000000',
      verification_token: verificationToken,
    });

    // Create Monnify account
    await createMonnifyAccount(apiToken, user);

    // Create a wallet for the user
    await Wallet.create({ user: user._id });

    // Create User Setting
    await Setting.create({user: user._id});

    // Send the verification email
    await sendVerificationEmail(email, verificationToken, user);

    response.status(201).json({ message: 'Your account is created successfully! We have sent you an email to verify your account' });

  } catch (error) {
    console.log(error);
    response.status(500).json({ message: 'Network Error' });
  }
};

// login user
const login = async (request, response) => {
  try {
    const { email, password } = request.body;

    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      return response.status(400).json({ message: "Invalid login details" });
    };

    // Check the user_type field to determine if it's a Google OAuth user
    if (user.user_type === "google") {
      return response.status(400).json({ message: "Login with Google" });
    };

    // Check the user_type field to determine if it's a Google OAuth user
    if (user.verified === false) {
      return response.status(400).json({ message: "Hi, your account is un-verified!" });
    }

    // Match the password
    const isMatched = await bcryptjs.compare(password, user.password);

    if (isMatched) {
      response.json({
        token: generateToken(user._id),
        _id: user._id,
        username: user.username,
        email: user.email,
      });
    } else {
      response.status(400).json({ message: "Invalid login details" });
    }
  } catch (error) {
    console.log(error);
    response.status(500).json({ message: "Network Error" });
  }
};


// get user
const get_user = async (request, response) => {
  try {
    const user = await User.findOne({ _id: request.user })
      .select(["-password", "-admin_pwd"]);

    response.status(200).json(user);
  } catch (error) {
    console.log(error);
    response.status(500).json({ message: "Network Error " });
  }
};

const verification = async (request, response) => {
  try {
    const { token } = request.body;

    if (!token) {
      return response.status(400).json({ message: 'Provide a valid token' });
    }

    // Find the user with the given verification token
    const user = await User.findOne({ verification_token: token });

    if (!user) {
      return response.status(400).json({ message: 'Invalid verification token' });
    }

    // Mark the user as verified
    user.verified = true;
    user.verification_token = undefined;
    await user.save();

    response.status(200).json({ message: "Email verified successfully, Proceed to login" });
  } catch (error) {
    console.error(error);
    response.status(500).json({ message: 'Network Error' });
  }
};

const resend_verification_token = async (request, response) => {
  const { email } = request.body;
  try {

    if (email === '') {
      return response.status(400).json({ message: "Write your registered email!" });
    };

    const userExists = await User.findOne({
      $and: [
        { email: email },         // Check if the email matches
        { user_type: "password" } // Check if the user_type is "password"
      ]
    });

    if (!userExists) {
      return response.status(400).json({ message: "Invalid mail! Use your registered email" })
    };

    // generate token
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();


    // Send the verification email
    await sendVerificationEmail(email, verificationToken);


    userExists.verification_token = verificationToken;

    await userExists.save();

    response.status(200).json({ message: "We've delivered a new token to your mail" })


  } catch (error) {
    console.error(error);
    response.status(500).json({ message: 'Network Error' });
  }
}

export {
  register,
  login,
  get_user,
  verification,
  resend_verification_token
}