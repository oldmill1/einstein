import { createMocks } from "node-mocks-http"
import isEmpty from "lodash/fp/isEmpty"

export function postman({
  authKeyName = "",
  method = "GET",
  auth = false,
  body = {},
  query = {},
} = {}) {
  let args = {}
  if (method === "GET") {
    args = {
      ...args,
      method: "GET",
    }
  }
  if (method === "POST") {
    args = {
      ...args,
      method: "POST",
      body,
    }
  }
  if (auth) {
    args = {
      ...args,
      headers: {
        Authorization: isEmpty(authKeyName)
          ? process.env.PUBLIC_API_KEY
          : process.env[authKeyName],
      },
    }
  }
  if (!isEmpty(query)) {
    args = {
      ...args,
      query,
    }
  }
  return createMocks(args)
}
