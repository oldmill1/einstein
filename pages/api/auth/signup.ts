import get from "lodash/fp/get"
import { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { hash } from "bcrypt"
import { PrismaClient } from "@prisma/client"
import { validateEmailAndPassword } from "../../../middleware/middleware"
const prisma = new PrismaClient()

export default validateEmailAndPassword(async function signupHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // By the time you get email here, it is already validated
  const email = get("body.email", req)
  // Search for this email in the database
  // If it exists, return a 400
  const match = await prisma.user.findUnique({
    where: {
      email,
    },
  })

  if (match) {
    return res.status(400).send({ message: "An error occurred." })
  }
  // Get the name and validate it using the zod schema
  const name = get("body.name", req)
  const nameSchema = z.string().min(1)
  try {
    nameSchema.parse(name)
    // If the name is valid proceed with storing the hash
    // into the database.
    // 1. Grab the user's password from their request
    const plaintextPassword = get("body.plaintextPassword", req)
    // 2. `hash` it with a salt value of 10
    // (Could go up to 12 potentially in production)
    return hash(plaintextPassword, 10).then(async function (hash) {
      if (hash) {
        // If the password was successfully hashed,
        // prepare to create a new user into the database
        // 1. Create an object adhering to schema.prisma
        const create = {
          createdAt: new Date(),
          updatedAt: new Date(),
          email,
          name,
          password: hash,
        }
        // 2. Insert using the primaClient() defined above
        const newUserCreated = await prisma.user.create({
          data: create,
        })
        // 3. Return the response returned from prisma
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
})
