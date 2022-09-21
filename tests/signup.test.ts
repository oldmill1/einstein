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
    const data = signup.res._getData()
    const id = get("id", data)
    const email = get("email", data)
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
    const data = weirdEmail.res._getData()
    const message = get("message", data)
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
    const data = noEmail.res._getData()
    const message = get("message", data)
    expect(message).toBe("`Email` field provided was empty.")
  })
})
