import { postman } from "./testsHelper"
import signupHandler from "../pages/api/auth/signup"
import get from "lodash/fp/get"

describe("Users", function () {
  test("Signs a user up successfully.", async function () {
    // Mimic signing up for a new account
    const signup = postman({
      method: "POST",
      body: {
        name: "Sophie",
        email: "sophie@bailacon.com",
        plaintextPassword: "password",
      },
    })
    const res = signup.res
    const req = signup.req
    await signupHandler(req, res)
    const data = res._getData()
    const id = get("id", data)
    expect(id).toBeDefined()
  })
})
