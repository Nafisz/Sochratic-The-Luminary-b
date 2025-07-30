// promptManager.js

const behaviorPrompt =
  `Act as an AI mentor on a discussion and project-based learning platform. ` +
  `Focus on reflective thinking and deep understanding. ` +
  `Don't directly explain concepts or give answers. ` +
  `Use Socratic approach, help users think through dilemma questions and clarification.`;

/**
 * Generate automatic instructions based on mode
 * @param {string} mode
 * @param {string} topic
 * @param {string[]} chatHistory
 * @param {string} problem
 * @param {object} activeRecall
 * @returns {string}
 */
function getAutoPrompt(mode, topic, chatHistory = [], problem = '', activeRecall = null) {
  switch (mode) {
    case 'EXPLAIN_CONCEPT':
      return `User needs concept explanation. Provide explanation from notation name (form) usage example, relevant to topic "${topic}", and mark with <MATERIAL_TYPE=...>. Explanation should be deep but engaging.`;

    case 'REQUEST_SOLUTION':
      return `Ask user to compose final solution based on discussion and understanding that has occurred. Don't help first, let user try independently.`;

    case 'ENTER_IMPLEMENTATION':
      return `User has provided relevant final solution. See user's solution:\n${chatHistory.join('\n')}\nwhich impacts the problem "${problem}". Create code version or implementation from user's solution in executable code form but leave empty parts that user must complete in sections related to topic "${topic}". Add tag <IMPLEMENTATION_START> and <EXP_ADD=...> if successful.`;

    case 'ACTIVE_RECALL':
      if (!activeRecall) {
        return `No active recall data available. Continue with normal conversation.`;
      }
      return `Active Recall Session:\n- ${activeRecall.test1}\n- ${activeRecall.test2}\n- ${activeRecall.test3}\n- ${activeRecall.test4}\n\nAsk user to answer these questions to test their understanding. Mark with <ACTIVE_RECALL_MODE> and <EXP_ADD=...> for correct answers.`;

    default:
      return '';
  }
}

/**
 * Build complete prompt to send to OpenAI
 * @param {string} userMessage
 * @param {object} context
 * @param {string} context.mode
 * @param {string} context.topic
 * @param {string[]} context.chatHistory
 * @param {string} context.problem
 * @param {object} context.activeRecall
 * @returns {string}
 */
function buildPrompt(userMessage, context = {}) {
  const {
    mode = 'DEFAULT',
    topic = '',
    chatHistory = [],
    problem = '',
    activeRecall = null
  } = context;

  const autoPrompt = getAutoPrompt(mode, topic, chatHistory, problem, activeRecall);

  return `
${behaviorPrompt}

${autoPrompt ? '\nAdditional instructions:\n' + autoPrompt : ''}

Discussion topic: ${topic || 'Not specified'}

User: ${userMessage}
AI:
`.trim();
}

module.exports = { buildPrompt };