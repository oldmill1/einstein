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
  // Kick out all other types of request except GET
  if (!isEqual(method, "GET")) {
    return res.status(405).send({
      message: "Something went wrong",
    })
  }
  // Validate user input
  const id = get("id", query) as string
  if (!id || !validObjectId.test(id)) {
    return res.status(400).send({
      message: "Something went wrong.",
    })
  }
  // Note: This route handles get request only
  // Return a single document from the DB
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
