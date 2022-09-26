import get from "lodash/fp/get"
import { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { hash } from "bcrypt"
import { PrismaClient } from "@prisma/client"
import { emailAndPassMiddleware } from "../../../middleware/middleware"
const prisma = new PrismaClient()

/**
 * Sign up
 *
 * This method has a side effect:
 * It creates a user in the database.
 *
 * If the values provided in the request
 * are invalid, it returns various error
 * responses to the client.
 *
 * Test: tests/signup.test.ts
 */
export default emailAndPassMiddleware(async function signupHandler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  // Check to see if value for name was provided
  // If not, inform the user with an error
  const name = get("body.name", req)
  if (!name) {
    return res.status(400).send({ message: "`Name` field provided was empty." })
  }
  // By the time you get email here, it is already validated
  const email = get("body.email", req)
  // Search for this email in the database
  const match = await prisma.user.findUnique({
    where: {
      email,
    },
  })
  // If it exists, the user has already signed up
  // and already has an account, so return a 400
  if (match) {
    // Note: Don't tell the client the reason for the
    // error because of security reasons.
    return res.status(400).send({ message: "Something went wrong." })
  }
  // Grab the name from the request
  // and validate it using Zod
  // In this case, we are just checking to see
  // if the name value contains anything
  const nameSchema = z.string().min(1)
  try {
    // Check if the name is valid.
    nameSchema.parse(name)
    // Proceed with storing the hash
    // into the database.
    // 1. Grab the user's password from their request
    const plaintextPassword = get("body.plaintextPassword", req)
    // 2. `hash` it with a salt value of 10
    // (Could go up to 12, potentially)
    return hash(plaintextPassword, 10).then(async function (hash) {
      if (hash) {
        // If the password was successfully hashed:
        // 1. Create an object adhering to schema.prisma
        const create = {
          createdAt: new Date(),
          updatedAt: new Date(),
          email,
          name,
          password: hash,
        }
        // 2. Use primaClient() defined above to
        // create the new document.
        const newUserCreated = await prisma.user.create({
          data: create,
        })
        if (newUserCreated) {
          // 3. Return the response returned from prisma
          return res.status(200).send(newUserCreated)
        }
      } // Else
      return res.status(400).send({ message: "Something went wrong." })
    })
  } catch (err) {
    // Return a 400 if zod schema complains about name
    return res
      .status(400)
      .send({ message: "'Name' field provided was invalid." })
  }
})
