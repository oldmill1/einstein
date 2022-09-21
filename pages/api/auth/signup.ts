import get from "lodash/fp/get"
import { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { hash } from "bcrypt"
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

export default async function signupHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Server side email validation:
  const email = get("body.email", req)
  // Search for this email in the database
  // If it exists, return a 400

  // Get the name and validate it using zod schema
  const name = get("body.name", req)
  const nameSchema = z.string().min(1)
  try {
    nameSchema.parse(name)
    // If the name is valid proceed with storing the hash
    // into the database. First grab the hash from the request
    const plaintextPassword = get("body.plaintextPassword", req)
    // then hash it with a salt value of 10
    return hash(plaintextPassword, 10).then(async function (hash) {
      if (hash) {
        // Prepare to save a new user into the database
        // Create a new user object that has the same
        // properties as the Prisma User model in the
        // schema.
        const create = {
          createdAt: new Date(),
          updatedAt: new Date(),
          email,
          name,
          password: hash,
        }
        const newUserCreated = await prisma.user.create({
          data: create,
        })
        return res.status(200).send(newUserCreated)
      } // Else
      return res.status(400).send({ message: "An error occurred." })
    })
  } catch (err) {
    // Return a 400 if zod schema raises an error
    return res
      .status(400)
      .send({ message: "'Name' field provided was invalid." })
  }
}
