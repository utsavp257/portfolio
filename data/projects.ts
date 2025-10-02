export const projects = [
    {
    id: 'ner-low-resource',
    title: 'NER in Low-Resource Languages',
    short: 'Cross-lingual projection + IndicBERT fine-tuning for NER datasets.',
    description: 'Built an end-to-end pipeline to generate silver-standard NER datasets by projecting English NER tags onto Indic languages using Samanantar and Wikipedia data. Used tools like spaCy, LaBSE, SimAlign, and Awesome-Align for alignment, and fine-tuned IndicBERT for NER. Focused on alignment quality, filtering, and reproducible training',
    tags: ['NLP', 'NER', 'IndicBERT', 'Tag Projection'],
    href: 'https://github.com/utsavp257/NER_tagging_pipeline'
    },
    {
    id: 'gallery-app',
    title: 'Gallery App',
    short: 'Next.js app with authentication and image uploads.',
    description: 'Developed a feature-rich gallery app using TypeScript, JavaScript, and Tailwind CSS, where users can upload and view images after logging in (using parallel routes). Implemented authentication with Clerk, deployed on Vercel, and integrated Sentry for error management, PostHog for analytics, and Upstash for rate limiting. Use of NextJS enabled smooth UI experience for users',
    tags: ['Next.js', 'TypeScript', 'Clerk', 'Vercel'],
    href: 'https://github.com/utsavp257/t3gallery'
    },
    {
    id: 'conv-sum',
    title: 'Conversation Summarizer',
    short: 'Dialogue summarization fine-tuned with QLoRA on Llama2.',
    description: 'Summarizer trained on SAMSum and fine-tuned with QLoRA for resource efficiency; outputs concise conversation summaries.',
    tags: ['LLMs', 'Llama2', 'QLoRA'],
    href: 'https://github.com/utsavp257/conversation-summarizer'
    },
    {
    id: 'qa-systems-comparative',
    title: 'Question-Answering (QA) systems for comparative questions',
    short: 'Studying input variations and training effects on BERT performance.',
    description: 'The aim of the project was to comprehensively study and/or measure the effect of feeding inputs of varying quantitative inputs in language models like BERT and test various patterns of training to check the variation in performance of the same.',
    tags: ['LLMs', 'BERT', 'Comparative QA'],
    href: 'https://github.com/utsavp257/BERT_NLP_ComparativeQue'
    },
    {
    id: 'user-authentication-system',
    title: 'User Authentication System',
    short: 'Secure authentication with signup, login, recovery, and admin controls.',
    description: 'Designed and implemented a user authentication system featuring signup, login, password recovery, email verification, and admin controls using MongoDB, ExpressJS, React and NodeJS. The system ensures secure user management and data integrity with features like encrypted password storage, token-based email verification, and admin oversight for user accounts',
    tags: ['Authentication', 'MERN Stack', 'Security', 'User Management', 'Encryption'],
    href: 'https://github.com/utsavp257/User_Auth'
    },
    {
    id: 'hospital-management-system',
    title: 'Hospital Management System',
    short: 'Database-driven hospital system built with Django and PostgreSQL.',
    description: 'The aim of the project was to design a database and deploy the system using existing frameworks. The project utilizes the Django framework and JavaScript, with a locally hosted PostgreSQL server managing the backend database',
    tags: ['Django', 'PostgreSQL', 'Database', 'Hospital Management', 'JavaScript'],
    href: 'https://github.com/utsavp257/Hospital-Management-System'
    }
    ];