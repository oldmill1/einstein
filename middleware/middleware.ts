import { NextApiHandler, NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import get from "lodash/fp/get"
import { Secret, verify } from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import isEqual from "lodash/fp/isEqual"
const prisma = new PrismaClient()
const validObjectId = /^(?=[a-f\d]{24}$)(\d+[a-f]|[a-f]+\d)/i

export function emailAndPassMiddleware(fn: NextApiHandler) {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    const email = get("body.email", req)
    if (!email) {
      res.status(400).send({ message: "`Email` field provided was empty." })
      return
    }
    const pass = get("body.plaintextPassword", req)
    if (!pass) {
      return res
        .status(400)
        .send({ message: "`plaintextPassword` field provided was empty." })
    }
    try {
      z.string().email().parse(email)
      return await fn(req, res)
    } catch (err) {
      return res
        .status(400)
        .send({ message: "`Email` field provided was invalid." })
    }
  }
}

export function authMiddleware(fn: NextApiHandler) {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    if (req.method === "GET") {
      return await fn(req, res)
    }
    if (!process.env.API_SECRET) {
      return res.status(400).send({ message: "Something went wrong." })
    }
    // Verify the auth token is authentic using jsonwebtoken
    let apiSecret: Secret = process.env.API_SECRET
    return verify(
      req.headers.authorization!,
      apiSecret,
      async function (err, decoded) {
        if (!err && decoded) {
          if (decoded.sub && typeof decoded.sub === "string") {
            return await fn(req, res)
          }
        } // Error verifying:
        return res.status(401).send({ message: "Not authorized." })
      }
    )
  }
}

export function validateUserInput(req: NextApiRequest) {
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

export function deleteEventMiddleware(fn: Function) {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    // Unpack body from request and validate.
    const { id, errorMessage } = validateUserInput(req)
    if (errorMessage) {
      return res.status(400).send({ message: errorMessage })
    }
    // Validate auth request:
    let apiSecret: Secret = process.env.API_SECRET as string
    // Is auth verified? Check using jsonwebtoken verify.
    return verify(
      req.headers.authorization!,
      apiSecret,
      async function (err, decoded) {
        if (!err && decoded) {
          // Auth verified!
          if (decoded.sub && typeof decoded.sub === "string") {
            // Does user exist? Check using primsa.event.findUnique
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
                  return await fn(req, res)
                }
              }
            }
          }
        } // Error:
        return res.status(401).send({
          message: `Error: Event id ${id} could not be deleted.`,
        })
      }
    ) // End verify
  }
}
