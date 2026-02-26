const fetch = require('node-fetch');
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
    const { post_id, image_data, file_name } = body;

    if (!post_id || !image_data || !file_name) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing post_id, image_data, or file_name' })
      };
    }

    // Initialize Google Drive API
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // FofoStudio Drive root folder
    const rootFolderId = '101aDQpLF84Kfln7fwoPexKa1MPhZBHpz';

    // Create "Uploads" subfolder if it doesn't exist
    let uploadsFolderId;
    const searchResponse = await drive.files.list({
      q: `'${rootFolderId}' in parents and name='Uploads' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)'
    });

    if (searchResponse.data.files && searchResponse.data.files.length > 0) {
      uploadsFolderId = searchResponse.data.files[0].id;
    } else {
      // Create folder
      const createFolderResponse = await drive.files.create({
        requestBody: {
          name: 'Uploads',
          mimeType: 'application/vnd.google-apps.folder',
          parents: [rootFolderId]
        },
        fields: 'id'
      });
      uploadsFolderId = createFolderResponse.data.id;
    }

    // Convert base64 to buffer
    const base64Image = image_data.split(';base64,').pop();
    const imageBuffer = Buffer.from(base64Image, 'base64');

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file_name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${timestamp}-${sanitizedFileName}`;

    // Upload to Google Drive
    const uploadResponse = await drive.files.create({
      requestBody: {
        name: uniqueFileName,
        parents: [uploadsFolderId]
      },
      media: {
        mimeType: 'image/jpeg',
        body: imageBuffer
      },
      fields: 'id, webViewLink, webContentLink'
    });

    const fileId = uploadResponse.data.id;

    // Make file publicly accessible
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    // Generate direct link (lh3.googleusercontent.com format)
    const imageUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

    // Update post with new image URL
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

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

    // Update only column H (URL Imagen)
    const range = `${sheetName}!H${rowNumber}`;

    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    
    const updateResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [[imageUrl]]
      })
    });

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error('Failed to update Sheets:', errorData);
      // Continue anyway - image is uploaded
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Imagen subida exitosamente',
        image_url: imageUrl,
        file_id: fileId,
        file_name: uniqueFileName
      })
    };

  } catch (error) {
    console.error('Upload image error:', error);
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
