import { NextApiHandler, NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import get from "lodash/fp/get"

export function validateEmailAndPassword(fn: NextApiHandler) {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    const email = get("body.email", req)
    if (!email) {
      res.status(400).send({ message: "`Email` field provided was empty." })
      return
    }
    const pass = get("body.plaintextPassword", req)
    if (!pass) {
      res
        .status(400)
        .send({ message: "`plaintextPassword` field provided was empty." })
      return
    }
    try {
      z.string().email().parse(email)
      return await fn(req, res)
    } catch (err) {
      res.status(400).send({ message: "`Email` field provided was invalid." })
    }
  }
}
