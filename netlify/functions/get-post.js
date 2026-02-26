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
    const postId = event.queryStringParameters?.id;

    if (!postId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing post ID' })
      };
    }

    // Parse ID format: {sheetName}_{rowIndex}
    const lastUnderscore = postId.lastIndexOf('_');
    if (lastUnderscore === -1) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid post ID format' })
      };
    }

    const sheetName = postId.substring(0, lastUnderscore);
    const rowIndex = parseInt(postId.substring(lastUnderscore + 1));

    if (isNaN(rowIndex) || rowIndex < 1) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid row index in post ID' })
      };
    }

    // Get user's access token from Authorization header
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

    // Read the specific sheet
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:Z`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (response.status !== 200) {
      const errorData = await response.json();
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: errorData.error?.message || 'Failed to read sheet' })
      };
    }

    const data = await response.json();
    const rows = data.values || [];

    if (rows.length < 2 || rowIndex > rows.length) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Post not found' })
      };
    }

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

    // Get the specific row (rowIndex is 1-based, but rows array is 0-based)
    const row = rows[rowIndex - 1];

    if (!row || row.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Post row is empty' })
      };
    }

    // Determine default type based on sheet name
    let defaultType = 'feed';
    if (/feed|posts|publicaciones/i.test(sheetName)) defaultType = 'feed';
    else if (/stories|historias/i.test(sheetName)) defaultType = 'story';

    // Parse post type
    let postType = defaultType;
    if (colIndices.type >= 0 && row[colIndices.type]) {
      const typeValue = row[colIndices.type].toLowerCase();
      if (typeValue.includes('reel')) postType = 'reel';
      else if (typeValue.includes('carrusel') || typeValue.includes('carousel')) postType = 'carousel';
      else if (typeValue.includes('story') || typeValue.includes('historia')) postType = 'story';
      else if (typeValue.includes('feed') || typeValue.includes('post') || typeValue.includes('educational') || typeValue.includes('case') || typeValue.includes('humor')) postType = 'feed';
    }

    const dateStr = colIndices.date >= 0 ? (row[colIndices.date] || '') : '';
    
    // Parse and normalize time
    let time = colIndices.time >= 0 ? (row[colIndices.time] || '') : '';
    time = normalizeTime(time);
    
    // Get message (copy completo)
    const message = colIndices.message >= 0 ? (row[colIndices.message] || '') : '';
    
    // Generate title from type + preview of message
    const typeLabel = postType === 'feed' ? '📱' : postType === 'story' ? '📲' : postType === 'reel' ? '🎬' : '🎠';
    const messagePreview = message.length > 50 ? message.substring(0, 50) + '...' : message;
    const title = `${typeLabel} ${messagePreview}`;
    
    // Parse platform
    let platform = colIndices.platform >= 0 ? (row[colIndices.platform] || 'both') : 'both';
    platform = normalizePlatform(platform);
    
    // Parse and convert Google Drive URL
    let imageUrl = colIndices.image >= 0 ? (row[colIndices.image] || '') : '';
    imageUrl = convertDriveUrl(imageUrl);
    
    // Get hashtags
    const hashtags = colIndices.hashtags >= 0 ? (row[colIndices.hashtags] || '') : '';

    const post = {
      id: postId,
      sheet_name: sheetName,
      row_index: rowIndex,
      date: dateStr,
      time: time,
      title: title,
      description: message,
      hashtags: hashtags,
      type: postType,
      platform: platform.toLowerCase(),
      image_url: imageUrl,
      status: determineStatus(dateStr, time)
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(post)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

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
  
  // Convert Google Drive URLs to Google's CDN format (works for images AND videos as thumbnails)
  // Input: https://drive.google.com/file/d/1QqcBVNQKjb8Vow2SXO3MnFocpwOJBS2B/view?usp=drivesdk
  // Output: https://lh3.googleusercontent.com/d/1QqcBVNQKjb8Vow2SXO3MnFocpwOJBS2B
  
  const match = url.match(/\/file\/d\/([^\/\?]+)/);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  
  // Also handle /uc?id= format
  const ucMatch = url.match(/[?&]id=([^&]+)/);
  if (ucMatch && ucMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`;
  }
  
  // If already in lh3 format, return as-is
  if (url.includes('lh3.googleusercontent.com')) return url;
  
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
