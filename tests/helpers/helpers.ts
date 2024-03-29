import { MockResponse } from "node-mocks-http"
import get from "lodash/fp/get"

export function expectFailure(res: MockResponse<Response>) {
  const message = get("message", res._getData())
  expect(message).toBeDefined()
  expect(res._getStatusCode()).toBe(400)
  expect(message).toBe("Something went wrong.")
}

export function expectInvalidEmail(res: MockResponse<Response>) {
  const message = get("message", res._getData())
  expect(res._getStatusCode()).toBe(400)
  expect(message).toBeDefined()
  expect(message).toBe("`Email` field provided was invalid.")
}

export function expectOK(res: MockResponse<Response>) {
  expect(res._getStatusCode()).toBe(200)
}
