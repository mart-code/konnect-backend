export const typeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    firstName: String
    lastName: String
    image: String
    color: Int
    profileSetup: Boolean
    friends: [User]
  }

  type Post {
    id: ID!
    author: User!
    content: String!
    likes: [User]
    createdAt: String
    updatedAt: String
  }

  type FriendRequest {
    id: ID!
    sender: User!
    receiver: User!
    status: String!
    createdAt: String
  }

  type Query {
    me: User
    getFeed: [Post]
    getFriends: [User]
    getPendingRequests: [FriendRequest]
  }

  type Mutation {
    createPost(content: String!): Post
    acceptFriendRequest(requestId: ID!): String
    rejectFriendRequest(requestId: ID!): String
  }
`;
