import { postman } from "./helpers/postman"
import signupHandler from "../pages/api/auth/signup"
import get from "lodash/fp/get"

describe("Users", function () {
  test("Signs a user up successfully.", async function () {
    // Mimic hitting the signup API handler
    // and creating a new user named Sophie.
    const signup = postman({
      method: "POST",
      body: {
        name: "Sophie",
        email: "sophie@gmail.com",
        plaintextPassword: "password",
      },
    })
    const res = signup.res
    const req = signup.req
    await signupHandler(req, res)
    const data = res._getData()
    const id = get("id", data)
    const email = get("email", data)
    expect(id).toBeDefined()
    expect(email).toBe("sophie@gmail.com")
    // Note: We could add mock fetch where we
    // get the newly created user by id using
    // the handler defined inside user/[id].ts
  })
  // Tests handling a request where an email is not provided
  test("Prevents signing up with an invalid email.", async function () {
    // Mimic signing up with an invalid email address
    const signupWithInvalidEmail = postman({
      method: "POST",
      body: {
        name: "Sophie",
        email: "sophie@.com",
        plaintextPassword: "password",
      },
    })
    const res = signupWithInvalidEmail.res
    const req = signupWithInvalidEmail.req
    await signupHandler(req, res)
    const data = res._getData()
    const message = get("message", data)
    expect(message).toBe("`Email` field provided was invalid.")
  })
  test("Prevents signing up without an email.", async function () {
    // Mimic signing up with an invalid email address
    const signupWithInvalidEmail = postman({
      method: "POST",
      body: {
        name: "Sophie",
        email: "",
        plaintextPassword: "password",
      },
    })
    const res = signupWithInvalidEmail.res
    const req = signupWithInvalidEmail.req
    await signupHandler(req, res)
    const data = res._getData()
    const message = get("message", data)
    expect(message).toBe("`Email` field provided was empty.")
  })
})
