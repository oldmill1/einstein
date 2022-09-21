import usersHandler from "../pages/api/users"
import { postman } from "./helpers/postman"
import { mockData } from "./helpers/fixtures"

describe("Users", function () {
  describe("GET", function () {
    describe("/users", function () {
      test("Is initialized with two users in the database.", async function () {
        const initialized = postman({})
        await usersHandler(initialized.req, initialized.res)
        const someUsers = initialized.res._getData()
        expect(someUsers).toEqual({
          users: mockData.users,
        })
      })
    })
  })
})
