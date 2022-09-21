import usersHandler from "../pages/api/users"
import { postman } from "./testsHelper"
import { mockData } from "./fixtures"

describe("Users", function () {
  describe("GET", function () {
    describe("/users", function () {
      test("Is initialized with two users in the database.", async function () {
        const empty = postman({})
        const res = empty.res
        const req = empty.req
        await usersHandler(req, res)
        const someUsers = res._getData()
        expect(someUsers).toEqual({
          users: mockData.users,
        })
      })
    })
  })
})
