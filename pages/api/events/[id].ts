import { NextApiRequest, NextApiResponse } from "next"
import isEqual from "lodash/fp/isEqual"
import { PrismaClient } from "@prisma/client"
import get from "lodash/fp/get"
const prisma = new PrismaClient()
const validObjectId = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i

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
  // Kick out all other types of request except GET and UPDATE
  if (!isEqual(method, "GET") && !isEqual(method, "DELETE")) {
    return res.status(405).send({
      message: "Something went wrong",
    })
  }
  // Validate user input
  const id = method === "GET" ? (get("id", query) as string) : get("id", body)
  if (!id || !validObjectId.test(id)) {
    return res.status(400).send({
      message: "Something went wrong.",
    })
  }
  // GET handler:
  if (isEqual(method, "GET")) {
    // Note: This route handles get request only
    // Return a single document from the DB
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
  } else if (isEqual(method, "DELETE")) {
    // Try to delete the event
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
}
