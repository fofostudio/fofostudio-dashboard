const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
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

    // Get user's access token
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
    const { title, description, date, time, type, platform, image_url } = body;

    // Extract sheet name and row index from postId
    // Format: "post-{rowNumber}" or "sheet-{sheetName}-{rowNumber}"
    let sheetName = 'Calendario Marzo 2026'; // Default
    let rowNumber;

    if (postId.startsWith('sheet-')) {
      // Format: sheet-{sheetName}-{rowNumber}
      const parts = postId.split('-');
      rowNumber = parseInt(parts[parts.length - 1]);
      sheetName = parts.slice(1, -1).join('-');
    } else if (postId.startsWith('post-')) {
      // Format: post-{rowNumber}
      rowNumber = parseInt(postId.replace('post-', ''));
    } else {
      rowNumber = parseInt(postId);
    }

    if (isNaN(rowNumber)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid post ID format' })
      };
    }

    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    // Build updated row
    // Expected columns: Fecha | Hora | Mensaje Completo | Descripción | Tipo | Estado | Plataformas | URL Imagen
    const range = `${sheetName}!A${rowNumber}:H${rowNumber}`;

    // First, get current row to preserve values we're not updating
    const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
    const getResponse = await fetch(getUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!getResponse.ok) {
      throw new Error('Failed to fetch current post data');
    }

    const currentData = await getResponse.json();
    const currentRow = currentData.values?.[0] || [];

    // Update fields (preserve existing if not provided)
    const updatedRow = [
      date || currentRow[0] || '',           // A: Fecha
      time || currentRow[1] || '',           // B: Hora
      title || currentRow[2] || '',          // C: Mensaje Completo
      description !== undefined ? description : (currentRow[3] || ''),  // D: Descripción
      type || currentRow[4] || '',           // E: Tipo
      currentRow[5] || 'scheduled',          // F: Estado (preserve)
      platform || currentRow[6] || '',       // G: Plataformas
      image_url || currentRow[7] || ''       // H: URL Imagen
    ];

    // Update in Google Sheets
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    
    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [updatedRow]
      })
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(errorData.error?.message || 'Failed to update post');
    }

    const result = await updateResponse.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'updated',
        message: 'Post actualizado exitosamente',
        post: {
          id: postId,
          date: updatedRow[0],
          time: updatedRow[1],
          title: updatedRow[2],
          description: updatedRow[3],
          type: updatedRow[4],
          status: updatedRow[5],
          platform: updatedRow[6],
          image_url: updatedRow[7]
        },
        updatedRange: result.updatedRange
      })
    };

  } catch (error) {
    console.error('Update post error:', error);
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
