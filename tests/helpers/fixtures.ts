const password = "$2b$10$vt2HkIu6rFP3XMqvW.VAOOlfMiZq8/mpGM1q9ooxi8LfMQuJLH6u2"
export const mockData = {
  users: [
    {
      id: "632a5236dbc2c6c3ed9df153",
      createdAt: new Date("September 19, 2022"),
      updatedAt: new Date("September 19, 2022"),
      email: "ataxali@gmail.com",
      password,
      name: "Ankur",
    },
    {
      id: "632a5236dbc2c6c3ed9df154",
      createdAt: new Date("September 20, 2022"),
      updatedAt: new Date("September 20, 2022"),
      email: "bob@gmail.com",
      password,
      name: "Bob",
    },
  ],
  events: [
    {
      id: "632df76be97db3548e069c8a",
      createdAt: new Date("September 21, 2022"),
      updatedAt: new Date("September 21, 2022"),
      startDate: new Date("September 22, 2022"),
      finishDate: new Date("September 23, 2022"),
      userId: "632a5236dbc2c6c3ed9df153",
    },
    {
      id: "632e8174542cc1732413b41c",
      createdAt: new Date("June 21, 2022"),
      updatedAt: new Date("June 21, 2022"),
      startDate: new Date("June 21, 2022"),
      finishDate: new Date("June 22, 2022"),
      userId: "632a5236dbc2c6c3ed9df154",
    },
  ],
  updatedEvent: {
    id: "632df76be97db3548e069c8a",
    createdAt: new Date("September 21, 2022"),
    startDate: new Date("December 1 , 2022"),
    finishDate: new Date("December 2, 2022"),
    userId: "632a5236dbc2c6c3ed9df153",
  },
}
