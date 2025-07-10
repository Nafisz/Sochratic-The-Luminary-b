const getAllTopics = () => prisma.topic.findMany();
const getTopicById = (id) =>
  prisma.topic.findUnique({
    where: { id },
    include: { problems: true }
  });
