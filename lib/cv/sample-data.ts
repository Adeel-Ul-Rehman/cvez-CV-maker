import type { CvData } from './schema';

/**
 * Returns tailored showcase sample data for any registered CV template.
 * - 'adeel-signature': Adeel Ul Rehman's real signature data from Adeel_Ul_Rehman_CV.docx.
 * - 'creative-profile': General creative candidate data with photo, hobbies, interests, and emerald accents.
 * - 'teal-minimalist': General operations/professional candidate data with timeline history and petrol blue accents.
 * - 'navy-executive-sidebar': General executive leader data with solid navy sidebar and career metrics.
 * - 'executive-modern-photo': General senior engineer data with photo and cobalt accents.
 * - default: Standard professional profile (for europass, jobhire-chronological, jobhire-creative).
 */
export function getSampleDataForTemplate(templateKey: string): CvData {
  // 1. Adeel Ul Rehman Signature Template (Real signature data)
  if (templateKey === 'adeel-signature') {
    return {
      basics: {
        fullName: 'ADEEL UL REHMAN',
        email: 'ajadeel229@gmail.com',
        phone: '0309 0005634',
        location: 'Lahore, Pakistan',
        website: 'https://hadibookstore.shop',
        linkedin: 'https://linkedin.com/in/adeel-ul-rehman-73a088294',
        summary:
          'Computer Science undergraduate at UET Lahore with hands-on experience across full-stack web development, AI/ML pipelines, mobile apps, and workflow automation. Built production web apps (hadibookstore.shop, thehungryhub.shop), automated marketing pipelines, and AI systems at Portsea Games. Seeking opportunities to build high-impact software.',
        photoUrl: '/adeel-profile.png',
      },
      sections: [
        {
          id: 'sec-skills',
          type: 'skills',
          title: 'TECHNICAL SKILLS',
          visible: true,
          items: [
            { name: 'Languages: JavaScript, TypeScript, Python, C++, C#' },
            { name: 'Web Development: React.js, Next.js, HTML5, CSS3, Tailwind CSS, Bootstrap' },
            { name: 'Mobile Development: Flutter (Intermediate)' },
            { name: 'AI / ML: Prompt Engineering, LLM Pipelines, Multi-Model Orchestration, ML Fundamentals' },
            { name: 'Databases & Tools: SQL, PostgreSQL, MongoDB, Firebase, Git, Vercel, Postman' },
            { name: 'Automation: Web Scraping, Email Automation & Deliverability (DNS/Warmup), Python Scripting' },
          ],
        },
        {
          id: 'sec-exp',
          type: 'experience',
          title: 'PROFESSIONAL EXPERIENCE',
          visible: true,
          items: [
            {
              company: 'Portsea Games',
              role: 'AI/ML Engineering Intern',
              location: 'Islamabad (On-site)',
              startDate: '2026-06',
              endDate: '2026-07',
              current: false,
              description:
                '• Built end-to-end pipelines for an AI-driven 3D Website Generator: engineered prompt-enhancement layers.\n• Developed prototype automation using pretrained UI-grounding model (UGround) to convert natural-language intents into browser actions.\n• Prototyped a 3D VR room-reconstruction tool generating navigable models from 2D images.',
            },
            {
              company: 'Independent Business Collaboration',
              role: 'Digital Marketing & Automation Specialist',
              location: 'Lahore, Pakistan',
              startDate: '2025-11',
              endDate: null,
              current: true,
              description:
                '• Partnered with a business associate to design and operate an automated email marketing system in Python.\n• Ran bulk personalized campaigns of 200–250 emails/day while managing DNS configuration and mailbox warmup.',
            },
            {
              company: 'Social Swirls',
              role: 'Frontend Developer Intern',
              location: 'Remote',
              startDate: '2024-07',
              endDate: '2024-09',
              current: false,
              description:
                '• Built responsive frontend websites using React.js, focusing on component structure, UI performance, and cross-browser styling.',
            },
            {
              company: 'Electronics Retail Firm',
              role: 'Data Operator',
              location: 'Lahore, Pakistan',
              startDate: '2024-01',
              endDate: '2024-08',
              current: false,
              description:
                '• Owned end-to-end data operations for product and customer database — handling product entries, stock updates, and invoice reconciliation.',
            },
          ],
        },
        {
          id: 'sec-proj',
          type: 'projects',
          title: 'KEY PROJECTS',
          visible: true,
          items: [
            {
              name: 'Handwritten Urdu Alphabet Recognition',
              url: 'https://github.com/Adeel-Ul-Rehman',
              startDate: '',
              endDate: '',
              description:
                'End-to-end ML system for handwritten Urdu alphabet recognition: data preprocessing, CNN model training, and performance evaluation.',
            },
            {
              name: 'Prep Mind – AI Study Assistant',
              url: '',
              startDate: '',
              endDate: '',
              description:
                'Cross-platform Flutter app integrating AI for automated student notes, interactive MCQs, answers, and study chat.',
            },
            {
              name: 'Hadi Book Store (hadibookstore.shop)',
              url: 'https://hadibookstore.shop',
              startDate: '',
              endDate: '',
              description:
                'Full-stack e-commerce platform, live in production, built end-to-end with inventory management, cart, and order processing.',
            },
            {
              name: 'The Hungry Hub (thehungryhub.shop)',
              url: 'https://thehungryhub.shop',
              startDate: '',
              endDate: '',
              description:
                'Restaurant management system deployed for a live restaurant in Rawalpindi with digital menu and table billing.',
            },
          ],
        },
        {
          id: 'sec-edu',
          type: 'education',
          title: 'EDUCATION',
          visible: true,
          items: [
            {
              institution: 'University of Engineering & Technology (UET), KSK Lahore',
              degree: 'Bachelor of Science in Computer Science',
              field: 'Computer Science',
              location: 'Lahore, Pakistan',
              startDate: '2023',
              endDate: '2027',
              current: true,
              description: null,
            },
            {
              institution: 'Govt. Islamia College, Civil Lines, Lahore',
              degree: 'Intermediate in Pre-Engineering',
              field: 'Pre-Engineering',
              location: 'Lahore, Pakistan',
              startDate: '2020',
              endDate: '2022',
              current: false,
              description: null,
            },
          ],
        },
      ],
    };
  }

  // 2. Creative Profile Two-Column (Generic showcase data)
  if (templateKey === 'creative-profile') {
    return {
      basics: {
        fullName: 'Oliver Vance',
        email: 'oliver.vance@example.com',
        phone: '+1 (555) 782-9410',
        location: 'Austin, TX, United States',
        website: 'https://olivervance.design',
        summary:
          'Passionate and proactive Creative Designer & Frontend Specialist. Dedicated to crafting intuitive, visually stunning digital products. Strong background in user interface design, brand identity, and modern web applications. Fast learner with exceptional team leadership and communication skills.',
        photoUrl: '/samples/creative-profile-photo.jpg',
      },
      sections: [
        {
          id: 'sec-edu',
          type: 'education',
          title: 'EDUCATION',
          visible: true,
          items: [
            {
              institution: 'Austin Institute of Technology & Art',
              degree: 'Bachelor of Design in Interactive Media',
              field: 'Digital Design',
              location: 'Austin, TX',
              startDate: '2019',
              endDate: '2023',
              current: false,
            },
            {
              institution: 'Westwood Academy',
              degree: 'High School Diploma in Arts & Computing',
              field: 'Arts & Computing',
              location: 'Austin, TX',
              startDate: '2017',
              endDate: '2019',
              current: false,
            },
          ],
        },
        {
          id: 'sec-exp',
          type: 'experience',
          title: 'EXPERIENCE',
          visible: true,
          items: [
            {
              company: 'PixelCraft Studios',
              role: 'UI/UX & Frontend Developer',
              location: 'Austin, TX',
              startDate: '2023-06',
              endDate: 'Present',
              current: true,
              description:
                '• Designed responsive user interfaces for 12+ SaaS client web applications.\n• Collaborated closely with product teams to build reusable React component systems.\n• Boosted client usability scores by 35% through iterative usability testing and design audits.',
            },
            {
              company: 'Creative Hive Agency',
              role: 'Junior Digital Designer',
              location: 'Dallas, TX',
              startDate: '2021-08',
              endDate: '2023-05',
              current: false,
              description:
                '• Produced creative assets, marketing landing pages, and interactive prototypes for consumer brands.\n• Maintained brand consistency across multi-channel campaigns and web platforms.',
            },
          ],
        },
        {
          id: 'sec-skills',
          type: 'skills',
          title: 'SKILLS',
          visible: true,
          items: [
            { name: 'UI/UX Prototyping', level: 'expert' },
            { name: 'React & Next.js', level: 'advanced' },
            { name: 'Figma & Design Systems', level: 'expert' },
            { name: 'HTML5 & Modern CSS', level: 'expert' },
            { name: 'Responsive Web Design', level: 'advanced' },
            { name: 'Team Collaboration', level: 'advanced' },
          ],
        },
        {
          id: 'sec-interests',
          type: 'interests',
          title: 'INTERESTS',
          visible: true,
          items: [
            { name: 'Generative AI Art' },
            { name: 'Typography & Motion Graphics' },
            { name: 'Mobile App Photography' },
            { name: 'Cycling & Badminton' },
          ],
        },
        {
          id: 'sec-strengths',
          type: 'strengths',
          title: 'STRENGTHS',
          visible: true,
          items: [
            { title: 'Quick Learner', description: 'Swiftly adopts new frontend frameworks and design tooling.' },
            { title: 'Visual Problem Solver', description: 'Translates complex user requirements into clean UI.' },
            { title: 'Cross-functional Communicator', description: 'Bridges design and engineering teams efficiently.' },
          ],
        },
        {
          id: 'sec-lang',
          type: 'languages',
          title: 'LANGUAGES',
          visible: true,
          items: [
            { name: 'English', proficiency: 'fluent' },
            { name: 'Spanish', proficiency: 'conversational' },
          ],
        },
      ],
    };
  }

  // 3. Teal Minimalist Professional (Generic showcase data)
  if (templateKey === 'teal-minimalist') {
    return {
      basics: {
        fullName: 'Daniel Morgan',
        email: 'daniel.morgan@example.co.uk',
        phone: '+44 7911 123456',
        location: 'Edinburgh, EH4 4AL, United Kingdom',
        website: 'https://danielmorgan.co.uk',
        summary:
          'Dedicated and customer-centric professional based in Edinburgh with substantial experience across operations, client communications, and service coordination. Proven track record in resolving customer inquiries professionally, optimizing daily operations, and ensuring exceptional service quality. Currently expanding expertise in modern business management.',
      },
      sections: [
        {
          id: 'sec-skills',
          type: 'skills',
          title: 'Skills',
          visible: true,
          items: [
            { name: 'Client & Customer Communication', level: 'expert' },
            { name: 'Operational Logistics & Planning', level: 'advanced' },
            { name: 'Data Entry & Records Management', level: 'advanced' },
            { name: 'Cross-Team Problem Solving', level: 'advanced' },
            { name: 'Route Optimization & GPS Navigation', level: 'intermediate' },
            { name: 'CRM & Helpdesk Tools', level: 'intermediate' },
          ],
        },
        {
          id: 'sec-exp',
          type: 'experience',
          title: 'Work History',
          visible: true,
          items: [
            {
              company: 'Apex Care Services',
              role: 'Customer Support & Operations Associate',
              location: 'Edinburgh, UK',
              startDate: '2024-01',
              endDate: 'Present',
              current: true,
              description:
                '• Answered high-volume incoming customer inquiries and resolved escalated cases professionally.\n• Maintained a 98% customer satisfaction score across all phone and email channels.\n• Streamlined appointment logging procedures, cutting data reconciliation delays by 25%.',
            },
            {
              company: 'Metro Courier Logistics',
              role: 'Senior Delivery Specialist & Dispatch Coordinator',
              location: 'Edinburgh, UK',
              startDate: '2022-06',
              endDate: '2023-12',
              current: false,
              description:
                '• Coordinated safe, timely delivery of priority goods and parcels across central Edinburgh.\n• Utilized digital route planning and mapping systems to minimize transit delays by 18%.\n• Adhered strictly to municipal safety standards and road regulations with zero safety incidents.',
            },
          ],
        },
        {
          id: 'sec-edu',
          type: 'education',
          title: 'Education',
          visible: true,
          items: [
            {
              institution: 'Edinburgh Napier University',
              degree: 'Bachelor of Science (Hons) in Business & Management',
              field: 'Business Management',
              location: 'Edinburgh, UK',
              startDate: '2024',
              endDate: '2027',
              current: true,
            },
            {
              institution: 'Central Academy Edinburgh',
              degree: 'Higher National Certificate in Administration',
              field: 'Administration',
              location: 'Edinburgh, UK',
              startDate: '2021',
              endDate: '2023',
              current: false,
            },
          ],
        },
        {
          id: 'sec-strengths',
          type: 'strengths',
          title: 'Key Strengths',
          visible: true,
          items: [
            { title: 'Reliability', description: 'Consistent performance under peak operational workloads.' },
            { title: 'Adaptability', description: 'Fast onboarding in dynamic corporate service environments.' },
          ],
        },
        {
          id: 'sec-lang',
          type: 'languages',
          title: 'Languages',
          visible: true,
          items: [
            { name: 'English', proficiency: 'fluent' },
            { name: 'Urdu', proficiency: 'native' },
          ],
        },
      ],
    };
  }

  // 4. Navy Executive Sidebar (Generic showcase data)
  if (templateKey === 'navy-executive-sidebar') {
    return {
      basics: {
        fullName: 'EVELYN HARPER',
        email: 'evelyn.harper@example.com',
        phone: '+1 (555) 349-8201',
        location: 'New York, NY, United States',
        website: 'https://evelynharper.exec',
        linkedin: 'https://linkedin.com/in/evelyn-harper',
        summary:
          'High-impact Senior Operations & Strategy Leader with over 7 years of experience directing high-growth cross-functional programs, optimizing corporate workflows, and delivering multi-million dollar operational efficiency gains. Adept at turning executive strategy into measurable execution.',
      },
      sections: [
        {
          id: 'sec-exp',
          type: 'experience',
          title: 'EXPERIENCE',
          visible: true,
          items: [
            {
              company: 'Vanguard Enterprise Solutions',
              role: 'Director of Strategic Operations',
              location: 'New York, NY',
              startDate: '2022-04',
              endDate: 'Present',
              current: true,
              description:
                '• Spearheaded cross-departmental operations overhaul across 4 regional business units, driving $3.2M in annual cost reductions.\n• Implemented automated KPI dashboards and resource allocation models that boosted delivery velocity by 28%.\n• Managed an executive operations team of 18 professionals with a 95% annual employee retention rate.',
            },
            {
              company: 'Beacon Strategic Advisory',
              role: 'Senior Management Consultant',
              location: 'Boston, MA',
              startDate: '2019-01',
              endDate: '2022-03',
              current: false,
              description:
                '• Advised Fortune 500 leadership on operational modernization, supply chain restructuring, and post-merger integration.\n• Delivered 9 high-stakes client engagements on time and under budget, exceeding NPS targets by 15 points.\n• Authored best-practice frameworks for corporate governance and workflow automation.',
            },
          ],
        },
        {
          id: 'sec-edu',
          type: 'education',
          title: 'EDUCATION',
          visible: true,
          items: [
            {
              institution: 'Columbia University',
              degree: 'Master of Business Administration (MBA)',
              field: 'Operations & Strategy',
              location: 'New York, NY',
              startDate: '2017',
              endDate: '2019',
              current: false,
            },
            {
              institution: 'Boston College',
              degree: 'Bachelor of Science in Economics',
              field: 'Economics',
              location: 'Boston, MA',
              startDate: '2013',
              endDate: '2017',
              current: false,
            },
          ],
        },
        {
          id: 'sec-skills',
          type: 'skills',
          title: 'SKILLS',
          visible: true,
          items: [
            { name: 'Strategic Planning & Execution' },
            { name: 'Cross-Functional Team Leadership' },
            { name: 'Operational Cost Optimization' },
            { name: 'Business Intelligence & Data Analytics' },
            { name: 'Stakeholder & Executive Relations' },
            { name: 'Change Management & Agile' },
          ],
        },
        {
          id: 'sec-proj',
          type: 'projects',
          title: 'SELECTED INITIATIVES',
          visible: true,
          items: [
            {
              name: 'Enterprise ERP Transformation',
              description: 'Led end-to-end cloud ERP rollout migrating 1,200 active enterprise accounts with zero downtime.',
            },
            {
              name: 'Global Vendor Rationalization',
              description: 'Consolidated vendor network from 45 suppliers to 12 strategic partners, saving $1.8M annually.',
            },
          ],
        },
        {
          id: 'sec-lang',
          type: 'languages',
          title: 'LANGUAGES',
          visible: true,
          items: [
            { name: 'English', proficiency: 'native' },
            { name: 'French', proficiency: 'fluent' },
          ],
        },
      ],
    };
  }

  // 5. Executive Modern Photo (Generic showcase data)
  if (templateKey === 'executive-modern-photo') {
    return {
      basics: {
        fullName: 'Marcus Sterling',
        email: 'marcus.sterling@example.com',
        phone: '+1 (555) 914-2309',
        location: 'San Francisco, CA, United States',
        website: 'https://marcussterling.tech',
        linkedin: 'https://linkedin.com/in/marcussterling',
        summary:
          'Passionate Full Stack Engineer with 6+ years of expertise building resilient cloud architectures, scalable web applications, and developer platforms. Skilled in React, TypeScript, Node.js, and cloud native microservices. Dedicated to clean architecture and exceptional user experiences.',
        photoUrl: '/photo-test.jpg',
      },
      sections: [
        {
          id: 'sec-exp',
          type: 'experience',
          title: 'EXPERIENCE',
          visible: true,
          items: [
            {
              company: 'Aether Cloud Systems',
              role: 'Lead Full Stack Engineer',
              location: 'San Francisco, CA',
              startDate: '2022-03',
              endDate: 'Present',
              current: true,
              description:
                '• Led a team of 6 engineers architecting scalable cloud dashboards processing 15M daily requests.\n• Spearheaded migration to Next.js and TypeScript, slashing bundle size by 40% and cutting latency by 200ms.\n• Implemented automated CI/CD pipelines reducing deployment errors by 70%.',
            },
            {
              company: 'Veloce Digital Labs',
              role: 'Frontend Engineer',
              location: 'San Jose, CA',
              startDate: '2019-06',
              endDate: '2022-02',
              current: false,
              description:
                '• Developed modular UI component libraries used by over 20 internal engineering teams.\n• Optimized client rendering cycles to deliver smooth 60fps animations across complex data tables.',
            },
          ],
        },
        {
          id: 'sec-edu',
          type: 'education',
          title: 'EDUCATION',
          visible: true,
          items: [
            {
              institution: 'University of California, Berkeley',
              degree: 'Bachelor of Science in Computer Science',
              field: 'Computer Science',
              location: 'Berkeley, CA',
              startDate: '2015',
              endDate: '2019',
              current: false,
            },
          ],
        },
        {
          id: 'sec-skills',
          type: 'skills',
          title: 'TECHNICAL SKILLS',
          visible: true,
          items: [
            { name: 'TypeScript & JavaScript', level: 'expert' },
            { name: 'React & Next.js', level: 'expert' },
            { name: 'Node.js & GraphQL', level: 'advanced' },
            { name: 'PostgreSQL & Redis', level: 'advanced' },
            { name: 'Docker & Kubernetes', level: 'intermediate' },
          ],
        },
        {
          id: 'sec-strengths',
          type: 'strengths',
          title: 'STRENGTHS',
          visible: true,
          items: [
            { title: 'Architectural Thinking', description: 'Designs scalable and maintainable system boundaries.' },
            { title: 'Agile Mentorship', description: 'Coaches engineers in modern testing and code reviews.' },
          ],
        },
        {
          id: 'sec-proj',
          type: 'projects',
          title: 'KEY PROJECTS',
          visible: true,
          items: [
            {
              name: 'CloudPulse Monitoring Engine',
              url: 'https://github.com/marcussterling/cloudpulse',
              description: 'Open-source telemetry dashboard for containerized microservices with real-time alerting.',
            },
          ],
        },
      ],
    };
  }

  // Default sample data (Europass, JobHire Chronological, JobHire Creative)
  return {
    basics: {
      fullName: 'Alexander Wright',
      email: 'alexander.wright@example.com',
      phone: '+1 (555) 234-5678',
      location: 'San Francisco, CA',
      website: 'https://alexwright.dev',
      linkedin: 'https://linkedin.com/in/alexanderwright',
      summary:
        'Accomplished Senior Software Engineer with 8+ years of expertise designing resilient microservices, high-throughput cloud infrastructure, and modern web applications. Proven track record in leading distributed cross-functional teams to deliver enterprise-grade software.',
      photoUrl: '/photo-test.jpg',
    },
    sections: [
      {
        id: 'sec-exp',
        type: 'experience',
        title: 'Professional Experience',
        visible: true,
        items: [
          {
            company: 'Vanguard Systems',
            role: 'Staff Infrastructure Engineer',
            location: 'San Francisco, CA',
            startDate: '2021-03',
            endDate: 'Present',
            current: true,
            description:
              '• Architected event-driven microservices processing 45M daily transactions with 99.99% uptime.\n• Reduced AWS cloud compute and database costs by 32% through container rightsizing and caching.\n• Mentored 10+ junior and mid-level engineers in distributed systems design and clean architecture.',
          },
          {
            company: 'Nexus Cloud Technologies',
            role: 'Senior Backend Developer',
            location: 'Seattle, WA',
            startDate: '2018-06',
            endDate: '2021-02',
            current: false,
            description:
              '• Engineered real-time data sync pipeline utilizing PostgreSQL, Redis streams, and WebSockets.\n• Spearheaded automated CI/CD pipeline modernization, slashing deployment lead times from 4 hours to 12 minutes.\n• Authored comprehensive architectural decision records and API documentation for partner integrations.',
          },
        ],
      },
      {
        id: 'sec-edu',
        type: 'education',
        title: 'Education',
        visible: true,
        items: [
          {
            institution: 'University of Washington',
            degree: 'Bachelor of Science in Computer Science',
            field: 'Computer Science',
            location: 'Seattle, WA',
            startDate: '2014-09',
            endDate: '2018-05',
            current: false,
            description: 'Graduated Magna Cum Laude (GPA 3.89/4.0) • President of ACM Student Chapter',
          },
        ],
      },
      {
        id: 'sec-skills',
        type: 'skills',
        title: 'Core Competencies & Technologies',
        visible: true,
        items: [
          { name: 'TypeScript & Node.js', level: 'expert' },
          { name: 'PostgreSQL & Neon', level: 'advanced' },
          { name: 'Next.js & React', level: 'expert' },
          { name: 'Docker & Kubernetes', level: 'advanced' },
          { name: 'Distributed Systems', level: 'expert' },
          { name: 'System Architecture', level: 'advanced' },
        ],
      },
      {
        id: 'sec-proj',
        type: 'projects',
        title: 'Featured Projects',
        visible: true,
        items: [
          {
            name: 'PulseFlow Workflow Engine',
            url: 'https://github.com/alexwright/pulseflow',
            startDate: '2022',
            endDate: '2023',
            description:
              'Open-source distributed task execution framework built with Go and Redis, garnering 2,500+ GitHub stars.',
          },
        ],
      },
    ],
  };
}
