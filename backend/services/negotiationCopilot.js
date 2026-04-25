const parseJsonContent = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

const formatConversation = (messages, currentUserId) =>
  messages
    .map((message) => {
      const senderId = String(message?.sender?._id || message?.sender || '');
      const role = senderId === String(currentUserId) ? 'You' : 'Buyer';
      return `${role}: ${String(message?.text || '').trim()}`;
    })
    .filter(Boolean)
    .join('\n');

const detectOffer = (messages) => {
  const joined = messages.map((message) => String(message?.text || '')).join(' ');
  const matches = [...joined.matchAll(/\b(?:rs|inr|₹)?\s*(\d{2,6})\b/gi)];
  if (matches.length === 0) return null;
  const amount = Number(matches[matches.length - 1][1]);
  return Number.isFinite(amount) ? amount : null;
};

const fallbackSuggestions = ({ messages, itemTitle }) => {
  const detectedOffer = detectOffer(messages);
  const counterOffer = detectedOffer ? Math.round(detectedOffer * 1.2) : null;

  return {
    politeReply: `Thanks for your interest in ${itemTitle || 'the item'}. It is in good condition and available.`,
    counterOffer: counterOffer
      ? `I can offer it for Rs ${counterOffer} considering its condition. Let me know if that works for you.`
      : `I appreciate your offer. I can share a fair counter price based on condition and demand.`,
    dealSummary:
      'Great discussion. If we agree on the final price, we can close the deal with campus pickup and immediate handover.',
    source: 'heuristic'
  };
};

const generateWithOpenAI = async ({ messages, itemTitle, currentUserName, currentUserId }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const conversationText = formatConversation(messages, currentUserId);
  const prompt = [
    `You are a negotiation copilot for a college marketplace seller named ${currentUserName || 'Seller'}.`,
    'Generate short, practical suggestions for replying during bargaining.',
    'Keep tone polite, realistic, and confident. Avoid pressure or manipulative language.',
    'Return valid JSON only.',
    '',
    `Item: ${itemTitle || 'Marketplace listing'}`,
    'Recent chat:',
    conversationText || 'No messages yet.'
  ].join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'negotiation_copilot',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              politeReply: { type: 'string' },
              counterOffer: { type: 'string' },
              dealSummary: { type: 'string' }
            },
            required: ['politeReply', 'counterOffer', 'dealSummary']
          }
        }
      },
      messages: [
        {
          role: 'system',
          content:
            'You help users negotiate safely in chat. Keep suggestions concise (1-2 lines each) and clear.'
        },
        { role: 'user', content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content;
  const parsed = parseJsonContent(raw);
  if (!parsed) throw new Error('Failed to parse copilot JSON output');
  return { ...parsed, source: 'openai' };
};

const generateNegotiationSuggestions = async (payload) => {
  try {
    const aiResult = await generateWithOpenAI(payload);
    if (aiResult) return aiResult;
  } catch (error) {
    console.error('Negotiation copilot fallback triggered:', error.message);
  }

  return fallbackSuggestions(payload);
};

module.exports = { generateNegotiationSuggestions };
