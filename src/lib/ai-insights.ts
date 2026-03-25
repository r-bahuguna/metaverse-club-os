/* ==========================================================================
   AI Insights Stub — Metaverse Club OS
   Ready for Genkit / Firebase AI Logic integration
   ========================================================================== */

export interface AiInsight {
    title: string;
    summary: string;
    recommendation: string;
    confidence: 'high' | 'medium' | 'low';
}

type ChartType =
    | 'revenue_trend'
    | 'expense_trend'
    | 'peak_hours'
    | 'event_roi'
    | 'tip_breakdown'
    | 'profit_loss'
    | 'crowd_dynamics';

/**
 * Get AI-generated insight for a specific chart.
 * Currently returns mock data — will be replaced with Genkit/Firebase AI Logic calls.
 */
export async function getInsight(chartType: ChartType): Promise<AiInsight> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 800));

    const insights: Record<ChartType, AiInsight> = {
        revenue_trend: {
            title: 'Revenue Momentum',
            summary: 'Revenue has grown 72% over the past 6 weeks, with the strongest acceleration in Feb W2. Club tips are the primary driver at 43% of total revenue, followed by DJ tips at 33%.',
            recommendation: 'Consider adding a second DJ set on peak nights (Thu–Sat) to capitalize on the tip growth trend. The data suggests guests tip more during genre transitions.',
            confidence: 'high',
        },
        expense_trend: {
            title: 'Cost Efficiency',
            summary: 'Total weekly expenses average L$3,450 with asset purchases being the largest category at 58%. Sploder and fishbowl costs are stable and predictable.',
            recommendation: 'Asset purchases are front-loaded investments. Consider amortizing them over 4 weeks in your mental model — the ROI on the dance floor particles is already showing in increased dwell times.',
            confidence: 'medium',
        },
        peak_hours: {
            title: 'Peak Traffic Windows',
            summary: 'The highest guest density occurs between 22:00–23:00 with 55–58 guests (92–97% capacity). Tips peak at 23:00 with L$7,200, strongly correlated with max occupancy.',
            recommendation: "You're approaching capacity limits at peak. Consider staggering event start times or adding a late-night session starting at 00:00 to distribute crowd flow and extend the revenue window.",
            confidence: 'high',
        },
        event_roi: {
            title: 'Event Performance',
            summary: 'Ladies Night delivers the best ROI at 16.8x despite lower absolute revenue than Weekend Rave. Neon Nights is the strongest balanced event (high revenue + good ROI).',
            recommendation: 'Weekend Rave has the lowest ROI due to higher production costs. Evaluate if the sploder payout can be reduced by 20% without impacting attendance — historical data suggests sploders drive initial attendance but not retention.',
            confidence: 'medium',
        },
        tip_breakdown: {
            title: 'Tip Distribution',
            summary: 'Club jars receive 38% of all tips, DJs 34%, and Hosts 28%. The DJ:Host ratio has been consistent, suggesting fair perception of contribution.',
            recommendation: 'The club jar share is healthy. If you want to boost host tips, consider placing host jars at the entrance and near social areas rather than alongside DJ jars.',
            confidence: 'high',
        },
        profit_loss: {
            title: 'Profitability',
            summary: 'Net profit margin is running at 93% — exceptionally high because DJ/Host tips go directly to staff (zero cost to you). Your only real costs are sploders, fishbowls, and asset purchases.',
            recommendation: 'This margin is sustainable. The main risk is staff retention — consider introducing a small "event bonus" (L$200–500) for consistent performers to lock in your top DJs and hosts.',
            confidence: 'high',
        },
        crowd_dynamics: {
            title: 'Crowd Behavior',
            summary: '83% of guests arrive between 20:00–22:00. Average dwell time is 42 minutes. New members (first-time visitors) stay 28% shorter than returning guests.',
            recommendation: 'New member retention is your growth lever. Consider a "welcome package" — a one-time tip to new members from the club sploder — to incentivize them to stay longer and return.',
            confidence: 'medium',
        },
    };

    return insights[chartType];
}
