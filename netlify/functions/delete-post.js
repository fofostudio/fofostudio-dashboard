const fetch = require('node-fetch');
const { google } = require('googleapis');

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'DELETE') {
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

    // Extract sheet name and row index from postId
    let sheetName = 'Calendario Marzo 2026'; // Default
    let rowNumber;

    if (postId.startsWith('sheet-')) {
      const parts = postId.split('-');
      rowNumber = parseInt(parts[parts.length - 1]);
      sheetName = parts.slice(1, -1).join('-');
    } else if (postId.startsWith('post-')) {
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

    // Initialize Google Sheets API
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // Get spreadsheet to find sheet ID
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });

    const sheet = spreadsheet.data.sheets?.find(s => s.properties.title === sheetName);
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }

    const sheetId = sheet.properties.sheetId;

    // Delete the row using batchUpdate
    // Note: rowNumber is 1-indexed, but API uses 0-indexed
    const deleteRequest = {
      spreadsheetId: spreadsheetId,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: rowNumber - 1,  // 0-indexed
              endIndex: rowNumber          // exclusive
            }
          }
        }]
      }
    };

    await sheets.spreadsheets.batchUpdate(deleteRequest);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'deleted',
        message: 'Post eliminado exitosamente',
        postId: postId
      })
    };

  } catch (error) {
    console.error('Delete post error:', error);
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
