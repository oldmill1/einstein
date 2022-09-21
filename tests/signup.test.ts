import { postman } from "./helpers/postman"
import signupHandler from "../pages/api/auth/signup"
import get from "lodash/fp/get"

describe("Users", function () {
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
    const weirdEmail = postman({
      method: "POST",
      body: {
        name: "Sophie",
        email: "sophie@.com",
        plaintextPassword: "password",
      },
    })
    await signupHandler(weirdEmail.req, weirdEmail.res)
    const received = weirdEmail.res._getData()
    const message = get("message", received)
    expect(message).toBe("`Email` field provided was invalid.")
  })
  test("Prevents signing up without an email.", async function () {
    const noEmail = postman({
      method: "POST",
      body: {
        name: "Sophie",
        email: "",
        plaintextPassword: "password",
      },
    })
    await signupHandler(noEmail.req, noEmail.res)
    const received = noEmail.res._getData()
    const message = get("message", received)
    expect(message).toBe("`Email` field provided was empty.")
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
    const received = duplicateEmail.res._getData()
    const message = get("message", received)
    expect(message).toBe("An error occurred.")
  })
})
