export const mockPensionPlans = [
  {
    id: "1",
    company_name: "TechCorp Solutions",
    plan_type: "401(k)",
    description: "Comprehensive retirement plan for tech employees with matching contributions up to 6%",
    tags: "tech, matching, retirement, 401k",
    created_at: "2023-01-15T10:00:00Z",
    updated_at: "2023-12-01T15:30:00Z",
    total_participants: 1250,
    total_assets: 25000000,
    avg_contribution_rate: 7.5,
    documents: [
      {
        id: "doc1",
        filename: "TechCorp_401k_Summary.pdf",
        content: "This document outlines the TechCorp 401(k) plan details including matching contributions, vesting schedule, and investment options.",
        created_at: "2023-01-15T10:00:00Z",
        updated_at: "2023-01-15T10:00:00Z"
      },
      {
        id: "doc2",
        filename: "Investment_Options_2023.pdf",
        content: "Comprehensive guide to available investment options including mutual funds, target date funds, and ETFs.",
        created_at: "2023-06-20T14:20:00Z",
        updated_at: "2023-06-20T14:20:00Z"
      }
    ]
  },
  {
    id: "2",
    company_name: "Healthcare Plus",
    plan_type: "Pension",
    description: "Traditional pension plan for healthcare workers with defined benefits based on years of service",
    tags: "healthcare, pension, defined-benefit",
    created_at: "2023-02-10T09:15:00Z",
    updated_at: "2023-11-28T16:45:00Z",
    total_participants: 3500,
    total_assets: 75000000,
    avg_contribution_rate: 8.2,
    documents: [
      {
        id: "doc3",
        filename: "Pension_Benefits_Guide.pdf",
        content: "Detailed explanation of pension benefits calculation, retirement age requirements, and survivor benefits.",
        created_at: "2023-02-10T09:15:00Z",
        updated_at: "2023-02-10T09:15:00Z"
      }
    ]
  },
  {
    id: "3",
    company_name: "EduFirst Institute",
    plan_type: "403(b)",
    description: "Tax-advantaged retirement plan for education professionals with multiple investment options",
    tags: "education, non-profit, retirement, 403b",
    created_at: "2023-03-20T11:30:00Z",
    updated_at: "2023-12-05T13:20:00Z",
    total_participants: 850,
    total_assets: 15000000,
    avg_contribution_rate: 6.8,
    documents: [
      {
        id: "doc4",
        filename: "403b_Plan_Overview.pdf",
        content: "Overview of the 403(b) plan features, eligibility requirements, and contribution limits for education staff.",
        created_at: "2023-03-20T11:30:00Z",
        updated_at: "2023-03-20T11:30:00Z"
      },
      {
        id: "doc5",
        filename: "Retirement_Planning_Guide.pdf",
        content: "Comprehensive retirement planning guide for educators including investment strategies and tax considerations.",
        created_at: "2023-08-15T10:45:00Z",
        updated_at: "2023-08-15T10:45:00Z"
      }
    ]
  },
  {
    id: "4",
    company_name: "Manufacturing Pro",
    plan_type: "401(k)",
    description: "Flexible retirement plan for manufacturing employees with profit sharing component",
    tags: "manufacturing, profit-sharing, retirement, 401k",
    created_at: "2023-04-05T14:20:00Z",
    updated_at: "2023-12-10T09:15:00Z",
    total_participants: 2100,
    total_assets: 45000000,
    avg_contribution_rate: 7.1,
    documents: [
      {
        id: "doc6",
        filename: "Profit_Sharing_Details.pdf",
        content: "Detailed breakdown of the profit sharing component and how it integrates with the 401(k) plan.",
        created_at: "2023-04-05T14:20:00Z",
        updated_at: "2023-04-05T14:20:00Z"
      }
    ]
  },
  {
    id: "5",
    company_name: "GreenEnergy Solutions",
    plan_type: "401(k)",
    description: "Sustainable investment focused retirement plan with ESG options",
    tags: "green-energy, ESG, sustainability, 401k",
    created_at: "2023-05-12T10:45:00Z",
    updated_at: "2023-12-15T11:30:00Z",
    total_participants: 750,
    total_assets: 18000000,
    avg_contribution_rate: 8.5,
    documents: [
      {
        id: "doc7",
        filename: "ESG_Investment_Options.pdf",
        content: "Overview of environmentally and socially responsible investment options available in the plan.",
        created_at: "2023-05-12T10:45:00Z",
        updated_at: "2023-05-12T10:45:00Z"
      }
    ]
  }
];

// Mock knowledge graph data
export const mockKnowledgeGraph = {
  nodes: [
    {
      id: '1',
      label: 'Pension Plans',
      size: 25,
      type: 'plan_type'
    },
    {
      id: '2',
      label: 'Defined Benefit',
      size: 20,
      type: 'plan_type'
    },
    {
      id: '3',
      label: 'Defined Contribution',
      size: 20,
      type: 'plan_type'
    },
    {
      id: '4',
      label: 'Manufacturing',
      size: 15,
      type: 'industry'
    },
    {
      id: '5',
      label: 'Technology',
      size: 15,
      type: 'industry'
    },
    {
      id: '6',
      label: 'Healthcare',
      size: 15,
      type: 'industry'
    },
    {
      id: '7',
      label: 'Vesting',
      size: 10,
      type: 'feature'
    },
    {
      id: '8',
      label: 'Contribution Matching',
      size: 10,
      type: 'feature'
    },
    {
      id: '9',
      label: 'Early Retirement',
      size: 10,
      type: 'feature'
    }
  ],
  edges: [
    {
      source: '1',
      target: '2',
      label: 'includes',
      weight: 2
    },
    {
      source: '1',
      target: '3',
      label: 'includes',
      weight: 2
    },
    {
      source: '2',
      target: '4',
      label: 'common in',
      weight: 1
    },
    {
      source: '3',
      target: '5',
      label: 'popular in',
      weight: 1
    },
    {
      source: '2',
      target: '6',
      label: 'found in',
      weight: 1
    },
    {
      source: '2',
      target: '9',
      label: 'offers',
      weight: 1
    },
    {
      source: '3',
      target: '7',
      label: 'requires',
      weight: 1
    },
    {
      source: '3',
      target: '8',
      label: 'features',
      weight: 1
    }
  ]
};

