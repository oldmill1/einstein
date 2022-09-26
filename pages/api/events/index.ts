import { NextApiRequest, NextApiResponse } from "next"
import isEqual from "lodash/fp/isEqual"
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
import { validateSignature } from "../../../middleware/middleware"
import { Secret, verify } from "jsonwebtoken"
import { z } from "zod"
import get from "lodash/fp/get"
import compareAsc from "date-fns/compareAsc"
import isEmpty from "lodash/fp/isEmpty"
const validObjectId = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i

interface iValidateUserInput {
  data: {
    startDate: Date
    finishDate: Date
  } | null
  errorMessage: string | null
}
function validateUserInput(req: NextApiRequest): iValidateUserInput {
  // Unpack the body
  const body = get("body", req)
  const startsAt = get("startDate", body)
  const finishesAt = get("finishDate", body)
  // Turn params into Date objects
  const startDate: Date = new Date(startsAt)
  const finishDate: Date = new Date(finishesAt)
  // Validate user input:
  const errorMessage: string | null = validateStartFinishDates(
    startDate,
    finishDate
  )
  if (errorMessage) {
    return {
      data: null,
      errorMessage: errorMessage,
    }
  }
  return {
    data: {
      startDate,
      finishDate,
    },
    errorMessage: null,
  }
}

function validateStartFinishDates(
  startDate: Date,
  finishDate: Date
): string | null {
  // Note: Once we encounter an error, we return immediately
  let error: string | null = null
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

/**
 * Handler for /events
 * GET: Returns a list of event records, filtered optionally by a POST body.
 * POST: Creates a new event
 * Tests: tests/events.test.js
 */
export default validateSignature(async function eventsHandler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const method = get("method", req)
  // Handle GET request:
  // Return a list of records.
  if (isEqual(method, "GET")) {
    return await getHandler(req, res)
  }
  // Handle a POST request:
  // Create a new record.
  if (isEqual(method, "POST")) {
    return await postHandler(req, res)
  }

  // Handle an UPDATE request:
  // Updates an existing record.
  if (isEqual(method, "UPDATE")) {
    return await updateHandler(req, res)
  }

  return res.status(400).send({
    message: "Something went wrong.",
  })
})

async function updateHandler(req: NextApiRequest, res: NextApiResponse) {
  // Takes raw user input
  const body = get("body", req)
  const { data, errorMessage } = validateUserInput(req)
  if (errorMessage) {
    return res.status(400).send({ message: errorMessage })
  }
  // Returns clean data back
  const startDate = get("startDate", data)
  const finishDate = get("finishDate", data)
  // Grab the ObjectId we want to query against from the body of the request.
  const id = get("id", body)
  // Check if event ID is a valid object id.
  if (typeof id === "string" && validObjectId.test(id)) {
    // Query the event table for the id provided in the request
    const event = await prisma.event.findUnique({
      where: {
        id,
      },
    })
    // Note: Standard boilerplate-ish code coming up; It verifies a jsw token
    // The sample here is taken from the official documentation from jsonwebtoken
    if (event) {
      // Note: `validateSignature` has verified the request is authentic
      // We just need to check if the request is signed by the same
      // user as the userId on the event obtained earlier
      let apiSecret: Secret = process.env.API_SECRET as string
      return verify(
        req.headers.authorization!,
        apiSecret,
        async function (err, decoded) {
          if (!err && decoded) {
            const eventUserId = get("userId", event)
            const sub = get("sub", decoded)
            if (isEqual(sub, eventUserId)) {
              // The user here has permission to update the event
              // Finally, we can update using the prima client
              const updatedEvent = await prisma.event.update({
                where: {
                  id,
                },
                data: {
                  startDate,
                  finishDate,
                },
              })
              if (updatedEvent) {
                return res.status(200).send(updatedEvent)
              }
            }
          }
          // Error during verification
          return res.status(400).send({ message: "Something went wrong." })
        }
      )
    }
  }
  // Else All:
  return res.status(400).send({
    message: "Something went wrong.",
  })
}

// Handle GET requests to /events
// Returns an optionally filtered list of records.
// Performs a findMany Prisma query.
async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  // Check for filters (passed in using query params)
  const { query } = req
  // Return some events if no filters present in the request.
  if (isEmpty(query)) {
    // Get some events using prisma and return using res.
    const events = await prisma.event.findMany()
    return res.status(200).send(events)
  }
  // Handle Filters:
  // Filter: userId
  // If the `userId` filter is present, only return events
  // that belong to that person.
  const userId = get("userId", query)
  // Note: The way this is, filters cannot be "combined".
  // A filter, once present, RETURNS.
  if (userId && typeof userId === "string" && validObjectId.test(userId)) {
    const events = await prisma.event.findMany({
      where: {
        userId,
      },
    })
    return res.status(200).send(events)
  }
  // Date Filters:
  // Get a list of events using date EQUALS
  const date = get("date", query)
  if (date && typeof date === "string") {
    const events = await prisma.event.findMany({
      where: {
        startDate: {
          equals: new Date(date),
        },
      },
    })
    return res.status(200).send(events)
  }
  // Get a list of events using interval
  const interval = get("interval", query)
  if (interval && typeof interval === "object") {
    const lte = get("lte", interval) as string
    const gte = get("gte", interval) as string
    const events = await prisma.event.findMany({
      where: {
        startDate: {
          lte: new Date(lte),
          gte: new Date(gte),
        },
      },
    })
    return res.status(200).send(events)
  }
  // Get a list of events using gte
  const gte = get("gte", query)
  if (gte && typeof gte === "string") {
    const events = await prisma.event.findMany({
      where: {
        startDate: {
          gte: new Date(gte),
        },
      },
    })
    return res.status(200).send(events)
  }
  // Get a list of events using lte
  const lte = get("lte", query)
  if (lte && typeof lte === "string") {
    const events = await prisma.event.findMany({
      where: {
        startDate: {
          lte: new Date(lte),
        },
      },
    })
    return res.status(200).send(events)
  }
  // Else All:
  return res.status(400).send({
    message: "Something went wrong.",
  })
}

// Handle POST requests to /events
// Creates a new event record.
// Performs a create Primsa query.
async function postHandler(req: NextApiRequest, res: NextApiResponse) {
  // Validate user input:
  const { data, errorMessage } = validateUserInput(req)
  if (errorMessage) {
    return res.status(400).send({ message: errorMessage })
  }
  const startDate = get("startDate", data)
  const finishDate = get("finishDate", data)
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
            if (startDate && finishDate) {
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
      // Error during verification
      return res.status(400).send({ message: "Something went wrong." })
    }
  )
}
