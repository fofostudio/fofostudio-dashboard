const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!accessToken) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authentication required' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { post_id, image_url } = body;

    if (!post_id || !image_url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing post_id or image_url' })
      };
    }

    // Extract sheet name and row index from post_id
    let sheetName = 'Calendario Marzo 2026'; // Default
    let rowNumber;

    if (post_id.startsWith('sheet-')) {
      const parts = post_id.split('-');
      rowNumber = parseInt(parts[parts.length - 1]);
      sheetName = parts.slice(1, -1).join('-');
    } else if (post_id.startsWith('post-')) {
      rowNumber = parseInt(post_id.replace('post-', ''));
    } else {
      rowNumber = parseInt(post_id);
    }

    if (isNaN(rowNumber)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid post ID format' })
      };
    }

    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    // Update only column H (URL Imagen) at row {rowNumber}
    const range = `${sheetName}!H${rowNumber}`;

    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    
    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [[image_url]]
      })
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(errorData.error?.message || 'Failed to update image URL');
    }

    const result = await updateResponse.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Imagen actualizada exitosamente',
        image_url: image_url,
        updatedRange: result.updatedRange
      })
    };

  } catch (error) {
    console.error('Update image error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        stack: error.stack
      })
    };
  }
};
