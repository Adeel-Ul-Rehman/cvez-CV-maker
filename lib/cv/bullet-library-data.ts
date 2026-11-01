export interface PrewrittenBullet {
  category: string;
  text: string;
  impactType: string;
}

export interface RoleBulletGroup {
  role: string;
  aliases: string[];
  bullets: PrewrittenBullet[];
}

export const PREWRITTEN_BULLETS_BY_ROLE: RoleBulletGroup[] = [
  {
    role: 'Software Engineer',
    aliases: ['developer', 'full stack', 'backend', 'frontend', 'web developer', 'programmer', 'software developer'],
    bullets: [
      {
        category: 'Architecture & System Design',
        text: 'Architected and deployed high-throughput microservices using [Node.js/Go/Python], reducing API response latency by [35%] for [500K+] monthly active users.',
        impactType: 'Performance',
      },
      {
        category: 'Frontend & UI/UX',
        text: 'Engineered responsive web applications utilizing [React/Next.js/TypeScript], improving First Contentful Paint (FCP) by [40%] and boosting mobile conversion by [18%].',
        impactType: 'Conversion',
      },
      {
        category: 'Database & Cloud',
        text: 'Optimized PostgreSQL and MongoDB database queries and indexing strategies, decreasing query execution times by [50%] and reducing AWS RDS costs by [$15K/year].',
        impactType: 'Cost Reduction',
      },
      {
        category: 'DevOps & CI/CD',
        text: 'Spearheaded automated CI/CD deployment pipelines using GitHub Actions and Docker, reducing release cycle time from [3 days] to [under 20 minutes].',
        impactType: 'Efficiency',
      },
      {
        category: 'Leadership & Code Quality',
        text: 'Conducted rigorous code reviews and mentored [4 junior engineers], driving unit test coverage from [45%] to [88%] across mission-critical codebases.',
        impactType: 'Mentorship',
      },
      {
        category: 'API & Integrations',
        text: 'Designed and documented RESTful and GraphQL APIs integrated by [15+] third-party enterprise partners with 99.99% uptime compliance.',
        impactType: 'Reliability',
      },
    ],
  },
  {
    role: 'Project / Product Manager',
    aliases: ['product manager', 'project manager', 'program manager', 'scrum master', 'agile coach'],
    bullets: [
      {
        category: 'Product Roadmap & Strategy',
        text: 'Defined product roadmap and cross-functional feature backlog for [3 flagship products], delivering MVP to market [2 weeks] ahead of schedule.',
        impactType: 'Strategy',
      },
      {
        category: 'Agile & Execution',
        text: 'Facilitated Agile ceremonies (sprint planning, daily standups, retrospectives) for a team of [12 engineers and designers], increasing sprint velocity by [28%].',
        impactType: 'Productivity',
      },
      {
        category: 'User Growth & Metrics',
        text: 'Analyzed user funnel telemetry and customer feedback to iterate on onboarding flow, driving 30-day user retention up by [22%].',
        impactType: 'Growth',
      },
      {
        category: 'Stakeholder Alignment',
        text: 'Communicated project milestones, risk mitigations, and KPIs directly to C-suite executives, ensuring 100% transparent alignment on budget and scope.',
        impactType: 'Communication',
      },
      {
        category: 'Cost & Budgeting',
        text: 'Managed vendor contracts and cloud infrastructure budgets totaling [$250K+], identifying redundancies and achieving [15%] annual cost savings.',
        impactType: 'Cost Reduction',
      },
    ],
  },
  {
    role: 'Data Analyst / Scientist',
    aliases: ['data analyst', 'data scientist', 'bi analyst', 'business analyst', 'analytics'],
    bullets: [
      {
        category: 'BI & Reporting',
        text: 'Built automated executive Tableau and PowerBI dashboards tracking [15+ KPIs], saving the leadership team [10+ hours] per week in manual reporting.',
        impactType: 'Automation',
      },
      {
        category: 'Predictive Modeling',
        text: 'Trained and evaluated machine learning predictive models using [Python/Scikit-Learn], achieving [89%] accuracy in identifying customer churn risks.',
        impactType: 'Retention',
      },
      {
        category: 'SQL & Data Pipelines',
        text: 'Constructed ETL pipelines in dbt and Snowflake processing [10M+] daily events, ensuring clean data governance and sub-second query performance.',
        impactType: 'Data Engineering',
      },
      {
        category: 'A/B Testing',
        text: 'Designed and analyzed statistical A/B tests across checkout funnels, leading to data-driven UX recommendations that generated [$120K] in incremental ARR.',
        impactType: 'Revenue',
      },
    ],
  },
  {
    role: 'UI/UX & Graphic Designer',
    aliases: ['designer', 'ui/ux', 'product designer', 'graphic designer', 'visual designer'],
    bullets: [
      {
        category: 'Design Systems',
        text: 'Created and maintained a modular Figma design system with [100+ components], speeding up product development velocity by [35%].',
        impactType: 'Efficiency',
      },
      {
        category: 'User Research & Prototyping',
        text: 'Conducted [20+] qualitative user interviews and usability tests, translating critical customer friction points into intuitive, high-fidelity prototypes.',
        impactType: 'User Experience',
      },
      {
        category: 'Conversion Optimization',
        text: 'Redesigned core mobile checkout and signup workflows, decreasing cart abandonment rate from [42%] down to [24%].',
        impactType: 'Conversion',
      },
      {
        category: 'Brand & Marketing Design',
        text: 'Produced multi-channel digital marketing assets and ad creatives resulting in a [45%] increase in campaign click-through rates (CTR).',
        impactType: 'Engagement',
      },
    ],
  },
  {
    role: 'Sales & Business Development',
    aliases: ['sales', 'account executive', 'business development', 'bdr', 'sdr', 'sales manager'],
    bullets: [
      {
        category: 'Quota & Revenue',
        text: 'Consistently exceeded quarterly revenue quotas, finishing at [135%] of target and closing [$1.2M] in new Annual Recurring Revenue (ARR).',
        impactType: 'Revenue',
      },
      {
        category: 'Pipeline & Outbound',
        text: 'Generated [120+] qualified enterprise pipeline leads through personalized cold outreach, social selling on LinkedIn, and conference networking.',
        impactType: 'Lead Generation',
      },
      {
        category: 'Client Retention & Expansion',
        text: 'Managed [40+] strategic enterprise accounts, maintaining a [96%] customer renewal rate and executing [$300K] in contract upsells.',
        impactType: 'Retention',
      },
      {
        category: 'CRM & Negotiation',
        text: 'Utilized Salesforce/HubSpot to manage full sales cycles from discovery to contract negotiation with VP and C-level decision makers.',
        impactType: 'Negotiation',
      },
    ],
  },
  {
    role: 'Marketing Specialist / Growth',
    aliases: ['marketing', 'digital marketer', 'growth marketer', 'seo specialist', 'content marketer', 'social media'],
    bullets: [
      {
        category: 'SEO & Organic Growth',
        text: 'Devised and executed high-impact SEO content strategy, growing organic website traffic by [140%] and securing Page 1 Google rankings for [25+] high-intent keywords.',
        impactType: 'Traffic',
      },
      {
        category: 'Paid Acquisition & PPC',
        text: 'Managed monthly ad budget of [$30K+] across Google Ads and Meta Ads, lowering Customer Acquisition Cost (CAC) by [28%] while scaling conversions.',
        impactType: 'CAC Reduction',
      },
      {
        category: 'Email Marketing & CRM',
        text: 'Orchestrated automated drip email marketing sequences reaching [80K+] subscribers, driving an average open rate of [34%] and click rate of [4.8%].',
        impactType: 'Engagement',
      },
      {
        category: 'Campaign Analytics',
        text: 'Tracked attribution across multi-touch marketing funnels using Google Analytics 4, delivering actionable weekly ROAS insights to leadership.',
        impactType: 'Analytics',
      },
    ],
  },
  {
    role: 'Customer Support & Success',
    aliases: ['customer support', 'customer service', 'client success', 'support specialist', 'helpdesk'],
    bullets: [
      {
        category: 'Customer Satisfaction (CSAT)',
        text: 'Maintained a [98.5%] Customer Satisfaction (CSAT) rating while resolving [60+] technical and billing tickets daily via Zendesk and Intercom.',
        impactType: 'CSAT',
      },
      {
        category: 'Response Times',
        text: 'Reduced First Response Time (FRT) from [4 hours] to [under 25 minutes] by implementing triage macros and standardized help documentation.',
        impactType: 'Speed',
      },
      {
        category: 'Knowledge Base & Self-Service',
        text: 'Authored [45+] help center articles and video walkthroughs, deflecting [22%] of incoming support inquiries to self-service resolution.',
        impactType: 'Deflection',
      },
      {
        category: 'Escalation & Advocacy',
        text: 'Collaborated directly with engineering and product teams to reproduce and triage critical bugs, expediting customer bug fixes by [30%].',
        impactType: 'Collaboration',
      },
    ],
  },
  {
    role: 'Human Resources & Recruiter',
    aliases: ['hr', 'human resources', 'recruiter', 'talent acquisition', 'people operations'],
    bullets: [
      {
        category: 'Full-Cycle Recruiting',
        text: 'Sourced, interviewed, and closed [35+] high-caliber engineering and sales hires in a high-growth environment within aggressive deadlines.',
        impactType: 'Hiring',
      },
      {
        category: 'Time to Hire',
        text: 'Streamlined interview scheduling and ATS pipelines, reducing average Time-to-Hire from [52 days] to [31 days] without compromising candidate quality.',
        impactType: 'Efficiency',
      },
      {
        category: 'Onboarding & Retention',
        text: 'Revamped the company-wide remote onboarding program, elevating 90-day new hire retention to [94%] and receiving a [4.9/5] satisfaction score.',
        impactType: 'Retention',
      },
      {
        category: 'Culture & Compliance',
        text: 'Administered employee benefit packages, compliance audits, and quarterly team engagement initiatives, increasing Employee Net Promoter Score (eNPS) by [18 points].',
        impactType: 'Culture',
      },
    ],
  },
  {
    role: 'Accountant & Finance',
    aliases: ['accountant', 'finance', 'financial analyst', 'bookkeeper', 'auditor'],
    bullets: [
      {
        category: 'Financial Reporting',
        text: 'Prepared monthly, quarterly, and annual financial statements in compliance with GAAP/IFRS standards, reducing month-end close time by [3 days].',
        impactType: 'Accuracy',
      },
      {
        category: 'Budgeting & Forecasting',
        text: 'Assisted in building annual departmental operating budgets of [$5M+], identifying cost variances and delivering quarterly forecast models.',
        impactType: 'Forecasting',
      },
      {
        category: 'Audit & Compliance',
        text: 'Spearheaded internal and external tax audit preparations with zero major audit deficiencies and 100% regulatory filing compliance.',
        impactType: 'Compliance',
      },
      {
        category: 'Accounts Reconciliation',
        text: 'Automated bank reconciliations and expense processing using QuickBooks/Xero, eliminating manual data entry for [500+] monthly transactions.',
        impactType: 'Automation',
      },
    ],
  },
  {
    role: 'General Professional & Operations',
    aliases: ['operations', 'manager', 'coordinator', 'associate', 'consultant'],
    bullets: [
      {
        category: 'Process Optimization',
        text: 'Analyzed departmental workflows and eliminated operational bottlenecks, increasing team throughput by [25%] and eliminating [15 hours] of weekly manual work.',
        impactType: 'Productivity',
      },
      {
        category: 'Team Leadership',
        text: 'Supervised and coached a cross-functional team of [8 team members], conducting performance reviews and fostering high-engagement team culture.',
        impactType: 'Leadership',
      },
      {
        category: 'Vendor & Resource Management',
        text: 'Negotiated favorable supplier and service agreements, reducing recurring operational procurement expenses by [12%].',
        impactType: 'Savings',
      },
      {
        category: 'Project Execution',
        text: 'Managed end-to-end execution of [5+] high-priority corporate initiatives on time and [8%] under approved budget.',
        impactType: 'Delivery',
      },
    ],
  },
];

/**
 * Searches the pre-written bullet points for a matching role.
 */
export function findPrewrittenBulletsForRole(queryRole: string): PrewrittenBullet[] {
  if (!queryRole) return PREWRITTEN_BULLETS_BY_ROLE[0].bullets;
  const lower = queryRole.toLowerCase();

  const match = PREWRITTEN_BULLETS_BY_ROLE.find((item) => {
    if (item.role.toLowerCase().includes(lower) || lower.includes(item.role.toLowerCase())) return true;
    return item.aliases.some((alias) => lower.includes(alias) || alias.includes(lower));
  });

  return match ? match.bullets : PREWRITTEN_BULLETS_BY_ROLE[PREWRITTEN_BULLETS_BY_ROLE.length - 1].bullets;
}

