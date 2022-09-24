import { postman } from "./helpers/postman"
import { expectFailure, expectOK } from "./helpers/helpers"
import eventsHandler from "../pages/api/events"
import get from "lodash/fp/get"
import eventHandler from "../pages/api/events/[id]"
import { mockData } from "./helpers/fixtures"
import first from "lodash/fp/first"
import isEqual from "lodash/fp/isEqual"

describe("Events", function () {
  // Note: Auth is not required for GET
  describe("GET", function () {
    // Note: The tests below use "eventHandler"
    describe("/events/[id]", function () {
      test("Gets a single event.", async function () {
        const getEvent = postman({
          query: {
            id: "632df76be97db3548e069c8a",
          },
        })
        const expected = first(mockData.events)
        await eventHandler(getEvent.req, getEvent.res)
        expectOK(getEvent.res)
        const received = getEvent.res._getData()
        expect(received).toBeDefined()
        const id = get("id", received)
        expect(id).toBeDefined()
        expect(received).toStrictEqual(expected)
      })
      test("Handles event not found.", async function () {
        const getEvent = postman({
          query: {
            id: "something-else",
          },
        })
        await eventHandler(getEvent.req, getEvent.res)
        expectFailure(getEvent.res)
      })
      // Note: POST method is not supported on /events/[id]
      test("Handles 405.", async function () {
        const wontWork = postman({
          method: "POST",
          body: {
            id: "632df76be97db3548e069c8a",
          },
        })
        await eventHandler(wontWork.req, wontWork.res)
        expect(wontWork.res._getStatusCode()).toBe(405)
      })
    })
    // The tests below use "eventsHandler"
    describe("/events", function () {
      // Get a list of events from the DB
      test("Gets a list of events from the database.", async function () {
        // This list would be events that have been pre-created
        // for use in tests.
        const list = postman({})
        await eventsHandler(list.req, list.res)
        const received = list.res._getData()
        const expected = mockData.events
        expect(received).toStrictEqual(expected)
      })
      // Filter: User
      test("Retrieves Ankur's events.", async function () {
        const defaultUserId = first(mockData.users)!.id
        const byUser = postman({
          query: {
            userId: defaultUserId,
          },
        })
        await eventsHandler(byUser.req, byUser.res)
        const received = byUser.res._getData()
        const expected = mockData.events.filter((e) =>
          isEqual(e.userId, defaultUserId)
        )
        expect(received).toStrictEqual(expected)
      })
      test("Retrieves Bob's events.", async function () {
        const bob = first(mockData.users.filter((u) => u.name === "Bob"))
        const bobId = bob!.id
        const byUser = postman({
          query: {
            userId: bobId,
          },
        })
        await eventsHandler(byUser.req, byUser.res)
        const received = byUser.res._getData()
        const expected = mockData.events.filter((e) => isEqual(e.userId, bobId))
        expect(expected).toStrictEqual(received)
      })
      // Filters: Date
      // date: "June 21, 2022"
      test("Retrieves events starting on a particular day.", async function () {
        const juneDayEvents = postman({
          query: {
            date: "June 21, 2022",
          },
        })
        await eventsHandler(juneDayEvents.req, juneDayEvents.res)
        const received = juneDayEvents.res._getData()
        const expected = mockData.events.filter((e) =>
          isEqual(e.startDate, new Date("June 21, 2022"))
        )
        expect(expected).toStrictEqual(received)
      })
      // between: { "Date 1", "Date 2" }
      // gte: "Some Date"
      // lte: "Some Date"
    })
  })
  // Note: Auth is required for POST
  describe("POST", function () {
    test("Creates a new event.", async function () {
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
          startDate: "XYZ",
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
          finishDate: "XYZ",
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
    test("Error if startDate come after finishDate.", async function () {
      const same = postman({
        method: "POST",
        body: {
          startDate: new Date("December 1 , 2022"),
          finishDate: new Date("November 30, 2022"),
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
