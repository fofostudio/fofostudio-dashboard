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
    const { post_id, sheet_name, row_index, description, type, platform } = JSON.parse(event.body || '{}');

    if (!post_id || !description) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing post_id or description' })
      };
    }

    // Get user's OAuth token
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const userAccessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!userAccessToken) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authentication required' })
      };
    }

    // === STEP 1: Generate image with NanobananaAPI ===
    const prompt = generatePrompt(description, type, platform);
    const aspectRatio = type === 'story' ? '9:16' : '4:5'; // Story vertical, Feed cuadrado
    
    const nanobananaApiKey = process.env.NANOBANANA_API_KEY || '5ed16c1bb7c3c42bcb94cc78aa4f97db';
    
    console.log('Generating image with prompt:', prompt);
    
    const generateResponse = await fetch('https://api.nanobananaapi.ai/api/v1/nanobanana/generate-pro', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nanobananaApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        resolution: '2K',
        aspectRatio: aspectRatio,
        model: 'nano-banana-pro'
        // No callback URL - we'll poll instead for simplicity
      })
    });

    const generateData = await generateResponse.json();
    
    if (!generateResponse.ok || generateData.code !== 200) {
      throw new Error(generateData.msg || 'NanobananaAPI error');
    }

    const taskId = generateData.data?.taskId;
    if (!taskId) {
      throw new Error('No taskId returned from NanobananaAPI');
    }

    console.log('Task created:', taskId);

    // === STEP 2: Poll for result ===
    let resultImageUrl = null;
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds max

    while (attempts < maxAttempts && !resultImageUrl) {
      await sleep(2000); // Wait 2 seconds
      
      const recordResponse = await fetch(
        `https://api.nanobananaapi.ai/api/v1/nanobanana/record-info?taskId=${taskId}`,
        {
          headers: { 'Authorization': `Bearer ${nanobananaApiKey}` }
        }
      );

      const recordData = await recordResponse.json();
      
      if (recordData.code === 200 && recordData.data?.info?.resultImageUrl) {
        resultImageUrl = recordData.data.info.resultImageUrl;
        console.log('Image generated:', resultImageUrl);
        break;
      }
      
      if (recordData.code === 501) {
        throw new Error('Image generation failed: ' + (recordData.msg || 'Unknown error'));
      }
      
      attempts++;
    }

    if (!resultImageUrl) {
      throw new Error('Image generation timeout - try again later');
    }

    // === STEP 3: Download image ===
    const imageResponse = await fetch(resultImageUrl);
    const imageBuffer = await imageResponse.buffer();
    const imageBase64 = imageBuffer.toString('base64');

    // === STEP 4: Upload to Google Drive ===
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: userAccessToken });
    
    const drive = google.drive({ version: 'v3', auth });

    // Create filename
    const timestamp = new Date().toISOString().split('T')[0];
    const typePrefix = type === 'story' ? 'story' : 'feed';
    const filename = `${typePrefix}_${timestamp}_${taskId.substring(0, 8)}.jpg`;

    // Get/create "Social Pieces" folder
    const rootFolderId = '101aDQpLF84Kfln7fwoPexKa1MPhZBHpz';
    const socialPiecesFolderId = await getOrCreateFolder(drive, 'Social Pieces', rootFolderId);

    // Get/create date subfolder (e.g., "2026-02-25")
    const dateFolderId = await getOrCreateFolder(drive, timestamp, socialPiecesFolderId);

    // Upload file
    const fileMetadata = {
      name: filename,
      parents: [dateFolderId]
    };

    const media = {
      mimeType: 'image/jpeg',
      body: Buffer.from(imageBase64, 'base64')
    };

    const uploadResponse = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink'
    });

    const driveFileId = uploadResponse.data.id;
    const driveUrl = `https://drive.google.com/file/d/${driveFileId}/view`;
    const directUrl = `https://lh3.googleusercontent.com/d/${driveFileId}`;

    console.log('Uploaded to Drive:', driveUrl);

    // === STEP 5: Update Google Sheets ===
    if (sheet_name && row_index) {
      const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
      if (spreadsheetId) {
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Find "URL Imagen" column
        const headerResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: spreadsheetId,
          range: `${sheet_name}!A1:Z1`
        });

        const headers = headerResponse.data.values?.[0] || [];
        const imageColIndex = headers.findIndex(h => h.toLowerCase().includes('imagen') || h.toLowerCase().includes('image'));

        if (imageColIndex >= 0) {
          const columnLetter = String.fromCharCode(65 + imageColIndex); // A=65
          const cellRange = `${sheet_name}!${columnLetter}${row_index}`;

          await sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: cellRange,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[driveUrl]]
            }
          });

          console.log('Updated Sheets:', cellRange, '=', driveUrl);
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Pieza regenerada exitosamente',
        task_id: taskId,
        drive_url: driveUrl,
        direct_url: directUrl,
        filename: filename
      })
    };

  } catch (error) {
    console.error('Regenerate image error:', error);
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

// === HELPERS ===

function generatePrompt(description, type, platform) {
  // Extract first sentence or first 100 chars
  const mainMessage = description.split('\n')[0].substring(0, 150);
  
  // FofoStudio brand style
  const brandStyle = 'FofoStudio brand style, premium dark aesthetic, orange accents (#ff7519), glassmorphism, high legibility, commercial professional look, modern tech vibe';
  
  // Format-specific guidance
  let formatGuidance = '';
  if (type === 'story') {
    formatGuidance = 'vertical story format, bold title at top, clear CTA at bottom, mobile-optimized';
  } else {
    formatGuidance = 'square feed post, clear hierarchy, product/service focus, call-to-action visible';
  }
  
  // Combine
  return `${brandStyle}, ${formatGuidance}. Main message: "${mainMessage}". Clear text, high contrast, marketing-ready, professional composition.`;
}

async function getOrCreateFolder(drive, folderName, parentId) {
  // Search for existing folder
  const searchResponse = await drive.files.list({
    q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)'
  });

  if (searchResponse.data.files && searchResponse.data.files.length > 0) {
    return searchResponse.data.files[0].id;
  }

  // Create folder
  const createResponse = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    },
    fields: 'id'
  });

  return createResponse.data.id;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
