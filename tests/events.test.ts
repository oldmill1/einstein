import { postman } from "./helpers/postman"
import { expectOK } from "./helpers/helpers"
import eventsHandler from "../pages/api/events"
import get from "lodash/fp/get"

describe("Events", function () {
  describe("POST", function () {
    test("User can create a new event.", async function () {
      const newEvent = postman({
        method: "POST",
        auth: true,
        body: {
          startDate: new Date("November 16, 2022"),
          finishDate: new Date("November 17, 2022"),
        },
      })
      await eventsHandler(newEvent.req, newEvent.res)
      expectOK(newEvent.res)
      const received = newEvent.res._getData()
      const id = get("id", received)
      expect(id).toBeDefined()
    })
    test("Handles absent startDate.", async function () {
      const absentSDate = postman({
        method: "POST",
        auth: true,
        body: {
          finishDate: new Date("November 17, 2022"),
        },
      })
      await eventsHandler(absentSDate.req, absentSDate.res)
      const received = absentSDate.res._getData()
      const message = get("message", received)
      expect(message).toBeDefined()
      expect(message).toBe("The field `startDate` or `finishDate` was absent.")
    })
    test("Handles invalid startDate.", async function () {
      const invalidSDate = postman({
        method: "POST",
        auth: true,
        body: {
          startDate: "August 21, 2022",
          finishDate: new Date("November 17, 2022"),
        },
      })
      await eventsHandler(invalidSDate.req, invalidSDate.res)
      const received = invalidSDate.res._getData()
      const message = get("message", received)
      expect(message).toBeDefined()
      expect(message).toBe("The field `startDate` was not a date.")
    })
    test("Handles absent finishDate.", async function () {
      const absentFDate = postman({
        method: "POST",
        auth: true,
        body: {
          startDate: new Date("November 16, 2022"),
        },
      })
      await eventsHandler(absentFDate.req, absentFDate.res)
      const received = absentFDate.res._getData()
      const message = get("message", received)
      expect(message).toBeDefined()
      expect(message).toEqual(
        "The field `startDate` or `finishDate` was absent."
      )
    })
    test("Handles invalid finishDate.", async function () {
      const invalidFDate = postman({
        method: "POST",
        auth: true,
        body: {
          startDate: new Date("November 16, 2022"),
          finishDate: "November 16, 2022",
        },
      })
      await eventsHandler(invalidFDate.req, invalidFDate.res)
      const received = invalidFDate.res._getData()
      const message = get("message", received)
      expect(message).toBeDefined()
      expect(message).toBe("The field `finishDate` was not a date.")
    })
    test("Handles unsigned request.", async function () {
      const unsigned = postman({
        method: "POST",
        body: {
          startDate: new Date("November 16, 2022"),
          finishDate: new Date("November 17, 2022"),
        },
      })
      await eventsHandler(unsigned.req, unsigned.res)
      expect(unsigned.res._getStatusCode()).toBe(401)
      const received = unsigned.res._getData()
      const message = get("message", received)
      expect(message).toBe("Not authorized.")
    })
    test("Handles dates are the same.", async function () {
      const same = postman({
        method: "POST",
        body: {
          startDate: new Date("November 16, 2022"),
          finishDate: new Date("November 16, 2022"),
        },
        auth: true,
      })
      await eventsHandler(same.req, same.res)
      expect(same.res._getStatusCode()).toEqual(400)
      const received = same.res._getData()
      const message = get("message", received)
      expect(message).toBe("Check dates.")
    })
  })
})
