const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const metaToken = process.env.META_ACCESS_TOKEN;
    const adAccountId = process.env.META_AD_ACCOUNT_ID;

    if (!metaToken || !adAccountId) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ campaigns: [] })
      };
    }

    // Get campaigns
    const url = `https://graph.facebook.com/v21.0/${adAccountId}/campaigns`;
    const params = new URLSearchParams({
      access_token: metaToken,
      fields: 'id,name,objective,status,daily_budget'
    });

    const response = await fetch(`${url}?${params}`);
    const campaignsData = await response.json();

    const campaignList = [];

    for (const campaign of campaignsData.data || []) {
      // Get insights for each campaign
      const insightsUrl = `https://graph.facebook.com/v21.0/${campaign.id}/insights`;
      const insightsParams = new URLSearchParams({
        access_token: metaToken,
        fields: 'spend,ctr'
      });

      const insightsResponse = await fetch(`${insightsUrl}?${insightsParams}`);
      const insights = await insightsResponse.json();
      const insightData = insights.data?.[0] || {};

      campaignList.push({
        id: campaign.id,
        name: campaign.name,
        objective: campaign.objective || 'N/A',
        status: campaign.status || 'PAUSED',
        spend: parseFloat(insightData.spend || 0),
        ctr: parseFloat(insightData.ctr || 0)
      });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ campaigns: campaignList })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
