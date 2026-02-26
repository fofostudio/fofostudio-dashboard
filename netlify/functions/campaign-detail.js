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
    const campaignId = event.queryStringParameters?.campaign_id;

    if (!campaignId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing campaign_id' })
      };
    }

    const accessToken = process.env.META_ACCESS_TOKEN;

    if (!accessToken) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Meta access token not configured' })
      };
    }

    // Get campaign details with insights
    const campaignUrl = `https://graph.facebook.com/v18.0/${campaignId}?fields=name,objective,status,spend,daily_budget,lifetime_budget&access_token=${accessToken}`;
    const campaignResponse = await fetch(campaignUrl);
    const campaignData = await campaignResponse.json();

    // Get campaign insights
    const insightsUrl = `https://graph.facebook.com/v18.0/${campaignId}/insights?fields=spend,impressions,clicks,ctr,cpc,cpm&access_token=${accessToken}`;
    const insightsResponse = await fetch(insightsUrl);
    const insightsData = await insightsResponse.json();

    const insights = insightsData.data?.[0] || {};

    const campaign = {
      id: campaignData.id,
      name: campaignData.name,
      objective: campaignData.objective,
      status: campaignData.status,
      spend: parseFloat(insights.spend || 0),
      impressions: parseInt(insights.impressions || 0),
      clicks: parseInt(insights.clicks || 0),
      ctr: parseFloat(insights.ctr || 0),
      cpc: parseFloat(insights.cpc || 0),
      cpm: parseFloat(insights.cpm || 0)
    };

    // Get ads for this campaign
    const adsUrl = `https://graph.facebook.com/v18.0/${campaignId}/ads?fields=id,name,status,creative{title,body,image_url,thumbnail_url,object_story_spec},insights{spend,clicks,impressions,ctr,cpc}&access_token=${accessToken}`;
    const adsResponse = await fetch(adsUrl);
    const adsData = await adsResponse.json();

    const ads = (adsData.data || []).map(ad => {
      const adInsights = ad.insights?.data?.[0] || {};
      
      return {
        id: ad.id,
        name: ad.name,
        status: ad.status,
        creative: {
          title: ad.creative?.title || ad.creative?.object_story_spec?.video_data?.title || '',
          body: ad.creative?.body || ad.creative?.object_story_spec?.video_data?.message || '',
          image_url: ad.creative?.image_url || ad.creative?.thumbnail_url || ''
        },
        spend: parseFloat(adInsights.spend || 0),
        clicks: parseInt(adInsights.clicks || 0),
        impressions: parseInt(adInsights.impressions || 0),
        ctr: parseFloat(adInsights.ctr || 0),
        cpc: parseFloat(adInsights.cpc || 0)
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        campaign: campaign,
        ads: ads,
        ads_count: ads.length
      })
    };

  } catch (error) {
    console.error('Campaign detail error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
