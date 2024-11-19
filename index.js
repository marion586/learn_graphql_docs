var express = require("express");
var { createHandler } = require("graphql-http/lib/use/express");
var { buildSchema } = require("graphql");
var { ruruHTML } = require("ruru/server");
var schema = buildSchema(`
    type User {
    
    id: String
    name: String
    }


    type Query {
    user(id: String):User
    }
    `);

var fakeDatabase = {
  a: {
    id: "a",
    name: "alice",
  },
  b: {
    id: "b",
    name: "bob",
  },
};

var root = {
  user({ id }) {
    return fakeDatabase[id];
  },
};

var app = express();
app.get("/", (_req, res) => {
  res.type("html");
  res.end(ruruHTML({ endpoint: "/graphql" }));
});
app.all(
  "/graphql",
  createHandler({
    schema: schema,
    rootValue: root,
  })
);

app.listen(4000);
console.log("Running a GraphQL API server at localhost:4000/graphql");
