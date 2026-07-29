export interface Project {
  id: string;
  title: string;
  short: string;
  description: string;
  tags: string[];
  href?: string;
  demo?: string;
  note?: string;
}

export const projects: Project[] = [
  {
    id: 'volkit',
    title: 'volkit — GARCH Volatility & VaR Backtesting',
    short: 'From-scratch GARCH-family estimation with a rolling VaR/ES backtesting engine.',
    description:
      'Quantitative risk library implementing GARCH, GJR-GARCH and EGARCH with Normal, Student-t and Hansen skewed-t innovations — hand-coded constrained maximum likelihood, Numba-accelerated recursions, robust standard errors — validated against the arch library to within 1e-3. Includes a rolling out-of-sample VaR/Expected Shortfall engine with Kupiec and Christoffersen coverage tests over 4,000+ trading days of S&P 500 data; GARCH-skewt is the only model passing both tests at the 5% and 1% levels. The live demo recomputes the coverage tests in your browser.',
    tags: ['Quant Finance', 'GARCH', 'VaR', 'Numba', 'MLE'],
    href: 'https://github.com/utsavp257/volkit',
    demo: 'https://volkit.vercel.app/',
  },
  {
    id: 'f1-strategy',
    title: 'F1 Race Strategy — ML Trainer & Predictor',
    short: 'Lap-time models over ten seasons of F1 data driving a pit-stop strategy search.',
    description:
      'Machine-learning pipeline over 2015–2024 Formula 1 telemetry (162,282 lap records via FastF1): race- and lap-level feature engineering, model selection across four regressors, and a lap-by-lap simulator that grid-searches 522 pit-stop strategies against a locked field. Identified late single-stop strategies as a frequent predictor of improved race performance. The live demo is an interactive strategy sandbox for the 2025 British Grand Prix with a broadcast-style timing tower.',
    tags: ['Machine Learning', 'Simulation', 'FastF1', 'Strategy Search'],
    href: 'https://github.com/utsavp257/f1_trainer_and_predictor',
    demo: 'https://f1-trainer-and-predictor.vercel.app/',
  },
  {
    id: 'bias-detection',
    title: 'Bias Detection in AI Agents',
    short: 'Measuring racial and gender bias in vision-language model outputs.',
    description:
      'Evaluated racial and gender bias in AI-generated alternative text using 1,200 synthetic images and outputs from modern vision-language models. Applied NLP, sentiment and embedding-based evaluation metrics to measure disparities across demographic dimensions.',
    tags: ['Responsible AI', 'VLMs', 'NLP', 'Evaluation'],
    note: 'Paper under double-blind peer review; code and dataset to be released upon publication.',
  },
  {
    id: 'ner-low-resource',
    title: 'NER in Low-Resource Languages',
    short: 'Cross-lingual projection + IndicBERT fine-tuning for NER datasets.',
    description:
      'Built an end-to-end pipeline to generate silver-standard NER datasets by projecting English NER tags onto Indic languages using Samanantar and Wikipedia data. Used spaCy, LaBSE, SimAlign and Awesome-Align for alignment, and fine-tuned IndicBERT for NER — with a focus on alignment quality, filtering and reproducible training.',
    tags: ['NLP', 'NER', 'IndicBERT', 'Tag Projection'],
    href: 'https://github.com/utsavp257/NER_tagging_pipeline',
  },
  {
    id: 'gallery-app',
    title: 'Gallery App',
    short: 'Production-deployed Next.js app with auth, analytics and rate limiting.',
    description:
      'Feature-rich gallery app in TypeScript and Tailwind CSS where users upload and view images after logging in (parallel routes). Authentication with Clerk, deployed on Vercel, with Sentry for error management, PostHog for analytics and Upstash for rate limiting.',
    tags: ['Next.js', 'TypeScript', 'Clerk', 'Vercel'],
    href: 'https://github.com/utsavp257/t3gallery',
    demo: 'https://t3gallery-tau-coral.vercel.app',
  },
  {
    id: 'conv-sum',
    title: 'Conversation Summarizer',
    short: 'Dialogue summarization fine-tuned with QLoRA on Llama 2.',
    description:
      'Conversational summarizer trained on the SAMSum dataset by fine-tuning Llama 2 with QLoRA for resource efficiency — contextual dialogue summaries with sharply reduced training requirements through parameter-efficient fine-tuning.',
    tags: ['LLMs', 'Llama 2', 'QLoRA', 'PEFT'],
    href: 'https://github.com/utsavp257/conversation-summarizer',
  },
  {
    id: 'qa-systems-comparative',
    title: 'QA Systems for Comparative Questions',
    short: 'Controlled experiments on training-data quantity for BERT-based QA.',
    description:
      'Measured the effect of varying quantities of training data on BERT-based question-answering models through controlled experiments, analyzing data and hyperparameter configurations against model benchmarks.',
    tags: ['LLMs', 'BERT', 'Comparative QA'],
    href: 'https://github.com/utsavp257/BERT_NLP_ComparativeQue',
  },
  {
    id: 'user-authentication-system',
    title: 'User Authentication System',
    short: 'Secure authentication with signup, login, recovery and admin controls.',
    description:
      'User authentication system featuring signup, login, password recovery, email verification and admin controls on the MERN stack — encrypted password storage, token-based email verification and admin oversight for user accounts.',
    tags: ['MERN', 'Security', 'Authentication'],
    href: 'https://github.com/utsavp257/User_Auth',
  },
  {
    id: 'hospital-management-system',
    title: 'Hospital Management System',
    short: 'Database-driven hospital system built with Django and PostgreSQL.',
    description:
      'Django and JavaScript hospital management system on PostgreSQL managing records, appointments and admin workflows — relational schema design, CRUD operations and backend APIs.',
    tags: ['Django', 'PostgreSQL', 'Databases'],
    href: 'https://github.com/utsavp257/Hospital-Management-System',
  },
];
