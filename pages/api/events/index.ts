import { NextApiRequest, NextApiResponse } from "next"
import isEqual from "lodash/fp/isEqual"
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

export async function eventsHandler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { body, method } = req
  // Handle POST request:
  if (isEqual(method, "POST")) {
    // Client needs a new event inserted into the DB.
    // The request has the info to create a new event,
    // but it is only partially complete. A user object
    // needs to be fetched to verify if id exists first.
    const exists = await prisma.user.findUnique({
      where: {
        id: body.user.id,
      },
    })
    // The user is not found in our DB,
    // therefore, the event cannot be created.
    if (!exists) {
      return res.status(400).send({ message: "Something went wrong." })
    }
    // The user exists in the database...
    // Prepare to add a new event to the DB.
    // It is stored in the body of the request.
    const { startDate, finishDate } = body
    // Insert the new event into the database
    // using the prisma client(), taking note to
    // use `npx prisma generate` at least once.
    const newEventCreated = await prisma.event.create({
      data: {
        startDate,
        finishDate,
        // The new event is connected to the user
        // that was provided in request.user.id
        user: {
          connect: {
            id: exists.id,
          },
        },
      },
    })
    return res.status(200).send(newEventCreated)
  } // End of "POST" handler
}
