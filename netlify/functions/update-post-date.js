const { google } = require('googleapis');

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
    const { post_id, new_date } = JSON.parse(event.body || '{}');

    if (!post_id || !new_date) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing post_id or new_date' })
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

    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Spreadsheet ID not configured' })
      };
    }

    // Parse post ID format: {sheetName}_{rowIndex}
    const lastUnderscore = post_id.lastIndexOf('_');
    if (lastUnderscore === -1) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid post ID format' })
      };
    }

    const sheetName = post_id.substring(0, lastUnderscore);
    const rowIndex = parseInt(post_id.substring(lastUnderscore + 1));

    if (isNaN(rowIndex) || rowIndex < 1) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid row index' })
      };
    }

    // Setup Google Sheets API
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const sheets = google.sheets({ version: 'v4', auth });

    // Get header row to find date column
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${sheetName}!A1:Z1`
    });

    const headers_row = headerResponse.data.values?.[0] || [];
    const dateColIndex = headers_row.findIndex(h => 
      h && (h.toLowerCase().includes('fecha') || h.toLowerCase().includes('date'))
    );

    if (dateColIndex === -1) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Date column not found in sheet' })
      };
    }

    // Convert column index to letter (A=0, B=1, etc.)
    const columnLetter = String.fromCharCode(65 + dateColIndex);
    const cellRange = `${sheetName}!${columnLetter}${rowIndex}`;

    // Update the date
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: cellRange,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[new_date]]
      }
    });

    console.log('Updated date:', cellRange, '=', new_date);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Date updated successfully',
        cell: cellRange,
        new_date: new_date
      })
    };

  } catch (error) {
    console.error('Update date error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        details: error.toString()
      })
    };
  }
};
