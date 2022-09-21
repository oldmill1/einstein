import usersHandler from "../pages/api/users"
import { postman } from "./helpers/postman"
import { mockData } from "./helpers/fixtures"

describe("Users", function () {
  describe("GET", function () {
    describe("/users", function () {
      test("Is initialized with two users in the database.", async function () {
        const empty = postman({})
        await usersHandler(empty.req, empty.res)
        const someUsers = empty.res._getData()
        expect(someUsers).toEqual({
          users: mockData.users,
        })
      })
    })
  })
})
