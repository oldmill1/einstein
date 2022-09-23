import { NextApiRequest, NextApiResponse } from "next"
import isEqual from "lodash/fp/isEqual"
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
import { validateSignature } from "../../../middleware/middleware"
import { Secret, verify } from "jsonwebtoken"

export default validateSignature(async function eventsHandler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { body, method } = req
  // Handle POST request:
  if (isEqual(method, "POST")) {
    // An event belongs to a user.
    // The user is passed in an authorisation header
    if (!process.env.API_SECRET) {
      return res.status(400).send({ message: "Something went wrong." })
    }
    // Verify the auth token is authentic using jsonwebtoken
    let apiSecret: Secret = process.env.API_SECRET
    return verify(
      req.headers.authorization!,
      apiSecret,
      async function (err, decoded) {
        // Once the auth token is verified, obtain underlying user
        if (!err && decoded) {
          if (decoded.sub && typeof decoded.sub === "string") {
            let id: string
            id = decoded.sub
            const match = await prisma.user.findUnique({
              where: {
                id,
              },
            })
            // This is the underlying user from the authorisation request
            if (match) {
              // Prepare to add a new event to the DB.
              // The information is stored in the body of the request.
              const { startDate, finishDate } = body
              // Finally, insert the new event into the database
              // using the prisma client(), taking note to
              // use `npx prisma generate` at least once.
              const newEventCreated = await prisma.event.create({
                data: {
                  startDate,
                  finishDate,
                  // The new event is connected to the user
                  // that was provided in authorization token
                  user: {
                    connect: {
                      id: match.id,
                    },
                  },
                },
              })
              return res.status(200).send(newEventCreated)
            }
          }
        }
      }
    )
  } // End of "POST" handler
})
