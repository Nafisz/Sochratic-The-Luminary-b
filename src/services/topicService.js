// services/topicService.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllTopics = () => prisma.topic.findMany();

const getTopicById = (id) =>
  prisma.topic.findUnique({
    where: { id },
    include: { problems: true }
  });

module.exports = { getAllTopics, getTopicById };