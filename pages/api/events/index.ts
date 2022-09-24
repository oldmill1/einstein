import { NextApiRequest, NextApiResponse } from "next"
import isEqual from "lodash/fp/isEqual"
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
import { validateSignature } from "../../../middleware/middleware"
import { Secret, verify } from "jsonwebtoken"
import { z } from "zod"
import get from "lodash/fp/get"
import compareAsc from "date-fns/compareAsc"

function validateStartFinishDates(
  startDate: Date,
  finishDate: Date
): string | null {
  // Note: Once we encounter an error, we return immediately
  let error: string | null = null
  // Check if required fields are present
  if (!startDate || !finishDate) {
    error = "The field `startDate` or `finishDate` was absent."
    return error
  }
  // Validate the startDate field
  try {
    z.date().parse(startDate)
  } catch (err) {
    error = "The field `startDate` was not a date."
    return error
  }
  // Validate the finishDate field
  try {
    z.date().parse(finishDate)
  } catch (err) {
    error = "The field `finishDate` was not a date."
    return error
  }
  // Error if startDate comes after or lands on finishDate
  if (compareAsc(startDate, finishDate) > -1) {
    error = "Check dates."
    return error
  }
  return error
}

export default validateSignature(async function eventsHandler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { body, method } = req
  if (isEqual(method, "GET")) {
    // Return events
    const events = await prisma.event.findMany()
    return res.status(200).send(events)
  }
  // Handle a POST request...
  if (isEqual(method, "POST")) {
    return await handlePost(req, res)
  } // End of "POST" handler
})

async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const { body, method } = req
  // Unpack the body
  let startDate = get("startDate", body)
  let finishDate = get("finishDate", body)
  if (typeof startDate === "string") {
    startDate = new Date(startDate)
  }
  if (typeof finishDate === "string") {
    finishDate = new Date(finishDate)
  }
  // Validate user input:
  const errorMessage = validateStartFinishDates(startDate, finishDate)
  if (errorMessage) {
    return res.status(400).send({ message: errorMessage })
  }

  // An event belongs to a user.
  // The user is passed in through an authorisation header.
  // Verify that auth token is authentic using jsonwebtoken
  let apiSecret: Secret = process.env.API_SECRET as string
  // Note: Without this return, function doesn't work
  return verify(
    req.headers.authorization!,
    apiSecret,
    async function (err, decoded) {
      // Auth token is verified; Obtain underlying user
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
      // Error during verification
      return res.status(400).send({ message: "Something went wrong." })
    }
  )
}
