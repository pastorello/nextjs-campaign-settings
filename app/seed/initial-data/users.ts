const users = [
  {
    name: "User",
    email: "user@nextmail.com",
    password: "$2b$10$mSxfSmFrrODBXsgobmj.ZeCEVzWkwJ.B206EqokaHcfhYBheuK8oe", //123456
    // SPEC-022: the seeded account is the DM's. A new row defaults to
    // `player`, which could sign in and change nothing.
    role: "dm",
  },
];

export default users;