// Mock quick stats
export const mockQuickStats = {
  totalPlans: 5,
  totalParticipants: 8450,
  totalAssets: 178000000,
  avgContributionRate: 7.62,
  planTypeDistribution: {
    "401(k)": 3,
    "Pension": 1,
    "403(b)": 1
  },
  recentActivity: [
    {
      type: "document_upload",
      plan: "GreenEnergy Solutions",
      description: "ESG Investment Options guide uploaded",
      date: "2023-12-15T11:30:00Z"
    },
    {
      type: "plan_update",
      plan: "Manufacturing Pro",
      description: "Updated profit sharing terms",
      date: "2023-12-10T09:15:00Z"
    },
    {
      type: "document_upload",
      plan: "EduFirst Institute",
      description: "New retirement planning guide added",
      date: "2023-12-05T13:20:00Z"
    }
  ],
  topPerformingPlans: [
    {
      name: "GreenEnergy Solutions",
      contributionRate: 8.5,
      participation: "92%"
    },
    {
      name: "Healthcare Plus",
      contributionRate: 8.2,
      participation: "88%"
    },
    {
      name: "TechCorp Solutions",
      contributionRate: 7.5,
      participation: "85%"
    }
  ]
};

// Mock clients data
export const mockClients = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@techcorp.com",
    phone: "+1 (555) 123-4567",
    company: "TechCorp Solutions",
    status: "active" as const,
    created_at: "2023-01-15T10:00:00Z",
    updated_at: "2023-12-01T15:30:00Z",
    pension_plans: [1]
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.j@healthcare-plus.com",
    phone: "+1 (555) 234-5678",
    company: "Healthcare Plus",
    status: "active" as const,
    created_at: "2023-02-10T09:15:00Z",
    updated_at: "2023-11-28T16:45:00Z",
    pension_plans: [2]
  },
  {
    id: 3,
    name: "Michael Brown",
    email: "m.brown@edufirst.edu",
    phone: "+1 (555) 345-6789",
    company: "EduFirst Institute",
    status: "active" as const,
    created_at: "2023-03-20T11:30:00Z",
    updated_at: "2023-12-05T13:20:00Z",
    pension_plans: [3]
  },
  {
    id: 4,
    name: "Lisa Chen",
    email: "l.chen@manufacturing-pro.com",
    phone: "+1 (555) 456-7890",
    company: "Manufacturing Pro",
    status: "active" as const,
    created_at: "2023-04-05T14:20:00Z",
    updated_at: "2023-12-10T09:15:00Z",
    pension_plans: [4]
  },
  {
    id: 5,
    name: "David Green",
    email: "d.green@greenenergy.com",
    phone: "+1 (555) 567-8901",
    company: "GreenEnergy Solutions",
    status: "active" as const,
    created_at: "2023-05-12T10:45:00Z",
    updated_at: "2023-12-15T11:30:00Z",
    pension_plans: [5]
  }
];

// Mock chat data
export const mockChats: Record<number, Array<{
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}>> = {
  1: [
    {
      id: "chat1",
      role: "assistant",
      content: "Hello! How can I help you with your TechCorp Solutions pension plan today?",
      created_at: "2023-12-15T09:00:00Z"
    },
    {
      id: "chat2",
      role: "user",
      content: "Can you explain the matching contribution policy?",
      created_at: "2023-12-15T09:01:00Z"
    },
    {
      id: "chat3",
      role: "assistant",
      content: "TechCorp Solutions offers a 6% matching contribution on your 401(k) plan. This means if you contribute 6% of your salary, the company will match it 100%. The matching contributions vest over a 4-year period at 25% per year.",
      created_at: "2023-12-15T09:01:30Z"
    }
  ],
  2: [
    {
      id: "chat4",
      role: "assistant",
      content: "Welcome! How can I assist you with your Healthcare Plus pension plan?",
      created_at: "2023-12-14T14:00:00Z"
    },
    {
      id: "chat5",
      role: "user",
      content: "What are my retirement benefit options?",
      created_at: "2023-12-14T14:01:00Z"
    },
    {
      id: "chat6",
      role: "assistant",
      content: "Your Healthcare Plus pension plan offers a defined benefit based on your years of service and final average salary. You have options for single life annuity or joint and survivor benefits. The normal retirement age is 65, but you can start receiving reduced benefits as early as age 55.",
      created_at: "2023-12-14T14:01:30Z"
    }
  ],
  3: [
    {
      id: "chat7",
      role: "assistant",
      content: "Hi! How can I help you with your EduFirst Institute 403(b) plan?",
      created_at: "2023-12-13T11:00:00Z"
    },
    {
      id: "chat8",
      role: "user",
      content: "What investment options are available?",
      created_at: "2023-12-13T11:01:00Z"
    },
    {
      id: "chat9",
      role: "assistant",
      content: "Your 403(b) plan offers a diverse range of investment options including target date funds, mutual funds, and fixed income options. The plan includes low-cost index funds and actively managed funds across different asset classes.",
      created_at: "2023-12-13T11:01:30Z"
    }
  ]
}; 