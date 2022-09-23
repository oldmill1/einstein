// Set up the tests:
// This file is used to connect to the tests database
// and set it up for use by tests written in Jest.
//
// Jest runs our tests in a "test environment" where
// all the functions being tested pick up the
// variables inside .env.test (as opposed to .env
// when being run normally).
//
// Depreciated:
// All the tests are required to be run sequentially,
// or otherwise the multiple databases would
// interfere with each other. Because of this the
// jest flag --runInBand is used.
import { PrismaClient } from "@prisma/client"
import { mockData } from "./fixtures"
const prisma = new PrismaClient()

export async function setup() {
  // Insert fixtures into the DB
  const users = await prisma.user.createMany({
    data: mockData.users,
  })
  const events = await prisma.event.createMany({
    data: mockData.events,
  })
}

export async function teardown() {
  const deletedEvents = await prisma.event.deleteMany({})
  const deletedUsers = await prisma.user.deleteMany({})
}
