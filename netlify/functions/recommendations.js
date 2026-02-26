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
    const accessToken = process.env.META_ACCESS_TOKEN;
    const adAccountId = process.env.META_AD_ACCOUNT_ID;

    if (!accessToken || !adAccountId) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ recommendations: [] })
      };
    }

    // Get campaigns data
    const campaignsUrl = `https://graph.facebook.com/v18.0/${adAccountId}/campaigns?fields=id,name,status,daily_budget,lifetime_budget,objective&access_token=${accessToken}`;
    const campaignsResponse = await fetch(campaignsUrl);
    const campaignsData = await campaignsResponse.json();

    const campaigns = campaignsData.data || [];

    // Get insights for active campaigns
    const activeCount = campaigns.filter(c => c.status === 'ACTIVE').length;
    const pausedCount = campaigns.filter(c => c.status === 'PAUSED').length;

    const recommendations = [];

    // Recommendation: Too many paused campaigns
    if (pausedCount > 3) {
      recommendations.push({
        id: 'cleanup-paused',
        icon: '🧹',
        priority: 'medium',
        title: 'Limpieza de campañas pausadas',
        description: `Tienes ${pausedCount} campañas pausadas. Considera archivar las que ya no usarás para mantener el dashboard limpio.`,
        action: 'archive_paused_campaigns'
      });
    }

    // Recommendation: No active campaigns
    if (activeCount === 0) {
      recommendations.push({
        id: 'no-active',
        icon: '⚠️',
        priority: 'high',
        title: 'Sin campañas activas',
        description: 'No tienes ninguna campaña activa en este momento. Considera activar una campaña para generar resultados.',
        action: 'prompt_activate_campaign'
      });
    }

    // Recommendation: Budget optimization
    const lowBudgetCampaigns = campaigns.filter(c => 
      c.status === 'ACTIVE' && 
      c.daily_budget && 
      parseInt(c.daily_budget) < 50000 // Less than 50k COP per day
    );

    if (lowBudgetCampaigns.length > 0) {
      recommendations.push({
        id: 'low-budget',
        icon: '💰',
        priority: 'medium',
        title: 'Presupuesto bajo detectado',
        description: `${lowBudgetCampaigns.length} campañas tienen presupuesto diario menor a $50k COP. Considera aumentarlo para mayor alcance.`,
        action: 'increase_budget',
        data: { campaigns: lowBudgetCampaigns.map(c => c.id) }
      });
    }

    // Get detailed insights for performance recommendations
    try {
      const insightsUrl = `https://graph.facebook.com/v18.0/${adAccountId}/insights?time_range={"since":"7 days ago","until":"today"}&fields=ctr,cpc,cpm,spend,impressions&access_token=${accessToken}`;
      const insightsResponse = await fetch(insightsUrl);
      const insightsData = await insightsResponse.json();

      if (insightsData.data && insightsData.data.length > 0) {
        const insights = insightsData.data[0];
        const ctr = parseFloat(insights.ctr || 0);
        const cpc = parseFloat(insights.cpc || 0);

        // Low CTR warning
        if (ctr < 0.5) {
          recommendations.push({
            id: 'low-ctr',
            icon: '📉',
            priority: 'high',
            title: 'CTR bajo (< 0.5%)',
            description: 'Tu CTR promedio es muy bajo. Mejora tus creativos, copy o segmentación de audiencia.',
            action: 'review_creatives'
          });
        }

        // High CPC warning
        if (cpc > 500) {
          recommendations.push({
            id: 'high-cpc',
            icon: '💸',
            priority: 'medium',
            title: 'CPC alto (> $500 COP)',
            description: 'Tu costo por clic está elevado. Revisa la relevancia de tus anuncios y optimiza tu segmentación.',
            action: 'optimize_targeting'
          });
        }
      }
    } catch (insightsError) {
      console.error('Error fetching insights:', insightsError);
    }

    // Add general recommendation
    recommendations.push({
      id: 'general-checkup',
      icon: '🔍',
      priority: 'low',
      title: 'Auditoría mensual recomendada',
      description: 'Revisa tus campañas mensualmente para optimizar rendimiento y detectar oportunidades.',
      action: 'schedule_audit'
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        recommendations: recommendations,
        generated_at: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Recommendations error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        recommendations: [],
        error: error.message 
      })
    };
  }
};
