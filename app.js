import { randomBytes } from "crypto";
const secret = randomBytes(16).toString("hex");

console.log(secret);
