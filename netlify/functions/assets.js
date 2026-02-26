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
    const filter = event.queryStringParameters?.filter || 'all';

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

    // Determine which subfolder to query
    let folderId = rootFolderId;
    let folderName = 'FofoStudio Root';

    switch (filter) {
      case 'feed':
      case 'stories':
        // Query Social Pieces folder
        folderName = 'Social Pieces';
        // We'll search for this folder first
        break;
      case 'logos':
        folderName = 'Logos';
        break;
      case 'photos':
        folderName = 'Photos';
        break;
      default:
        // Query root folder
        break;
    }

    // If filtering by specific folder, first find that folder ID
    if (filter !== 'all') {
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q='${rootFolderId}'+in+parents+and+name='${folderName}'+and+mimeType='application/vnd.google-apps.folder'&fields=files(id,name)`;
      const searchResponse = await fetch(searchUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.files && searchData.files.length > 0) {
          folderId = searchData.files[0].id;
        }
      }
    }

    // Query files in the target folder
    const filesUrl = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size,createdTime,thumbnailLink,webContentLink)&orderBy=createdTime desc&pageSize=50`;
    const filesResponse = await fetch(filesUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!filesResponse.ok) {
      const errorData = await filesResponse.json();
      return {
        statusCode: filesResponse.status,
        headers,
        body: JSON.stringify({ 
          error: errorData.error?.message || 'Failed to fetch files',
          assets: []
        })
      };
    }

    const filesData = await filesResponse.json();
    const files = filesData.files || [];

    // Transform to asset format
    const assets = files
      .filter(file => {
        // Filter out folders
        if (file.mimeType === 'application/vnd.google-apps.folder') return false;
        
        // Additional filtering based on type
        if (filter === 'feed' || filter === 'stories') {
          return file.mimeType.startsWith('image/') || file.mimeType.startsWith('video/');
        }
        
        return true;
      })
      .map(file => ({
        id: file.id,
        name: file.name,
        type: getAssetType(file.mimeType),
        size: formatFileSize(parseInt(file.size || 0)),
        created: file.createdTime,
        thumbnail: file.thumbnailLink || `https://lh3.googleusercontent.com/d/${file.id}`,
        url: `https://lh3.googleusercontent.com/d/${file.id}`,
        mimeType: file.mimeType
      }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        assets: assets,
        folder: folderName,
        count: assets.length
      })
    };

  } catch (error) {
    console.error('Assets error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        assets: []
      })
    };
  }
};

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
