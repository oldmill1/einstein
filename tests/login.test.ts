import { postman } from "./helpers/postman"
import loginHandler from "../pages/api/auth/login"
import get from "lodash/fp/get"
import { expectFailure, expectInvalidEmail } from "./helpers/helpers"

describe("Login", function () {
  test("Produces a public auth token for user with matching password.", async function () {
    const login = postman({
      method: "POST",
      body: {
        email: "ataxali@gmail.com",
        plaintextPassword: "temp",
      },
    })
    await loginHandler(login.req, login.res)
    const received = login.res._getData()
    const authToken = get("authToken", received)
    expect(authToken).toBeDefined()
  })
  test("Denies public auth token to user with wrong password.", async function () {
    const wrongPassword = postman({
      method: "POST",
      body: {
        email: "ataxali@gmail.com",
        plaintextPassword: "password",
      },
    })
    await loginHandler(wrongPassword.req, wrongPassword.res)
    const received = wrongPassword.res._getData()
    const message = get("message", received)
    expect(message).toBe("Something went wrong.")
  })
  test("Handles email not found", async function () {
    const wrongPassword = postman({
      method: "POST",
      body: {
        email: "fugpar@gmail.com",
        plaintextPassword: "password",
      },
    })
    await loginHandler(wrongPassword.req, wrongPassword.res)
    expectFailure(wrongPassword.res)
  })
  test("Handles invalid email", async function () {
    const invalidEmail = postman({
      method: "POST",
      body: {
        email: "@gmail.com",
        plaintextPassword: "1234",
      },
    })
    await loginHandler(invalidEmail.req, invalidEmail.res)
    expectInvalidEmail(invalidEmail.res)
  })
})
