const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const metaToken = process.env.META_ACCESS_TOKEN;
    const adAccountId = process.env.META_AD_ACCOUNT_ID;

    if (!metaToken || !adAccountId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Meta credentials not configured' })
      };
    }

    // Get campaigns
    const url = `https://graph.facebook.com/v21.0/${adAccountId}/campaigns`;
    const params = new URLSearchParams({
      access_token: metaToken,
      fields: 'id,status'
    });

    const response = await fetch(`${url}?${params}`);
    const campaigns = await response.json();

    let pausedCount = 0;

    for (const campaign of campaigns.data || []) {
      if (campaign.status === 'ACTIVE') {
        const pauseUrl = `https://graph.facebook.com/v21.0/${campaign.id}`;
        const pauseParams = new URLSearchParams({
          access_token: metaToken,
          status: 'PAUSED'
        });

        await fetch(pauseUrl, {
          method: 'POST',
          body: pauseParams
        });

        pausedCount++;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ paused: pausedCount })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
