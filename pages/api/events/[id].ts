import { NextApiRequest, NextApiResponse } from "next"
import isEqual from "lodash/fp/isEqual"
import { PrismaClient } from "@prisma/client"
import {
  deleteEventMiddleware,
  validateObjectId,
} from "../../../middleware/middleware"
import get from "lodash/fp/get"

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
    message: "Method not allowed.",
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
  // Note: This function passes through deleteEventMiddleware first!
  // By the time you get here, the event id has already been verified
  // to be valid and allowed to be deleted.
  const body = get("body", req)
  const id = get("id", body)
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
