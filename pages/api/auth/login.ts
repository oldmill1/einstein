import { NextApiRequest, NextApiResponse } from "next"
import get from "lodash/fp/get"
import { PrismaClient } from "@prisma/client"
import { emailAndPassMiddleware } from "../../../middleware/middleware"
import { Secret, sign } from "jsonwebtoken"
import { compare } from "bcrypt"
const prisma = new PrismaClient()

export default emailAndPassMiddleware(async function loginHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Search for a user with email provided in request
  const email = get("body.email", req)
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  })
  if (user) {
    // If the user exists, check if the password matches
    // the one provided in the request
    const plaintextPassword = get("body.plaintextPassword", req)
    const success = await compare(plaintextPassword, user.password)
    // If the match is successful
    if (success) {
      // Create a secure key using jsonwebtoken
      const claims = {
        sub: user.id,
        email: user.email,
      }
      let apiSecret: Secret
      if (process.env.API_SECRET) {
        apiSecret = process.env.API_SECRET
        const jwt = sign(claims, apiSecret, {
          expiresIn: "24h",
        })
        // Return the secure key to the client
        return res.status(200).send({ authToken: jwt })
      }
    }
  } // Else:
  return res.status(400).send({
    message: "Something went wrong.",
  })
})
