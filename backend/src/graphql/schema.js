const tripService = require('../services/tripService');

const typeDefs = `
  type Trip {
    id: Int!
    destination: String!
    startDate: String!
    endDate: String!
    price: Int!
  }

  type PaginatedTrips {
    page: Int!
    pageSize: Int!
    totalItems: Int!
    totalPages: Int!
    items: [Trip!]!
  }

  type TripStats {
    totalTrips: Int!
    totalPrice: Int!
    averagePrice: Float!
  }

  type Query {
    trips(page: Int, pageSize: Int): PaginatedTrips!
    trip(id: Int!): Trip
    tripStats: TripStats!
  }

  type Mutation {
    addTrip(
      destination: String!
      startDate: String!
      endDate: String!
      price: Int!
    ): Trip!

    updateTrip(
      id: Int!
      destination: String!
      startDate: String!
      endDate: String!
      price: Int!
    ): Trip

    deleteTrip(id: Int!): Boolean!
  }
`;

const resolvers = {
  Query: {
    trips: (_, { page = 1, pageSize = 10 }) => {
      return tripService.getAllTrips(page, pageSize);
    },
    trip: (_, { id }) => {
      return tripService.getTripById(id);
    },
    tripStats: () => {
      return tripService.getTripStats();
    }
  },

  Mutation: {
    addTrip: (_, { destination, startDate, endDate, price }) => {
      return tripService.createTrip({
        destination,
        startDate,
        endDate,
        price
      });
    },

    updateTrip: (_, { id, destination, startDate, endDate, price }) => {
      return tripService.updateTrip(id, {
        destination,
        startDate,
        endDate,
        price
      });
    },

    deleteTrip: (_, { id }) => {
      return tripService.deleteTrip(id);
    }
  }
};

module.exports = {
  typeDefs,
  resolvers
};