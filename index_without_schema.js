var express = require("express");
var { createHandler } = require("graphql-http/lib/use/express");
var graphql = require("graphql");

var { ruruHTML } = require("ruru/server");
// Maps id to User object
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

var userType = new graphql.GraphQLObjectType({
  name: "User",
  fields: {
    id: { type: graphql.GraphQLString },
    name: { type: graphql.GraphQLString },
  },
});

var queryType = new graphql.GraphQLObjectType({
  name: "Query",

  fields: {
    user: {
      type: userType,

      args: {
        id: { type: graphql.GraphQLString },
      },
      resolve: (_, { id }) => {
        return fakeDatabase[id];
      },
    },
  },
});

var schema = new graphql.GraphQLSchema({ query: queryType });

var app = express();
app.get("/", (_req, res) => {
  res.type("html");
  res.end(ruruHTML({ endpoint: "/graphql" }));
});
app.all(
  "/graphql",
  createHandler({
    schema: schema,
  })
);

app.listen(4000);
console.log("Running a GraphQL API server at localhost:4000/graphql");
