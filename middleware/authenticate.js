import jsonwebtoken from "jsonwebtoken";
import User from "../model/User.js";

const authenticate = async (req, res, next) => {
    const token = req.headers["token"];

    try {
        // check if token exist
        if (!token)
            return res.status(400).json({ message: "Please login, create an account" });

        // if there is a token, then verify it
        const decodedToken = jsonwebtoken.verify(token, process.env.JWT);

        // grab the the user
        const user = await User.findOne({ _id: decodedToken.id }).select(
            "-password"
        );

        // assign to the request object the authorized user
        req.user = user;

        // move on
        next();
    } catch (error) {
        //If token is not valid, respond with 401 (unauthorized)
        console.log(error);
        res.status(401).json({ message: "Invalid Token..." });
        return;
    }
};

export { authenticate };