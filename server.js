var { graphql, buildSchema } = require("graphql");
var express = require("express");
var { createHandler } = require("graphql-http/lib/use/express");
var { ruruHTML } = require("ruru/server");
var cors = require("cors");

// var schema = buildSchema(
//   `
//     type Query {
//     hello :String
//     quoteOfTheDay: String
//     random: Float!
//     rollThreeDice(numDice:Int!, numSides: Int): [Int]
//     rollDice(numDice: Int!, numSides: Int): [Int]    }
//     `
// );

// var root = {
//   hello() {
//     return "Hello world";
//   },
//   quoteOfTheDay() {
//     return Math.random() < 0.5 ? "Take it easy" : "Salvation lies within";
//   },
//   random() {
//     return Math.random();
//   },
//   rollThreeDice(args) {
//     var output = [];
//     for (var i = 0; i < args.numDice; i++) {
//       output.push(1 + Math.floor(Math.random() * (args.numSides || 6)));
//     }
//     return output;
//   },
//   rollDice({ numDice, numSides = 6 }) {
//     console.log("running");
//     if (numDice < 1 || numSides < 2) {
//       throw new Error(
//         "Number of dice must be at least 1, and sides at least 2."
//       );
//     }
//     const results = [];
//     for (let i = 0; i < numDice; i++) {
//       results.push(1 + Math.floor(Math.random() * numSides));
//     }
//     return results;
//   },
// };

var schema = buildSchema(`
    input MessageInput {
        content: String
        author: String
    }

    type Message {
        id: ID!
        content: String
        author: String
    }

    

    
    type RandomDie {
      numSides: Int!
        rollOnce: Int!
     roll(numRolls: Int!): [Int]
    }

    type Query {
        getDie(numSides: Int): RandomDie
        
         getMessage(id: ID!): Message
          ip: String
         
         }
       
    
    type Mutation  {
        createMessage(input:MessageInput):Message
        updateMessage(id: ID!, input: MessageInput):Message
    
    }
    
        `);

function loggingMiddleware(req, res, next) {
  console.log("ip:", req.ip);
  next();
}
class RandomDie {
  constructor(numSides) {
    this.numSides = numSides;
  }

  rollOnce() {
    return 1 + Math.floor(Math.random() * this.numSides);
  }
  roll({ numRolls }) {
    var output = [];
    for (var i = 0; i < numRolls; i++) {
      output.push(this.rollOnce());
    }
    return output;
  }
}

class Message {
  constructor(id, { content, author }) {
    this.id = id;
    this.content = content;
    this.author = author;
  }
}

var fakeDatabase = {};

var root = {
  getDie({ numSides }) {
    return new RandomDie(numSides || 6);
  },
  getMessage({ id }) {
    if (!fakeDatabase[id]) {
      throw new Error("no message exists with id " + id);
    }
    return new Message(id, fakeDatabase[id]);
  },

  createMessage({ input }) {
    // Create a random id for our "database".
    var id = require("crypto").randomBytes(10).toString("hex");

    fakeDatabase[id] = input;
    return new Message(id, input);
  },
  updateMessage({ id, input }) {
    if (!fakeDatabase[id]) {
      throw new Error("no message exists with id " + id);
    }
    // This replaces all old data, but some apps might want partial update.
    fakeDatabase[id] = input;
    return new Message(id, input);
  },

  ip(args, context) {
    return context.ip;
  },
};

var app = express();
app.use(cors());
app.use(loggingMiddleware);
app.get("/", (_req, res) => {
  res.type("html");
  res.end(ruruHTML({ endpoint: "/graphql" }));
});

app.all(
  "/graphql",
  createHandler({
    schema,
    rootValue: root,
    context: (req) => ({
      ip: req.raw.ip,
    }),
  })
);

app.listen(4000);
console.log("Running a GraphQL API server at http://localhost:4000/graphql");

// testing it in client
// curl -X POST \
// -H "Content-Type: application/json" \
// -d '{"query": "{ hello }"}' \
// http://localhost:4000/graphql

// fetch("http://localhost:4000/graphql", {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//     Accept: "application/json",
//   },
//   body: JSON.stringify({ query: "{ hello }" }),
// })
//   .then((r) => r.json())
//   .then((data) => console.log("data returned:", data));

// testing rollDice

// var dice = 3;
// var sides = 6;
// var query = /* GraphQL */ `
//   query RollDice($dice: Int!, $sides: Int) {
//     rollDice(numDice: $dice, numSides: $sides)
//   }
// `;

// const url = "http://localhost:4000/graphql";
// fetch(url, {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//     Accept: "application/json",
//   },
//   body: JSON.stringify({
//     query,
//     variables: { dice, sides },
//   }),
// })
//   .then((r) => r.json())
//   .then((data) => console.log("data returned:", data));
