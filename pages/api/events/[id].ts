import { NextApiRequest, NextApiResponse } from "next"
import isEqual from "lodash/fp/isEqual"
import { PrismaClient } from "@prisma/client"
import get from "lodash/fp/get"
import { Secret, verify } from "jsonwebtoken"
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
  // Validate auth request:
  // Is auth verified? Check using jsonwebtoken verify.
  // Does user exist? Check using prisma.user.findUnique
  // Does event exist? Check using primsa.event.findUnique
  // Does event belong to user? Check if user.id === event.userId
  let apiSecret: Secret = process.env.API_SECRET as string
  return verify(
    req.headers.authorization!,
    apiSecret,
    async function (err, decoded) {
      if (!err && decoded) {
        // Auth verified!
        if (decoded.sub && typeof decoded.sub === "string") {
          let sub: string
          sub = decoded.sub
          const user = await prisma.user.findUnique({
            where: {
              id: sub,
            },
          })
          if (user) {
            // User exists
            // Does event exist?
            const event = await prisma.event.findUnique({
              where: {
                id,
              },
            })
            if (event) {
              // Does event belong to user
              if (isEqual(user.id, event.userId)) {
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
              }
            }
          }
        }
      }
      // error during verification
      return res.status(401).send({ message: "Not authorized." })
    }
  )
}
