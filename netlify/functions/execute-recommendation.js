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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { recommendation_id } = JSON.parse(event.body || '{}');

    if (!recommendation_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing recommendation_id' })
      };
    }

    const accessToken = process.env.META_ACCESS_TOKEN;
    const adAccountId = process.env.META_AD_ACCOUNT_ID;

    if (!accessToken || !adAccountId) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Meta credentials not configured' })
      };
    }

    let result = {};

    // Execute recommendation based on ID
    switch (recommendation_id) {
      case 'cleanup-paused':
        result = await archivePausedCampaigns(adAccountId, accessToken);
        break;

      case 'low-budget':
        result = await suggestBudgetIncrease(adAccountId, accessToken);
        break;

      case 'low-ctr':
      case 'high-cpc':
        result = {
          success: true,
          message: 'Esta recomendación requiere revisión manual. Abre Meta Ads Manager para optimizar tus anuncios.'
        };
        break;

      case 'general-checkup':
        result = {
          success: true,
          message: 'Recordatorio configurado. Revisa tus campañas mensualmente para mejores resultados.'
        };
        break;

      default:
        result = {
          success: false,
          message: 'Recomendación no reconocida'
        };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Execute recommendation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function archivePausedCampaigns(adAccountId, accessToken) {
  try {
    // Get paused campaigns
    const campaignsUrl = `https://graph.facebook.com/v18.0/${adAccountId}/campaigns?fields=id,name,status&access_token=${accessToken}`;
    const response = await fetch(campaignsUrl);
    const data = await response.json();

    const pausedCampaigns = (data.data || []).filter(c => c.status === 'PAUSED');

    if (pausedCampaigns.length === 0) {
      return {
        success: true,
        message: 'No hay campañas pausadas para archivar'
      };
    }

    // Archive each paused campaign
    const archived = [];
    for (const campaign of pausedCampaigns) {
      try {
        const archiveUrl = `https://graph.facebook.com/v18.0/${campaign.id}`;
        const archiveResponse = await fetch(archiveUrl, {
          method: 'POST',
          body: new URLSearchParams({
            access_token: accessToken,
            status: 'ARCHIVED'
          })
        });

        if (archiveResponse.ok) {
          archived.push(campaign.name);
        }
      } catch (err) {
        console.error(`Error archiving campaign ${campaign.id}:`, err);
      }
    }

    return {
      success: true,
      message: `${archived.length} campañas archivadas: ${archived.join(', ')}`
    };

  } catch (error) {
    return {
      success: false,
      message: 'Error al archivar campañas: ' + error.message
    };
  }
}

async function suggestBudgetIncrease(adAccountId, accessToken) {
  return {
    success: true,
    message: 'Para ajustar presupuestos, ve a Meta Ads Manager → Campaigns → Edit Budget. Recomendamos mínimo $50k COP/día para resultados óptimos.'
  };
}
