exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const postId = event.queryStringParameters?.id;

    if (!postId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing post ID' })
      };
    }

    const body = JSON.parse(event.body || '{}');

    // TODO: Update in Google Sheets
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'updated',
        message: 'Post update not yet implemented. Coming soon!'
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
