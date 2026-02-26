exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS'
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

    // TODO: Delete from Google Sheets
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'deleted',
        message: 'Post deletion not yet implemented. Coming soon!'
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
