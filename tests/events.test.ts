import { postman } from "./helpers/postman"
import { expectFailure, expectOK } from "./helpers/helpers"
import eventsHandler from "../pages/api/events"
import get from "lodash/fp/get"
import eventHandler from "../pages/api/events/[id]"
import { mockData } from "./helpers/fixtures"
import first from "lodash/fp/first"
import isEqual from "lodash/fp/isEqual"

// File: pages/api/events/index.ts
describe("Events", function () {
  let newPostId: string | null = null
  let newPostStartDate = new Date("2022-11-16T05:00:00.000Z")
  let newPostFinishDate = new Date("2022-11-17T05:00:00.000Z")
  // An Authentication header is not required for GET requests.
  // `postman` in the lines below is not configured with an auth param.
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
        const received = getEvent.res._getData()
        const message = get("message", received)
        expect(message).toStrictEqual("Error validating user input.")
      })
      test("Handles 404.", async function () {
        const getEvent = postman({
          query: {
            id: "63320bff321283545b1f986c",
          },
        })
        await eventHandler(getEvent.req, getEvent.res)
        const received = getEvent.res._getData()
        const message = get("message", received)
        expect(message).toStrictEqual(
          "Event id 63320bff321283545b1f986c not found."
        )
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
        await eventHandler(wontWork.req, wontWork.res)
        const received = wontWork.res._getData()
        const message = get("message", received)
        expect(message).toBe("Method not allowed.")
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
      test("Retrieves events starting on a particular date.", async function () {
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
      test("Retrieves events between two dates", async function () {
        const start = "September 1, 2022"
        const finish = "September 31, 2022"
        const events = postman({
          query: {
            interval: {
              lte: finish,
              gte: start,
            },
          },
        })
        await eventsHandler(events.req, events.res)
        const received = events.res._getData()
        const expected = mockData.events.filter(
          (e) =>
            e.startDate <= new Date(finish) && e.startDate >= new Date(start)
        )
        expect(expected).toStrictEqual(received)
      })
      // gte: "Some Date"
      test("Retrieves events after a given date.", async function () {
        const sample = "September 1, 2022"
        const after = postman({
          query: {
            gte: sample,
          },
        })
        await eventsHandler(after.req, after.res)
        const received = after.res._getData()
        const expected = mockData.events.filter(
          (e) => e.startDate >= new Date(sample)
        )
        expect(expected).toStrictEqual(received)
      })
      // lte: "Some Date"
      test("Retrieves events before a given date", async function () {
        const sample = "September 1, 2022"
        const before = postman({
          query: {
            lte: sample,
          },
        })
        await eventsHandler(before.req, before.res)
        const received = before.res._getData()
        const expected = mockData.events.filter(
          (e) => e.startDate <= new Date(sample)
        )
        expect(expected).toStrictEqual(received)
      })
    })
  })
  // An Authentication header is required for POST, UPDATE and DELETE requests.
  // `postman` in the lines below is configured with `auth: true`
  describe("POST", function () {
    // Note: This creates a side effect. It modifies the test database by
    // adding a record to the event table. We will clean up after ourselves
    // later in this file when we delete this event in the DELETE tests.
    test("Creates a new event.", async function () {
      const newEvent = postman({
        method: "POST",
        auth: true,
        body: {
          startDate: newPostStartDate,
          finishDate: newPostFinishDate,
        },
      })
      await eventsHandler(newEvent.req, newEvent.res)
      expectOK(newEvent.res)
      const received = newEvent.res._getData()
      const id = get("id", received)
      expect(id).toBeDefined()
      newPostId = id
    })
    test("Handles absent startDate.", async function () {
      const absentSDate = postman({
        method: "POST",
        auth: true,
        body: {
          finishDate: "November 17, 2022",
        },
      })
      await eventsHandler(absentSDate.req, absentSDate.res)
      const received = absentSDate.res._getData()
      const message = get("message", received)
      expect(message).toBeDefined()
      expect(message).toBe("The field `startDate` was not a date.")
    })
    test("Handles invalid startDate.", async function () {
      const invalidSDate = postman({
        method: "POST",
        auth: true,
        body: {
          startDate: "XYZ",
          finishDate: "November 17, 2022",
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
          startDate: "November 16, 2022",
        },
      })
      await eventsHandler(absentFDate.req, absentFDate.res)
      const received = absentFDate.res._getData()
      const message = get("message", received)
      expect(message).toBeDefined()
      expect(message).toEqual("The field `finishDate` was not a date.")
    })
    test("Handles invalid finishDate.", async function () {
      const invalidFDate = postman({
        method: "POST",
        auth: true,
        body: {
          startDate: "November 16, 2022",
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
          startDate: "November 16, 2022",
          finishDate: "November 17, 2022",
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
          startDate: "November 16, 2022",
          finishDate: "November 16, 2022",
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
          startDate: "December 1 , 2022",
          finishDate: "November 30, 2022",
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
  describe("UPDATE", function () {
    test("Updates an event with new data", async function () {
      const update = postman({
        method: "UPDATE",
        body: {
          startDate: "December 1 , 2022",
          finishDate: "December 2, 2022",
          id: "632df76be97db3548e069c8a",
        },
        auth: true,
      })
      await eventsHandler(update.req, update.res)
      const received = update.res._getData()
      const expected = mockData.updatedEvent
      expect(received.startDate).toStrictEqual(expected.startDate)
      expect(received.finishDate).toStrictEqual(expected.finishDate)
    })
    test("Prevents updating an event owned by someone else.", async function () {
      const update = postman({
        method: "UPDATE",
        body: {
          startDate: "December 1 , 2022",
          finishDate: "December 2, 2022",
          // This event is owned by "Ankur" user
          // and cannot be updated by Bob
          id: "632df76be97db3548e069c8a",
        },
        auth: true,
        // Note: This request will look like its coming from Bob.
        authKeyName: "BOB_PUBLIC_KEY",
      })
      await eventsHandler(update.req, update.res)
      const received = update.res._getData()
      const message = get("message", received)
      expect(message).toBe("Something went wrong.")
    })
    test("Prevents updating with some missing dates.", async function () {
      const response = postman({
        method: "UPDATE",
        body: {
          startDate: "December 1 , 2022",
          // Note: finishDate is missing
          id: "632df76be97db3548e069c8a",
        },
        auth: true,
      })
      await eventsHandler(response.req, response.res)
      const received = response.res._getData()
      const message = get("message", received)
      expect(message).toBe("The field `finishDate` was not a date.")
    })
    test("Prevents updating with mixed-up dates.", async function () {
      const response = postman({
        method: "UPDATE",
        body: {
          startDate: "December 3 , 2022",
          finishDate: "December 2, 2022",
          id: "632df76be97db3548e069c8a",
        },
        auth: true,
      })
      await eventsHandler(response.req, response.res)
      const received = response.res._getData()
      const message = get("message", received)
      expect(message).toBe("Check dates.")
    })
    test("Handles unsigned request.", async function () {
      const response = postman({
        method: "POST",
        body: {
          startDate: "December 1 , 2022",
          finishDate: "December 2, 2022",
        },
        // Note: Testing missing an "auth" header.
      })
      await eventsHandler(response.req, response.res)
      expect(response.res._getStatusCode()).toBe(401)
      const received = response.res._getData()
      const message = get("message", received)
      expect(message).toBe("Not authorized.")
    })
    test("Handles start dates are the same", async function () {
      const response = postman({
        method: "POST",
        body: {
          startDate: "December 1 , 2022",
          finishDate: "December 1, 2022",
        },
        auth: true,
      })
      await eventsHandler(response.req, response.res)
      const received = response.res._getData()
      const message = get("message", received)
      expect(message).toBe("Check dates.")
    })
    test("Handles invalid startDate.", async function () {
      const response = postman({
        method: "UPDATE",
        auth: true,
        body: {
          startDate: "XYZ",
          finishDate: "November 17, 2022",
        },
      })
      await eventsHandler(response.req, response.res)
      const received = response.res._getData()
      const message = get("message", received)
      expect(message).toBeDefined()
      expect(message).toBe("The field `startDate` was not a date.")
    })
    test("Handles invalid finishDate.", async function () {
      const response = postman({
        method: "UPDATE",
        auth: true,
        body: {
          startDate: "November 17, 2022",
          finishDate: "XXX",
        },
      })
      await eventsHandler(response.req, response.res)
      const received = response.res._getData()
      const message = get("message", received)
      expect(message).toBeDefined()
      expect(message).toBe("The field `finishDate` was not a date.")
    })
  })
  describe("DELETE", function () {
    test("Deletes an event.", async function () {
      // Clean up after ourselves
      const response = postman({
        method: "DELETE",
        body: {
          // Note: This was the post that was created earlier
          id: newPostId,
        },
        auth: true,
      })
      await eventHandler(response.req, response.res)
      const received = response.res._getData()
      expect(received.startDate).toStrictEqual(newPostStartDate)
      expect(received.finishDate).toStrictEqual(newPostFinishDate)
    })
    test("Prevents deleting another user's event on accident.", async function () {
      const response = postman({
        method: "DELETE",
        body: {
          id: "632df76be97db3548e069c8a", // Ankur's event...
        },
        // Note: This request will look like its coming from Bob.
        authKeyName: "BOB_PUBLIC_KEY", // ...Bob's Key
      })
      await eventHandler(response.req, response.res)
      const received = response.res._getData()
      const message = get("message", received)
      expect(response.res._getStatusCode()).toBe(401)
      expect(message).toBe(
        `Error: Event id 632df76be97db3548e069c8a could not be deleted.`
      )
    })
    test("Handles deleting id 'something-else'", async function () {
      const response = postman({
        method: "DELETE",
        body: {
          id: "something-else",
        },
        auth: true,
      })
      await eventHandler(response.req, response.res)
      const received = response.res._getData()
      const message = get("message", received)
      expect(response.res._getStatusCode()).toBe(400)
      expect(message).toBe(`Error validating user input.`)
    })
    test("Handles deleting not a real id", async function () {
      const notFoundId = "6333b457f1b698196bf544d0"
      const response = postman({
        method: "DELETE",
        body: {
          id: "6333b457f1b698196bf544d0",
        },
        auth: true,
      })
      await eventHandler(response.req, response.res)
      const received = response.res._getData()
      const message = get("message", received)
      expect(response.res._getStatusCode()).toBe(401)
      expect(message).toBe(
        `Error: Event id ${notFoundId} could not be deleted.`
      )
    })
    test("Handles unsigned event", async function () {
      const response = postman({
        method: "DELETE",
        body: {
          id: "6333b457f1b698196bf544d0",
        },
      })
      await eventHandler(response.req, response.res)
      const received = response.res._getData()
      const message = get("message", received)
      expect(response.res._getStatusCode()).toBe(401)
      expect(message).toBe(
        `Error: Event id 6333b457f1b698196bf544d0 could not be deleted.`
      )
    })
  })
})
