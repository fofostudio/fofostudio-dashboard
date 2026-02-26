const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const now = new Date();
    const year = parseInt(event.queryStringParameters?.year || now.getFullYear());
    const month = parseInt(event.queryStringParameters?.month || (now.getMonth() + 1));
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;

    // Get user's access token from Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    let posts = [];

    // Try to read from Google Sheets if authenticated
    if (accessToken) {
      const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
      if (spreadsheetId) {
        posts = await readSheetsData(accessToken, spreadsheetId, year, month, monthStr);
      }
    }

    // Fallback to mock data if no auth or error
    if (posts.length === 0) {
      posts = getMockPosts(year, month, monthStr);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ posts })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message, posts: [] })
    };
  }
};

async function readSheetsData(accessToken, spreadsheetId, year, month, monthStr) {
  const posts = [];

  try {
    const sheetNames = ['Calendario Marzo 2026', 'Calendario Stories IG'];

    for (const sheetName of sheetNames) {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:Z`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.status !== 200) continue;

      const data = await response.json();
      const rows = data.values || [];

      if (rows.length < 2) continue;

      // Skip header row
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 3) continue;

        const dateStr = row[0] || '';
        if (!dateStr.startsWith(monthStr)) continue;

        posts.push({
          id: `${sheetName}_${i + 1}`,
          sheet_name: sheetName,
          row_index: i + 1,
          date: dateStr,
          time: row[1] || '',
          title: row[2] || '',
          description: row[3] || '',
          type: sheetName.includes('Stories') ? 'story' : 'feed',
          platform: row[4] || 'both',
          image_url: row[5] || '',
          status: determineStatus(dateStr, row[1] || '')
        });
      }
    }
  } catch (error) {
    console.error('Error reading sheets:', error);
  }

  return posts;
}

function determineStatus(dateStr, timeStr) {
  try {
    if (!dateStr) return 'scheduled';
    
    const postDateTime = new Date(`${dateStr} ${timeStr || '00:00'}`);
    const now = new Date();
    
    if (postDateTime > now) {
      return 'scheduled';
    } else if (postDateTime < new Date(now - 2 * 60 * 60 * 1000)) {
      return 'published';
    } else {
      return 'scheduled';
    }
  } catch {
    return 'scheduled';
  }
}

function getMockPosts(year, month, monthStr) {
  return [
    {
      id: 'feed_1',
      sheet_name: 'Calendario Marzo 2026',
      row_index: 2,
      date: `${monthStr}-05`,
      time: '12:00',
      title: 'Post educativo: Tips de diseño',
      description: 'Comparte consejos prácticos sobre diseño web',
      type: 'feed',
      platform: 'both',
      image_url: '',
      status: 'scheduled'
    },
    {
      id: 'story_1',
      sheet_name: 'Calendario Stories IG',
      row_index: 2,
      date: `${monthStr}-05`,
      time: '18:00',
      title: 'Story: Behind the scenes',
      description: 'Muestra el proceso de trabajo',
      type: 'story',
      platform: 'instagram',
      image_url: '',
      status: 'scheduled'
    },
    {
      id: 'feed_2',
      sheet_name: 'Calendario Marzo 2026',
      row_index: 3,
      date: `${monthStr}-10`,
      time: '15:00',
      title: 'Caso de éxito: Cliente TechCorp',
      description: 'Resultados de +150% engagement',
      type: 'feed',
      platform: 'both',
      image_url: '',
      status: 'scheduled'
    }
  ];
}
