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
    // Map of sheet patterns to post types
    const sheetConfigs = [
      { pattern: /feed|posts|publicaciones/i, defaultType: 'feed' },
      { pattern: /stories|historias/i, defaultType: 'story' }
    ];

    // First, get all sheet names
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(title))`;
    const metaResponse = await fetch(metaUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (metaResponse.status !== 200) {
      console.error('Failed to get sheet names');
      return posts;
    }

    const metaData = await metaResponse.json();
    const sheets = metaData.sheets || [];

    // Process each sheet
    for (const sheet of sheets) {
      const sheetName = sheet.properties.title;
      
      // Determine default type based on sheet name
      let defaultType = 'feed';
      for (const config of sheetConfigs) {
        if (config.pattern.test(sheetName)) {
          defaultType = config.defaultType;
          break;
        }
      }

      // Read data from this sheet
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:Z`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (response.status !== 200) continue;

      const data = await response.json();
      const rows = data.values || [];

      if (rows.length < 2) continue;

      // Parse header to find column indices
      const header = rows[0].map(h => (h || '').toLowerCase());
      const colIndices = {
        date: findColumnIndex(header, ['fecha', 'date', 'día', 'dia']),
        time: findColumnIndex(header, ['hora', 'time', 'horario']),
        message: findColumnIndex(header, ['mensaje completo', 'mensaje', 'copy', 'texto']),
        type: findColumnIndex(header, ['tipo', 'type', 'formato', 'format']),
        platform: findColumnIndex(header, ['plataforma', 'plataformas', 'platform', 'red']),
        image: findColumnIndex(header, ['url imagen', 'imagen', 'image', 'url', 'asset', 'pieza']),
        hashtags: findColumnIndex(header, ['hashtags', 'tags'])
      };

      // Skip header row
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 0) continue;

        const dateStr = colIndices.date >= 0 ? (row[colIndices.date] || '') : '';
        if (!dateStr) continue;
        
        // Only include posts from the requested month
        if (!dateStr.startsWith(monthStr)) continue;

        // Determine post type
        let postType = defaultType;
        if (colIndices.type >= 0 && row[colIndices.type]) {
          const typeValue = row[colIndices.type].toLowerCase();
          if (typeValue.includes('reel')) postType = 'reel';
          else if (typeValue.includes('carrusel') || typeValue.includes('carousel')) postType = 'carousel';
          else if (typeValue.includes('story') || typeValue.includes('historia')) postType = 'story';
          else if (typeValue.includes('feed') || typeValue.includes('post') || typeValue.includes('educational') || typeValue.includes('case') || typeValue.includes('humor')) postType = 'feed';
        }

        // Parse and normalize time (convert "12:00 PM" to "12:00")
        let time = colIndices.time >= 0 ? (row[colIndices.time] || '') : '';
        time = normalizeTime(time);
        
        // Get message (copy completo)
        const message = colIndices.message >= 0 ? (row[colIndices.message] || '') : '';
        if (!message) continue; // Skip empty rows
        
        // Generate title from type + preview of message
        const typeLabel = postType === 'feed' ? '📱' : postType === 'story' ? '📲' : postType === 'reel' ? '🎬' : '🎠';
        const messagePreview = message.length > 50 ? message.substring(0, 50) + '...' : message;
        const title = `${typeLabel} ${messagePreview}`;
        
        // Parse platform (handle "FB + IG" format)
        let platform = colIndices.platform >= 0 ? (row[colIndices.platform] || 'both') : 'both';
        platform = normalizePlatform(platform);
        
        // Parse and convert Google Drive URL
        let imageUrl = colIndices.image >= 0 ? (row[colIndices.image] || '') : '';
        imageUrl = convertDriveUrl(imageUrl);
        
        // Get hashtags
        const hashtags = colIndices.hashtags >= 0 ? (row[colIndices.hashtags] || '') : '';

        posts.push({
          id: `${sheetName}_${i + 1}`,
          sheet_name: sheetName,
          row_index: i + 1,
          date: dateStr,
          time: time,
          title: title,
          description: message,
          hashtags: hashtags,
          type: postType,
          platform: platform.toLowerCase(),
          image_url: imageUrl,
          status: determineStatus(dateStr, time)
        });
      }
    }
  } catch (error) {
    console.error('Error reading sheets:', error);
  }

  return posts;
}

function findColumnIndex(header, possibleNames) {
  for (let i = 0; i < header.length; i++) {
    for (const name of possibleNames) {
      if (header[i].includes(name)) {
        return i;
      }
    }
  }
  return -1;
}

function normalizeTime(timeStr) {
  if (!timeStr) return '';
  
  // Convert "12:00 PM" to "12:00" (24h format)
  try {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return timeStr;
    
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const meridiem = match[3]?.toUpperCase();
    
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  } catch {
    return timeStr;
  }
}

function normalizePlatform(platformStr) {
  if (!platformStr) return 'both';
  
  const lower = platformStr.toLowerCase();
  
  if (lower.includes('fb') && lower.includes('ig')) return 'both';
  if (lower.includes('facebook') && lower.includes('instagram')) return 'both';
  if (lower.includes('facebook')) return 'facebook';
  if (lower.includes('instagram') || lower.includes('ig')) return 'instagram';
  
  return 'both';
}

function convertDriveUrl(url) {
  if (!url) return '';
  
  // Convert Google Drive URLs from /file/d/{id}/view to direct view format
  // Input: https://drive.google.com/file/d/1QqcBVNQKjb8Vow2SXO3MnFocpwOJBS2B/view?usp=drivesdk
  // Output: https://drive.google.com/uc?export=view&id=1QqcBVNQKjb8Vow2SXO3MnFocpwOJBS2B
  
  const match = url.match(/\/file\/d\/([^\/]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  
  // If already in uc format, return as-is
  if (url.includes('/uc?')) return url;
  
  return url;
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
      sheet_name: 'Mock Data',
      row_index: 1,
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
      sheet_name: 'Mock Data',
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
      id: 'reel_1',
      sheet_name: 'Mock Data',
      row_index: 3,
      date: `${monthStr}-10`,
      time: '15:00',
      title: 'Reel: Tutorial rápido',
      description: 'Cómo usar Figma en 30 segundos',
      type: 'reel',
      platform: 'instagram',
      image_url: '',
      status: 'scheduled'
    },
    {
      id: 'carousel_1',
      sheet_name: 'Mock Data',
      row_index: 4,
      date: `${monthStr}-15`,
      time: '14:00',
      title: 'Carrusel: Tendencias 2026',
      description: '5 tendencias de diseño que debes conocer',
      type: 'carousel',
      platform: 'both',
      image_url: '',
      status: 'scheduled'
    }
  ];
}
