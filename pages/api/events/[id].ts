import { NextApiRequest, NextApiResponse } from "next"
import isEqual from "lodash/fp/isEqual"
import { PrismaClient } from "@prisma/client"
import get from "lodash/fp/get"
const prisma = new PrismaClient()
const validObjectId = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i

export default async function eventHandler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { query, method } = req
  // Validate user input
  const id = get("id", query) as string
  if (!id || !validObjectId.test(id)) {
    return res.status(400).send({
      message: "Something went wrong.",
    })
  }
  if (isEqual(method, "GET")) {
    // Handle a GET request
    // Return a single document from the DB)
    const event = await prisma.event.findUnique({
      where: {
        id,
      },
    })
    if (event) {
      return res.status(200).send(event)
    } else {
      return res.status(400).send({
        message: "Something went wrong.",
      })
    }
  }
}
