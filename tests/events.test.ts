import { postman } from "./helpers/postman"
import { expectOK } from "./helpers/helpers"
import eventsHandler from "../pages/api/events"

describe("Events", function () {
  describe("POST", function () {
    test.only("User can create a new event", async function () {
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
  })
})
