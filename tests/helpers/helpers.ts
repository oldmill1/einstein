import { MockResponse } from "node-mocks-http"
import get from "lodash/fp/get"

export function expectFailure(res: MockResponse<Response>) {
  const message = get("message", res._getData())
  expect(message).toBeDefined()
  expect(message).toBe("Something went wrong.")
}
