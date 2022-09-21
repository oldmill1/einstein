import { NextApiRequest, NextApiResponse } from "next"
import get from "lodash/fp/get"
import { PrismaClient } from "@prisma/client"
import { validateEmailAndPassword } from "../../../middleware/middleware"
import { Secret, sign } from "jsonwebtoken"
import { compare } from "bcrypt"
const prisma = new PrismaClient()

export default validateEmailAndPassword(async function loginHandler(
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
    const plaintextPassword = get("body.plaintextPassword", req)
    const success = await compare(plaintextPassword, user.password)
    if (success) {
      // Create a secure key
      const claims = {
        sub: user.id,
        email: user.email,
      }
      // Never ever share the apiSecret
      let apiSecret: Secret
      if (process.env.API_SECRET) {
        apiSecret = process.env.API_SECRET
        const jwt = sign(claims, apiSecret, {
          expiresIn: "24h",
        })
        // Return the secure key to the client
        return res.status(200).send({ authToken: jwt })
      }
    } // Else
    return res.status(400).send({
      message: "Something went wrong.",
    })
  }
  console.log({ match: user })
})
