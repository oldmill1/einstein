import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

export default async function usersHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Return users
  const allUsers = await prisma.user.findMany()
  console.log({ allUsers })
  console.log("env", process.env.DATABASE_URL)
  res.status(200).send({
    users: allUsers,
  })
}
