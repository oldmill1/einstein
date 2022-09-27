import { NextApiRequest, NextApiResponse } from "next"
import isEqual from "lodash/fp/isEqual"
import { PrismaClient } from "@prisma/client"
import {
  deleteEventMiddleware,
  validateObjectId,
} from "../../../middleware/middleware"

const prisma = new PrismaClient()

/**
 * Request handler for /events/[id]
 * Methods allowed: GET, DELETE
 * Tests: /tests/events.test.ts
 *
 * @param req
 * @param res
 */
export default async function eventHandler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { method } = req
  // Handle GET:
  if (isEqual(method, "GET")) {
    return await getHandler(req, res)
  }
  // Handle DELETE:
  if (isEqual(method, "DELETE")) {
    return await deleteHandler(req, res)
  }
  // Method not allowed is called a 405
  return res.status(405).send({
    message: "Something went wrong",
  })
}

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  // Validate the input
  const { id, errorMessage } = validateObjectId(req)
  if (errorMessage) {
    return res.status(400).send({ message: errorMessage })
  }
  // When the input is validated...
  // Get the ID from the query
  const event = await prisma.event.findUnique({
    where: {
      id,
    },
  })
  if (event) {
    // 💗
    return res.status(200).send(event)
  } else {
    return res.status(404).send({
      message: "Event id " + id + " not found.",
    })
  }
}

const deleteHandler = deleteEventMiddleware(async function deleteHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Unpack body from request.
  // Validate
  const { id, errorMessage } = validateObjectId(req)
  if (errorMessage) {
    return res.status(400).send({ message: errorMessage })
  }
  const response = await prisma.event.delete({
    where: {
      id,
    },
  })
  if (response) {
    // Send response (from Primsa query) back to the client.
    // 💗
    return res.status(200).send(response)
  } else {
    return res.status(400).send({
      message: `Error: Event id ${id} could not be deleted.`,
    })
  }
})
