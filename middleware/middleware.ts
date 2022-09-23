import { NextApiHandler, NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import get from "lodash/fp/get"
import { Secret, verify } from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

export function validateEmailAndPassword(fn: NextApiHandler) {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    const email = get("body.email", req)
    if (!email) {
      res.status(400).send({ message: "`Email` field provided was empty." })
      return
    }
    const pass = get("body.plaintextPassword", req)
    if (!pass) {
      return res
        .status(400)
        .send({ message: "`plaintextPassword` field provided was empty." })
    }
    try {
      z.string().email().parse(email)
      return await fn(req, res)
    } catch (err) {
      return res
        .status(400)
        .send({ message: "`Email` field provided was invalid." })
    }
  }
}

export function validateSignature(fn: NextApiHandler) {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    if (!process.env.API_SECRET) {
      return res.status(400).send({ message: "Something went wrong." })
    }
    // Verify the auth token is authentic using jsonwebtoken
    let apiSecret: Secret = process.env.API_SECRET
    return verify(
      req.headers.authorization!,
      apiSecret,
      async function (err, decoded) {
        if (!err && decoded) {
          if (decoded.sub && typeof decoded.sub === "string") {
            // Check if this person exists in our database
            // Use Prisma Client to perform the search.
            // Proceed only if user exists in DB.
            let id: string
            id = decoded.sub
            const match = await prisma.user.findUnique({
              where: {
                id,
              },
            })
            if (match) {
              return await fn(req, res)
            } // Error matching:
            return res.status(401).send({ message: "Not authorized." })
          }
        } // Error verifying:
        return res.status(401).send({ message: "Not authorized." })
      }
    )
  }
}
