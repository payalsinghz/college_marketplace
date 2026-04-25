const CATEGORIES = ['Textbooks', 'Electronics', 'Dorm Essentials', 'Notes', 'Other'];

const inferCategory = (input) => {
  const text = input.toLowerCase();
  if (/book|textbook|edition|semester|author/.test(text)) return 'Textbooks';
  if (/laptop|calculator|earphone|headphone|keyboard|mouse|tablet|charger/.test(text)) {
    return 'Electronics';
  }
  if (/notes|handwritten|printout|assignment|question bank|lab file/.test(text)) return 'Notes';
  if (/mattress|lamp|bucket|bottle|table|chair|hostel|dorm/.test(text)) return 'Dorm Essentials';
  return 'Other';
};

const inferTags = (input) => {
  const words = input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2);

  const unique = [];
  for (const word of words) {
    if (!unique.includes(word)) unique.push(word);
    if (unique.length >= 6) break;
  }

  return unique.length ? unique : ['student', 'campus', 'sale'];
};

const inferPriceRange = (input, category) => {
  const explicitNumbers = [...input.matchAll(/\b(\d{2,6})(?:\.\d{1,2})?\b/g)].map((match) =>
    Number(match[1])
  );
  if (explicitNumbers.length > 0) {
    const pivot = explicitNumbers[0];
    return { min: Math.max(10, Math.round(pivot * 0.9)), max: Math.round(pivot * 1.15) };
  }

  const presets = {
    Textbooks: { min: 200, max: 900 },
    Electronics: { min: 500, max: 4000 },
    'Dorm Essentials': { min: 150, max: 1500 },
    Notes: { min: 80, max: 450 },
    Other: { min: 100, max: 1200 }
  };

  return presets[category] || presets.Other;
};

const heuristicSuggestion = ({ roughText }) => {
  const category = inferCategory(roughText);
  const priceRange = inferPriceRange(roughText, category);
  const compact = roughText.trim().replace(/\s+/g, ' ');
  const title =
    compact.length > 70 ? `${compact.slice(0, 67).trim()}...` : compact || 'Student Item for Sale';

  return {
    title,
    description: `Well-maintained ${category.toLowerCase()} item available for immediate sale on campus. ${compact}. Pickup on campus preferred. Price is negotiable for genuine buyers.`,
    category,
    tags: inferTags(roughText),
    suggestedPriceRange: priceRange,
    confidence: 'medium',
    source: 'heuristic'
  };
};

const parseJsonContent = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

const generateWithOpenAI = async ({ roughText, imageBase64, mimeType }) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const userContent = [{ type: 'text', text: roughText }];
  if (imageBase64 && mimeType) {
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:${mimeType};base64,${imageBase64}` }
    });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'listing_suggestion',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string', enum: CATEGORIES },
              tags: {
                type: 'array',
                items: { type: 'string' },
                minItems: 3,
                maxItems: 8
              },
              suggestedPriceRange: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  min: { type: 'number' },
                  max: { type: 'number' }
                },
                required: ['min', 'max']
              },
              confidence: { type: 'string', enum: ['low', 'medium', 'high'] }
            },
            required: ['title', 'description', 'category', 'tags', 'suggestedPriceRange', 'confidence']
          }
        }
      },
      messages: [
        {
          role: 'system',
          content:
            'You are an assistant for a college marketplace. Generate concise, buyer-friendly listing content. Keep claims realistic, avoid exaggeration, and never include prohibited content.'
        },
        { role: 'user', content: userContent }
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content;
  const parsed = parseJsonContent(raw);
  if (!parsed) throw new Error('Failed to parse AI JSON output');
  return { ...parsed, source: 'openai' };
};

const generateListingSuggestion = async (payload) => {
  try {
    const aiSuggestion = await generateWithOpenAI(payload);
    if (aiSuggestion) return aiSuggestion;
  } catch (error) {
    console.error('AI listing assistant fallback triggered:', error.message);
  }

  return heuristicSuggestion(payload);
};

module.exports = { generateListingSuggestion };
