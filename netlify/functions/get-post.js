exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
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

    // Mock data for now
    const mockPost = {
      id: postId,
      sheet_name: 'Calendario Marzo 2026',
      row_index: 2,
      date: '2026-03-05',
      time: '12:00',
      title: 'Post educativo: Tips de diseño',
      description: 'Comparte consejos prácticos sobre diseño web',
      type: 'feed',
      platform: 'both',
      image_url: '',
      status: 'scheduled'
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mockPost)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
