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

    const body = JSON.parse(event.body);
    const { 
      assetId, 
      assetUrl, 
      assetName,
      date, 
      time, 
      title, 
      description, 
      type,
      platform 
    } = body;

    if (!assetId || !assetUrl || !date || !title || !type) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const sheetName = 'Calendario Marzo 2026';

    // Build new row
    // Expected columns: Fecha | Hora | Mensaje Completo | Descripción | Tipo | Estado | Plataformas | URL Imagen
    const newRow = [
      date,                           // A: Fecha
      time || '12:00',                // B: Hora
      title,                          // C: Mensaje Completo
      description || '',              // D: Descripción
      type,                           // E: Tipo (feed/story/reel/carousel)
      'scheduled',                    // F: Estado
      platform || 'both',             // G: Plataformas (both/facebook/instagram)
      assetUrl                        // H: URL Imagen
    ];

    // Append to sheet
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:append?valueInputOption=USER_ENTERED`;
    
    const appendResponse = await fetch(appendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [newRow]
      })
    });

    if (!appendResponse.ok) {
      const errorData = await appendResponse.json();
      throw new Error(errorData.error?.message || 'Failed to create post in calendar');
    }

    const result = await appendResponse.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Post created successfully',
        post: {
          date,
          time,
          title,
          description,
          type,
          platform,
          image_url: assetUrl
        },
        updatedRange: result.updates?.updatedRange
      })
    };

  } catch (error) {
    console.error('Create post from asset error:', error);
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
