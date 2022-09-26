import { NextApiRequest, NextApiResponse } from "next"
import isEqual from "lodash/fp/isEqual"
import { PrismaClient } from "@prisma/client"
import get from "lodash/fp/get"
const prisma = new PrismaClient()
const validObjectId = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i

function validateUserInput(req: NextApiRequest) {
  const { query, method, body } = req

  const id = method === "GET" ? (get("id", query) as string) : get("id", body)
  if (!id || !validObjectId.test(id)) {
    return {
      id: null,
      errorMessage: `Error validating user input.`,
    }
  }
  return {
    id,
    errorMessage: null,
  }
}

/**
 * Request handler for /events/[id]
 * Tests: /tests/events.test.ts
 * @param req
 * @param res
 */
export default async function eventHandler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { query, method, body } = req
  // Handle GET request:
  if (isEqual(method, "GET")) {
    return await getHandler(req, res)
  }
  if (isEqual(method, "DELETE")) {
    return await deleteHandler(req, res)
  }

  // Else All:
  return res.status(405).send({
    message: "Something went wrong",
  })
}

async function getHandler(req: NextApiRequest, res: NextApiResponse) {
  // Validate the input
  const { id, errorMessage } = validateUserInput(req)
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

async function deleteHandler(req: NextApiRequest, res: NextApiResponse) {
  // Unpack body from request.
  // Validate
  const { id, errorMessage } = validateUserInput(req)
  if (errorMessage) {
    return res.status(400).send({ message: errorMessage })
  }
  // Delete the given id.
  const event = await prisma.event.delete({
    where: {
      id,
    },
  })
  if (event) {
    // If delete worked:
    // 💗
    return res.status(200).send(event)
  } else {
    return res.status(400).send({
      message: `Error: Event id ${id} could not be deleted.`,
    })
  }
}
