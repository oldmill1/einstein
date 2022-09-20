import usersHandler from "../pages/api/users"
import { postman } from "./testsHelper"

describe("Users", function () {
  describe("GET", function () {
    describe("/users", function () {
      test("Initializes empty databases", async function () {
        const empty = postman({})
        const res = empty.res
        const req = empty.req
        await usersHandler(req, res)
        const data = res._getData()
        expect(data).toEqual({
          users: [],
        })
      })
    })
  })
})
