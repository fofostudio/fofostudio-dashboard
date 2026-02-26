const fetch = require('node-fetch');
const { google } = require('googleapis');

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
    // Get user's access token from Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!accessToken) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authentication required', assets: [] })
      };
    }

    // FofoStudio Drive root folder
    const rootFolderId = '101aDQpLF84Kfln7fwoPexKa1MPhZBHpz';

    // Initialize Google Drive API
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Get all files recursively
    const allAssets = await getAllFilesRecursive(drive, rootFolderId);

    // Get calendar posts to check associations
    const calendarPosts = await getCalendarPosts(accessToken);

    // Cross-reference assets with calendar
    const assetsWithStatus = allAssets.map(asset => {
      const usedInPost = calendarPosts.find(post => 
        post.image_url && asset.url && post.image_url.includes(asset.id)
      );

      return {
        ...asset,
        usedInCalendar: !!usedInPost,
        postId: usedInPost?.id || null,
        postTitle: usedInPost?.title || null,
        postDate: usedInPost?.date || null
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        assets: assetsWithStatus,
        total: assetsWithStatus.length,
        used: assetsWithStatus.filter(a => a.usedInCalendar).length,
        available: assetsWithStatus.filter(a => !a.usedInCalendar).length
      })
    };

  } catch (error) {
    console.error('Assets error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        assets: [],
        stack: error.stack
      })
    };
  }
};

// Recursive file fetcher
async function getAllFilesRecursive(drive, folderId, path = '') {
  let allFiles = [];

  try {
    // Get all items in current folder
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id,name,mimeType,size,createdTime,imageMediaMetadata,videoMediaMetadata,thumbnailLink,webContentLink)',
      pageSize: 1000,
      orderBy: 'createdTime desc'
    });

    const files = response.data.files || [];

    for (const file of files) {
      const currentPath = path ? `${path}/${file.name}` : file.name;

      if (file.mimeType === 'application/vnd.google-apps.folder') {
        // Recursively get files from subfolder
        const subFiles = await getAllFilesRecursive(drive, file.id, currentPath);
        allFiles = allFiles.concat(subFiles);
      } else {
        // Add file with metadata
        const asset = {
          id: file.id,
          name: file.name,
          path: currentPath,
          type: getAssetType(file.mimeType),
          mimeType: file.mimeType,
          size: formatFileSize(parseInt(file.size || 0)),
          sizeBytes: parseInt(file.size || 0),
          created: file.createdTime,
          thumbnail: file.thumbnailLink || `https://lh3.googleusercontent.com/d/${file.id}`,
          url: `https://lh3.googleusercontent.com/d/${file.id}`,
          aspectRatio: null,
          recommendedType: null,
          width: null,
          height: null
        };

        // Extract dimensions and calculate aspect ratio
        if (file.imageMediaMetadata) {
          asset.width = file.imageMediaMetadata.width;
          asset.height = file.imageMediaMetadata.height;
          asset.aspectRatio = calculateAspectRatio(asset.width, asset.height);
          asset.recommendedType = recommendPostType(asset.aspectRatio);
        } else if (file.videoMediaMetadata) {
          asset.width = file.videoMediaMetadata.width;
          asset.height = file.videoMediaMetadata.height;
          asset.aspectRatio = calculateAspectRatio(asset.width, asset.height);
          asset.recommendedType = recommendPostType(asset.aspectRatio);
        }

        allFiles.push(asset);
      }
    }

    return allFiles;

  } catch (error) {
    console.error(`Error reading folder ${folderId}:`, error);
    return allFiles;
  }
}

// Get calendar posts from Google Sheets
async function getCalendarPosts(accessToken) {
  try {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const sheetName = 'Calendario Marzo 2026';
    const range = `${sheetName}!A2:Z500`;

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const rows = data.values || [];

    return rows.map((row, idx) => ({
      id: `post-${idx + 2}`,
      date: row[0] || '',
      time: row[1] || '',
      title: row[2] || '',
      image_url: row[7] || ''
    }));

  } catch (error) {
    console.error('Error fetching calendar posts:', error);
    return [];
  }
}

function calculateAspectRatio(width, height) {
  if (!width || !height) return null;
  
  const ratio = width / height;
  const commonRatios = {
    '1:1': 1.0,
    '4:5': 0.8,
    '9:16': 0.5625,
    '16:9': 1.7778,
    '3:4': 0.75,
    '4:3': 1.3333
  };

  // Find closest common ratio
  let closestRatio = '1:1';
  let minDiff = Math.abs(ratio - 1.0);

  for (const [label, value] of Object.entries(commonRatios)) {
    const diff = Math.abs(ratio - value);
    if (diff < minDiff) {
      minDiff = diff;
      closestRatio = label;
    }
  }

  return closestRatio;
}

function recommendPostType(aspectRatio) {
  if (!aspectRatio) return 'feed';

  const recommendations = {
    '1:1': 'feed',
    '4:5': 'feed',
    '9:16': 'story',
    '16:9': 'reel',
    '3:4': 'feed',
    '4:3': 'feed'
  };

  return recommendations[aspectRatio] || 'feed';
}

function getAssetType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('application/pdf')) return 'pdf';
  if (mimeType.includes('document')) return 'doc';
  if (mimeType.includes('spreadsheet')) return 'sheet';
  return 'file';
}

function formatFileSize(bytes) {
  if (bytes === 0) return 'N/A';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
