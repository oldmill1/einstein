import { NextApiRequest, NextApiResponse } from "next"
import get from "lodash/fp/get"

export default function loginHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const email = get("body.email", req)
  console.log({ email })
  res.status(200).send({
    message: "OK",
  })
}
