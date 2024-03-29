import { postman } from "./helpers/postman"
import signupHandler from "../pages/api/auth/signup"
import get from "lodash/fp/get"
import { expectFailure, expectInvalidEmail } from "./helpers/helpers"

describe("Signup", function () {
  test("Signs a user up successfully.", async function () {
    const signup = postman({
      method: "POST",
      body: {
        name: "Sophie",
        email: "sophie@gmail.com",
        plaintextPassword: "password",
      },
    })
    await signupHandler(signup.req, signup.res)
    const received = signup.res._getData()
    const id = get("id", received)
    const email = get("email", received)
    expect(id).toBeDefined()
    expect(email).toBe("sophie@gmail.com")
  })
  test("Prevents signing up with an invalid email.", async function () {
    const invalidEmail = postman({
      method: "POST",
      body: {
        name: "Sophie",
        email: "sophie@.com",
        plaintextPassword: "password",
      },
    })
    await signupHandler(invalidEmail.req, invalidEmail.res)
    expectInvalidEmail(invalidEmail.res)
  })
  test("Prevents signing up without an email.", async function () {
    const noEmail = postman({
      method: "POST",
      body: {
        name: "Sophie",
        plaintextPassword: "password",
      },
    })
    await signupHandler(noEmail.req, noEmail.res)
    const received = noEmail.res._getData()
    const message = get("message", received)
    expect(message).toBe("`Email` field provided was empty.")
  })
  test("Prevents signing up without an name.", async function () {
    const noName = postman({
      method: "POST",
      body: {
        email: "sophie@gmail.com",
        plaintextPassword: "password",
      },
    })
    await signupHandler(noName.req, noName.res)
    const received = noName.res._getData()
    const message = get("message", received)
    expect(message).toBe("`Name` field provided was empty.")
  })
  test("Prevents duplicate email", async function () {
    const duplicateEmail = postman({
      method: "POST",
      body: {
        name: "Ankur",
        email: "ataxali@gmail.com",
        plaintextPassword: "password",
      },
    })
    await signupHandler(duplicateEmail.req, duplicateEmail.res)
    expectFailure(duplicateEmail.res)
  })
})
