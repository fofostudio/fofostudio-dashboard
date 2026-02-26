const fetch = require('node-fetch');

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
    const data = JSON.parse(event.body || '{}');
    const { description, hashtags, image_url, platform, type } = data;

    if (!description) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing description' })
      };
    }

    const accessToken = process.env.META_ACCESS_TOKEN;
    const adAccountId = process.env.META_AD_ACCOUNT_ID;

    if (!accessToken) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Meta access token not configured' })
      };
    }

    // Get page ID from ad account
    const accountUrl = `https://graph.facebook.com/v18.0/${adAccountId}?fields=account_id&access_token=${accessToken}`;
    const accountResponse = await fetch(accountUrl);
    const accountData = await accountResponse.json();

    // For now, use a hardcoded page ID (you should get this from env or config)
    // This is FofoStudio's page ID - replace with actual value
    const pageId = process.env.META_PAGE_ID || '107313642310633';

    // Prepare message
    const fullMessage = hashtags 
      ? `${description}\n\n${hashtags}`
      : description;

    const results = [];

    // Publish to Facebook if needed
    if (platform === 'both' || platform === 'facebook') {
      const fbResult = await publishToFacebook(pageId, accessToken, fullMessage, image_url, type);
      results.push({ platform: 'facebook', ...fbResult });
    }

    // Publish to Instagram if needed
    if (platform === 'both' || platform === 'instagram') {
      const igResult = await publishToInstagram(pageId, accessToken, fullMessage, image_url, type);
      results.push({ platform: 'instagram', ...igResult });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Publicado en ${platform}`,
        results: results
      })
    };

  } catch (error) {
    console.error('Publish error:', error);
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

async function publishToFacebook(pageId, accessToken, message, imageUrl, type) {
  try {
    let endpoint = `https://graph.facebook.com/v18.0/${pageId}`;
    const params = new URLSearchParams({
      access_token: accessToken,
      message: message
    });

    // Add image if provided
    if (imageUrl) {
      params.append('url', imageUrl);
      endpoint += '/photos';
    } else {
      endpoint += '/feed';
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      body: params
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Facebook API error');
    }

    return {
      success: true,
      post_id: result.id || result.post_id,
      message: 'Publicado en Facebook'
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function publishToInstagram(pageId, accessToken, message, imageUrl, type) {
  try {
    // First, get Instagram Business Account ID
    const igAccountUrl = `https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`;
    const igAccountResponse = await fetch(igAccountUrl);
    const igAccountData = await igAccountResponse.json();

    const igUserId = igAccountData.instagram_business_account?.id;

    if (!igUserId) {
      throw new Error('No Instagram Business Account linked to this page');
    }

    // For stories
    if (type === 'story') {
      if (!imageUrl) {
        throw new Error('Stories require an image URL');
      }

      // Create story media container
      const containerParams = new URLSearchParams({
        access_token: accessToken,
        image_url: imageUrl,
        media_type: 'STORIES'
      });

      const containerResponse = await fetch(
        `https://graph.facebook.com/v18.0/${igUserId}/media`,
        {
          method: 'POST',
          body: containerParams
        }
      );

      const containerData = await containerResponse.json();

      if (!containerResponse.ok) {
        throw new Error(containerData.error?.message || 'Failed to create story container');
      }

      // Publish story
      const publishParams = new URLSearchParams({
        access_token: accessToken,
        creation_id: containerData.id
      });

      const publishResponse = await fetch(
        `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
        {
          method: 'POST',
          body: publishParams
        }
      );

      const publishData = await publishResponse.json();

      if (!publishResponse.ok) {
        throw new Error(publishData.error?.message || 'Failed to publish story');
      }

      return {
        success: true,
        post_id: publishData.id,
        message: 'Story publicada en Instagram'
      };

    } else {
      // For feed posts
      if (!imageUrl) {
        throw new Error('Instagram feed posts require an image URL');
      }

      // Create media container
      const containerParams = new URLSearchParams({
        access_token: accessToken,
        image_url: imageUrl,
        caption: message
      });

      const containerResponse = await fetch(
        `https://graph.facebook.com/v18.0/${igUserId}/media`,
        {
          method: 'POST',
          body: containerParams
        }
      );

      const containerData = await containerResponse.json();

      if (!containerResponse.ok) {
        throw new Error(containerData.error?.message || 'Failed to create media container');
      }

      // Publish media
      const publishParams = new URLSearchParams({
        access_token: accessToken,
        creation_id: containerData.id
      });

      const publishResponse = await fetch(
        `https://graph.facebook.com/v18.0/${igUserId}/media_publish`,
        {
          method: 'POST',
          body: publishParams
        }
      );

      const publishData = await publishResponse.json();

      if (!publishResponse.ok) {
        throw new Error(publishData.error?.message || 'Failed to publish media');
      }

      return {
        success: true,
        post_id: publishData.id,
        message: 'Publicado en Instagram'
      };
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
