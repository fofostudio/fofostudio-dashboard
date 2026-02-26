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
    const authHeader = event.headers.authorization || event.headers.Authorization;
    const googleAccessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    const health = {
      meta: await checkMetaHealth(),
      google_oauth: await checkGoogleOAuth(googleAccessToken),
      google_sheets: await checkGoogleSheets(googleAccessToken),
      google_drive: await checkGoogleDrive(googleAccessToken),
      config: getConfigStatus()
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(health)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function checkMetaHealth() {
  const metaToken = process.env.META_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;

  if (!metaToken || !adAccountId) {
    return {
      status: 'not_configured',
      message: 'Meta credentials not configured',
      configured: false
    };
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${adAccountId}`;
    const params = new URLSearchParams({
      access_token: metaToken,
      fields: 'name,account_status'
    });

    const response = await fetch(`${url}?${params}`);
    if (response.ok) {
      const data = await response.json();
      return {
        status: 'connected',
        message: `Connected to ${data.name || 'Unknown'}`,
        configured: true,
        account_name: data.name,
        account_status: data.account_status
      };
    } else {
      const error = await response.json();
      return {
        status: 'error',
        message: error.error?.message || 'API error',
        configured: true
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
      configured: true
    };
  }
}

async function checkGoogleOAuth(accessToken) {
  if (!accessToken) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return {
        status: 'not_configured',
        message: 'Google OAuth not configured',
        configured: false
      };
    }
    return {
      status: 'not_authenticated',
      message: 'OAuth configured but user not logged in',
      configured: true
    };
  }

  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (response.ok) {
      const userInfo = await response.json();
      return {
        status: 'connected',
        message: `Logged in as ${userInfo.email}`,
        configured: true,
        user_email: userInfo.email,
        user_name: userInfo.name
      };
    } else {
      return {
        status: 'error',
        message: 'Invalid or expired token',
        configured: true
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
      configured: true
    };
  }
}

async function checkGoogleSheets(accessToken) {
  if (!accessToken) {
    return {
      status: 'not_authenticated',
      message: 'Login with Google to access Sheets',
      configured: false
    };
  }

  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  if (!spreadsheetId) {
    return {
      status: 'warning',
      message: 'No spreadsheet ID configured (using mock data)',
      configured: false
    };
  }

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties(title)`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      const title = data.properties?.title || 'Unknown';
      return {
        status: 'connected',
        message: `Connected to: ${title}`,
        configured: true,
        spreadsheet_title: title
      };
    } else {
      return {
        status: 'error',
        message: 'Cannot access spreadsheet',
        configured: true
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
      configured: true
    };
  }
}

async function checkGoogleDrive(accessToken) {
  if (!accessToken) {
    return {
      status: 'not_authenticated',
      message: 'Login with Google to access Drive',
      configured: false
    };
  }

  try {
    const url = 'https://www.googleapis.com/drive/v3/about?fields=user,storageQuota';
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (response.ok) {
      const data = await response.json();
      const user = data.user || {};
      const quota = data.storageQuota || {};

      const usedGb = parseFloat(quota.usage || 0) / (1024**3);
      const limitGb = parseFloat(quota.limit || 0) / (1024**3);

      return {
        status: 'connected',
        message: `Connected as ${user.emailAddress}`,
        configured: true,
        storage_used_gb: Math.round(usedGb * 100) / 100,
        storage_limit_gb: Math.round(limitGb * 100) / 100
      };
    } else {
      return {
        status: 'error',
        message: 'Cannot access Drive',
        configured: true
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
      configured: true
    };
  }
}

function getConfigStatus() {
  return {
    meta: {
      access_token_set: !!process.env.META_ACCESS_TOKEN,
      ad_account_id: process.env.META_AD_ACCOUNT_ID || 'Not set'
    },
    google_oauth: {
      client_id_set: !!process.env.GOOGLE_CLIENT_ID,
      client_secret_set: !!process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'Not set'
    },
    google_sheets: {
      spreadsheet_id: process.env.GOOGLE_SPREADSHEET_ID || 'Not set'
    }
  };
}
