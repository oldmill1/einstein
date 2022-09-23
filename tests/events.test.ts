import { postman } from "./helpers/postman"
import { expectOK } from "./helpers/helpers"
import eventsHandler from "../pages/api/events"
import get from "lodash/fp/get"

describe("Events", function () {
  describe("POST", function () {
    test("User can create a new event", async function () {
      // Try to create a new event
      const newEvent = postman({
        method: "POST",
        auth: true,
        body: {
          startDate: new Date("September 20, 2022"),
          finishDate: new Date("September 20, 2022"),
          user: {
            id: "632a5236dbc2c6c3ed9df153",
          },
        },
      })
      await eventsHandler(newEvent.req, newEvent.res)
      expectOK(newEvent.res)
    })
    test("Handles unsigned request", async function () {
      const unsigned = postman({
        method: "POST",
        body: {
          startDate: new Date("September 20, 2022"),
          finishDate: new Date("September 20, 2022"),
          user: {
            id: "632a5236dbc2c6c3ed9df153",
          },
        },
      })
      await eventsHandler(unsigned.req, unsigned.res)
      expect(unsigned.res._getStatusCode()).toBe(401)
      const received = unsigned.res._getData()
      const message = get("message", received)
      expect(message).toBe("Not authorized.")
    })
  })
})
