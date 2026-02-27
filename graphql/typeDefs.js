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

  type Task {
    id: ID!
    title: String!
    status: String!
    createdAt: String
  }

  type Group {
    id: ID!
    name: String!
    admin: User!
    members: [User]
    createdAt: String
  }

  type Message {
    id: ID!
    sender: User!
    receiver: User
    groupId: Group
    messageType: String!
    content: String
    fileUrl: String
    createdAt: String
  }

  type Query {
    me: User
    getFeed: [Post]
    getFriends: [User]
    getPendingRequests: [FriendRequest]
    searchUsers(q: String!): [User]
    getTasks: [Task]
    getGroups: [Group]
    getDirectMessages(userId: ID!): [Message]
    getGroupMessages(groupId: ID!): [Message]
  }

  type Mutation {
    createPost(content: String!): Post
    acceptFriendRequest(requestId: ID!): String
    rejectFriendRequest(requestId: ID!): String
    sendFriendRequest(receiverId: ID!): FriendRequest
    createTask(title: String!): Task
    updateTaskStatus(taskId: ID!, status: String!): Task
    deleteTask(taskId: ID!): String
    createGroup(name: String!, members: [ID!]!): Group
    addMembersToGroup(groupId: ID!, members: [ID!]!): Group
  }
`;
