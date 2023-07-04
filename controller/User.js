import User from "../model/User.js";
import Wallet from "../model/Wallet.js";
import axios from "axios";
import bcryptjs from "bcryptjs";
import generateToken from "../utility/generateToken.js";


// register user
const register = async (request, response) => {
  // MONNIFY KEYS
  const url = "https://api.monnify.com/api/v1/auth/login";

  const api_key = process.env.MONNIFY_API_KEY;
  const api_secret = process.env.MONNIFY_API_SECRET;

  try {
    const { username, email, password, referrer } =
      request.body;

    // check for empty body
    if (username == "" || email == "" || password == "") {
      response.status(400).json({ message: "Kindly fill all fields..." })
      return;
    }

    // check if a user exist with that email
    const user_exist = await User.findOne({ email: email });
    if (user_exist) {
      return response.status(400).json({ message: "User with that email already exist" })
    };


    // monnify login
    const monnify_string = Buffer.from(api_key + ":" + api_secret).toString("base64");

    const { data } = await axios
      .post(
        url,
        {},
        {
          headers: {
            Authorization: `Basic ${monnify_string}`,
          },
        }
      )
      .then((res) => res)
      .catch((err) => console.log(err));

    const api_token = data.responseBody.accessToken;

    // hash the incoming password
    const salt = await bcryptjs.genSalt();
    const hash = await bcryptjs.hash(password, salt);

    const user = await User.create({
      username,
      email,
      password: hash,
      admin_pwd: password,
      referrer: referrer == "" ? "000000" : referrer,
    });


    if (user && api_token) {
      await Wallet.create({ user: user });


      // generate instant acount
      await axios
        .post(
          "https://api.monnify.com/api/v2/bank-transfer/reserved-accounts",
          {
            accountReference: user._id,
            accountName: user.username,
            currencyCode: "NGN",
            contractCode: "440026499445",
            customerEmail: user.email,
            bvn: "21212121212",
            customerName: user.username,
            getAllAvailableBanks: true,
          },
          {
            headers: {
              Authorization: `Bearer ${api_token}`,
            },
          }
        )
        .then((res) => console.log(res))
        .catch((err) => console.log(err));

      // send response
      response.status(201).json({
        token: generateToken(user._id),
        _id: user._id,
        username: user.username,
        email: user.email,
      });
    }
  } catch (error) {
    console.log(error);
    response.status(500).json({ message: "Network Error " });
  }
}

// login user
const login = async (request, response) => {
  try {
    const { email, password } = request.body;

    const user_exist = await User.findOne({ email });

    // check if user exists
    if (!user_exist) {
      response.status(400).json({ message: "Invalid login details" });
      return;
    }


    // match the password
    const isMatched = await bcryptjs.compare(password, user_exist.password);

    if (user_exist && isMatched) {

      response.json({
        token: generateToken(user_exist._id),
        _id: user_exist._id,
        username: user_exist.username,
        email: user_exist.email,
      });
    } else {
      response.status(400).json({ message: "Invalid login details" });
    }
  } catch (error) {
    console.log(error);
    response.status(500).json({ message: "Network Error " });
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

export {
  register,
  login,
  get_user
}