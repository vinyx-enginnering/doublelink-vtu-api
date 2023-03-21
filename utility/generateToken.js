import jwt from "jsonwebtoken";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT, { expiresIn: "1h" });
};

export default generateToken;