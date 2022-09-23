import { NextApiRequest, NextApiResponse } from "next"
import isEqual from "lodash/fp/isEqual"

export default async function eventHandler(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> {
  const { body, method } = req
  // Handle a GET request
  if (isEqual(method, "GET")) {
  }
}
