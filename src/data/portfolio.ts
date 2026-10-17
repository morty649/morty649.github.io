export type ProjectLink = {
  label: string;
  url: string;
};

export type Project = {
  slug: string;
  title: string;
  shortTitle: string;
  period: string;
  category: string;
  status: string;
  summary: string;
  problem: string;
  approach: readonly string[];
  outcomes: readonly string[];
  technologies: readonly string[];
  links: readonly ProjectLink[];
  featured: boolean;
  resumeBacked: boolean;
  accent: "teal" | "amber" | "blue" | "violet";
};

export const SITE = {
  name: "Maruthi Enugula",
  firstName: "Maruthi",
  handle: "morty649",
  initials: "ME",
  url: "https://morty649.github.io",
  email: "enugulamaruthi@gmail.com",
  location: "Hyderabad, India",
  avatarPath: "/avatar.jpg",
  avatarUrl: "https://morty649.github.io/avatar.jpg",
  title: "ML Researcher · World Models & Continual Learning",
  description:
    "I study systems that keep learning after deployment: JEPA-style world models that adapt over time, and the RL rewards that train them.",
  intro:
    "My current work is on continual learning and JEPA-style world models: how a model that predicts in latent space can adapt at test time, what reward it should get when reality grades its predictions, and how such systems fail. Before this I worked on RL post-training, reward hacking, and agents.",
  interests: [
    "JEPA-style world models",
    "Continual and test-time learning",
    "Reward design and reward hacking",
    "Diagnosing training failures",
  ],
  social: {
    github: "https://github.com/morty649",
    linkedin: "https://linkedin.com/in/maruthienugula",
    leetcode: "https://leetcode.com/u/enugulamaruthi/",
  },
} as const;

export const EXPERIENCE = [
  {
    company: "Scaled Focus",
    role: "AI Research Intern",
    period: "Jun 2026 - Aug 2026",
    location: "Bengaluru, India",
    summary:
      "Built agent infrastructure for research workflows as part of the inaugural Activate AI Fellows cohort.",
    bullets: [
      "Developed a model-migration plugin for a Recursive Language Models harness, making model backends easier to integrate and evaluate across agent workflows.",
      "Worked on cross-platform agent delivery by integrating a core Slack agent workflow with WhatsApp.",
      "Selected for the Activate AI Fellows Summer 2026 cohort from more than 600 applicants.",
    ],
    href: "https://www.linkedin.com/company/scaled-focus/",
  },
] as const;

export const EDUCATION = [
  {
    school: "IIIT (RGUKT) Basar",
    degree: "B.Tech in Computer Science and Engineering",
    period: "2023 - 2027",
    details:
      "Coursework in data structures and algorithms, machine learning, database systems, and computer networks.",
  },
  {
    school: "IIIT (RGUKT) Basar",
    degree: "Pre-University Course",
    period: "2021 - 2023",
    details: "Foundation in mathematics, computing, and engineering sciences.",
  },
] as const;

export const SKILLS = [
  {
    group: "World models & RL",
    items: [
      "JEPA",
      "test-time adaptation",
      "MPC planning",
      "PPO",
      "GRPO",
      "KL-regularised RL",
      "survival models",
    ],
  },
  {
    group: "Machine learning",
    items: [
      "PyTorch",
      "scikit-learn",
      "RLVR",
      "reward modeling",
      "model evaluation",
    ],
  },
  {
    group: "Agents & retrieval",
    items: [
      "RAG",
      "LangChain",
      "LangGraph",
      "LangSmith",
      "hybrid search",
      "HyDE",
    ],
  },
  {
    group: "Systems",
    items: [
      "FastAPI",
      "Docker",
      "CI/CD",
      "REST APIs",
      "Modal",
      "Kaggle GPU pipelines",
      "Pydantic",
    ],
  },
  {
    group: "Data & languages",
    items: [
      "Python",
      "C++",
      "Java",
      "TypeScript",
      "FAISS",
      "ChromaDB",
      "AstraDB",
    ],
  },
] as const;

export type ResearchThread = {
  title: string;
  period: string;
  status: "In progress" | "Pilot done" | "Stopped at gate" | "Completed";
  question: string;
  findings: readonly string[];
  tags: readonly string[];
};

export const RESEARCH: readonly ResearchThread[] = [
  {
    title: "Test-time adaptation of JEPA world models (AdaJEPA)",
    period: "Oct 2026",
    status: "In progress",
    question:
      "Does adapting a JEPA world model at test time actually help a planner under distribution shift, and where does it break?",
    findings: [
      "Ran the released AdaJEPA checkpoints on Kaggle T4s, 50 paired episodes per condition.",
      "Adaptation helps on held-out shapes (40% vs 24% success, p = 0.039) and visual shifts (80% vs 62%, p = 0.022), close to the paper.",
      "It does not help on the red-block shift (6% vs 14%). The frozen planner stops improving after 10 steps while the adapted one keeps going. Ablations that test why are running.",
    ],
    tags: ["JEPA", "World models", "Test-time training", "MPC"],
  },
  {
    title: "Rewards graded by reality: RL for world models that predict events",
    period: "Oct 2026",
    status: "Pilot done",
    question:
      "If a model predicts machine events and later sees the outcome, that outcome is a free reward. What reward should it get when it also picks which claim to make?",
    findings: [
      "Trained Qwen2.5 + LoRA with GRPO to make checkable claims about turbofan engines (C-MAPSS) and water-quality streams (GECCO).",
      "A plain log-score reward teaches trivial claims: 92% trivial, no real information.",
      "A skill reward measured against a calibrated reference gives informative claims (0.12-0.24 nats). Against a miscalibrated reference, the agent reward-hacks: highest reward of any run, negative true information.",
    ],
    tags: ["GRPO", "Reward design", "Reward hacking", "Event prediction"],
  },
  {
    title: "Reproducing HEPA: JEPA pretraining for event prediction in time series",
    period: "Sep - Oct 2026",
    status: "Completed",
    question:
      "Do the published numbers of a JEPA-based event predictor hold up when the code is run unmodified, and is its event head calibrated?",
    findings: [
      "Reproduced 7 benchmarks x 5 seeds on Kaggle T4s for under 1 GPU-hour. FD001, GECCO and ETTm1 match; FD002-FD004 show small systematic offsets.",
      "The event head behaves like a Cox survival model. Training it with the proper survival likelihood improves calibration on 6 of 11 benchmarks.",
    ],
    tags: ["JEPA", "Time series", "Survival analysis", "Reproduction"],
  },
  {
    title: "Probing JEPA latent spaces",
    period: "Oct 2026",
    status: "Completed",
    question:
      "What does a joint-embedding predictive objective learn across modalities, and when does it collapse?",
    findings: [
      "Label-free cross-modal JEPA (text to image embeddings), prototype heads (88.4% probe accuracy), and a study of collapse in two-encoder JEPAs.",
      "Found that the shared text-image signal has rank about C-1, with a sharp cliff after it.",
    ],
    tags: ["JEPA", "Representation learning", "Collapse"],
  },
  {
    title: "Battery world model for charge planning",
    period: "Oct 2026",
    status: "Stopped at gate",
    question:
      "Can a learned battery world model plan charging that slows aging? First check: is there enough headroom to matter?",
    findings: [
      "Simulated 15 regimes in PyBaMM. Charging rate changes aging by at most 1.5x, below the 2x gate set in advance, so later stages were not run.",
    ],
    tags: ["World models", "Planning", "Negative result"],
  },
];

export const PROJECTS: readonly Project[] = [
  {
    slug: "vision-ppo-racing-arena",
    title: "Vision PPO Racing Arena: Diagnosing a Silent RL Training Failure",
    shortTitle: "Vision PPO Racing",
    period: "Sep 2026",
    category: "Reinforcement learning",
    status: "Public repo",
    summary:
      "A pixel-only PPO driver in MetaDrive that silently failed to learn, traced to a global gradient clip starving the actor head.",
    problem:
      "A 500k-step run of a pixel-only PPO agent showed no sustained improvement and reached only 5% route completion. Nothing crashed, so the cause had to be found by measurement.",
    approach: [
      "Measured per-module gradient norms and weight drift during training.",
      "Found that a single global gradient clip scaled the actor head's gradients down about 100x (norm 17 vs 2,468 for the encoder), so actor weights moved less than 0.002 over 100k steps.",
      "Fixed it with per-module optimizer parameter groups and retuned loss coefficients. Added parallel rollout workers and macOS/MPS support.",
    ],
    outcomes: [
      "The actor's update size grew about 10,000x.",
      "Route completion reached 17% after 20k steps, vs 5% for the old 100k-step policy.",
    ],
    technologies: ["Python", "PyTorch", "PPO", "MetaDrive", "MPS"],
    links: [
      { label: "GitHub", url: "https://github.com/morty649/vision-ppo-racing-arena" },
    ],
    featured: true,
    resumeBacked: true,
    accent: "teal",
  },
  {
    slug: "browser-control-qwen-grpo",
    title: "Browser Control with Qwen using GRPO",
    shortTitle: "Qwen Browser Agent",
    period: "2026",
    category: "Reinforcement learning",
    status: "Active research",
    summary:
      "A Qwen model trained with GRPO to translate BrowserGym state into executable browser actions.",
    problem:
      "Traditional browser scripts are brittle: they depend on fixed selectors and fail when interfaces change. This experiment asks whether a small language model can learn browser behavior from task outcomes instead.",
    approach: [
      "Converted accessibility-tree state and task goals into compact text prompts.",
      "Constrained the model to one structured action such as click('13') and rewarded episode success.",
      "Built training, checkpointing, and episode-level evaluation flows, using Modal for remote GPU experiments.",
    ],
    outcomes: [
      "Published the trained checkpoint on Hugging Face for reproducible evaluation.",
      "Created a focused research base for expanding to more MiniWoB and BrowserGym tasks.",
    ],
    technologies: ["Python", "Qwen2", "GRPO", "BrowserGym", "TRL", "Modal"],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/morty649/controlling-browser-using-qwen-agent",
      },
      {
        label: "Hugging Face model",
        url: "https://huggingface.co/morty649/Qwen2-0.5B-Instruct-browsergym-20260405-121307",
      },
    ],
    featured: true,
    resumeBacked: true,
    accent: "teal",
  },
  {
    slug: "shl-assessment-agent",
    title: "SHL Assessment Recommendation Agent",
    shortTitle: "SHL Recommendation Agent",
    period: "2026",
    category: "Applied AI",
    status: "Public API",
    summary:
      "A conversational FastAPI service that turns hiring intent into catalog-grounded SHL assessment recommendations.",
    problem:
      "Hiring managers often know the role they need to assess, but not the exact catalog vocabulary or product name. A useful assistant must clarify vague requests without inventing assessments.",
    approach: [
      "Optimized the conversation into a retrieval query, then combined semantic search with BM25.",
      "Reranked candidates and restricted final recommendations to the indexed SHL catalog.",
      "Added clarification, refinement, comparison, refusal behavior, and typed API validation.",
    ],
    outcomes: [
      "Delivered a stateless, Docker-ready FastAPI service with public API documentation.",
      "Kept names and URLs grounded in catalog records to reduce unsupported recommendations.",
    ],
    technologies: ["FastAPI", "Pydantic", "ChromaDB", "BM25", "Docker", "Groq"],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/morty649/conversational_assessment_recommender",
      },
      {
        label: "API documentation",
        url: "https://morty649-conversational-assessment-recommender.hf.space/docs",
      },
    ],
    featured: true,
    resumeBacked: true,
    accent: "blue",
  },
  {
    slug: "rag-agentic-ai-suite",
    title: "RAG and Agentic AI Implementation Suite",
    shortTitle: "RAG & Agentic AI Suite",
    period: "Dec 2025 - Jan 2026",
    category: "Retrieval systems",
    status: "Project suite",
    summary:
      "A modular laboratory for retrieval, reasoning, memory, evaluation, and agent-based workflows.",
    problem:
      "RAG experiments often become isolated notebooks. This suite collects reusable implementations so retrieval strategies and agent behaviors can be compared in one place.",
    approach: [
      "Implemented hybrid retrieval, query decomposition, HyDE, semantic chunking, and memory-aware prompting.",
      "Explored corrective, adaptive, agentic, and autonomous retrieval patterns with LangGraph.",
      "Added typed validation and LangSmith-based evaluation workflows for repeatable experiments.",
    ],
    outcomes: [
      "Produced reusable modules spanning ingestion, vector stores, retrieval, generation, and evaluation.",
      "Supported focused subprojects for report analysis and domain-specific question answering.",
    ],
    technologies: ["Python", "LangChain", "LangGraph", "LangSmith", "FAISS", "AstraDB"],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/morty649/RAG_and_Agentic_AI_Implementation_Suite",
      },
    ],
    featured: false,
    resumeBacked: true,
    accent: "violet",
  },
  {
    slug: "rl-alignment-tinystories",
    title: "Reward Over-Optimisation in KL-Regularised RL Alignment of a Small GPT",
    shortTitle: "Reward Hacking in a Small GPT",
    period: "Feb 2026; Oct 2026",
    category: "Alignment research",
    status: "Completed study",
    summary:
      "A from-scratch alignment pipeline on a 0.8M-parameter GPT, and a KL sweep showing exactly when the policy starts reward-hacking.",
    problem:
      "Large alignment stacks obscure the mechanics of policy optimization. A small, reproducible model makes reward shaping, policy drift, and KL control easier to observe directly.",
    approach: [
      "Built a three-stage pipeline: pretraining, supervised fine-tuning, and policy-gradient optimization.",
      "Used an automated sentiment reward and a KL penalty to a frozen reference policy.",
      "Swept the KL coefficient from 0 to 1 and scored outputs with held-out judges the policy never trained on: a second sentiment lexicon, bigram diversity, and fluency under the base model.",
      "Found and fixed two bugs that made the original KL estimate negative (dropout active while scoring, and off-policy top-k sampling).",
    ],
    outcomes: [
      "Without a KL penalty the proxy reward saturated at 0.996 while held-out sentiment fell from 0.70 to 0.50, as outputs collapsed to \"love love love...\".",
      "A small penalty (beta = 0.01) gave higher held-out sentiment (0.77) at 30x lower KL, but did not prevent template collapse.",
    ],
    technologies: ["Python", "PyTorch", "Policy gradient", "KL regularization", "TinyStories"],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/morty649/RL-based-alignment-positive-tinystories",
      },
      {
        label: "Hugging Face Space",
        url: "https://huggingface.co/spaces/morty649/positive-tinystories-gpt",
      },
    ],
    featured: true,
    resumeBacked: true,
    accent: "amber",
  },
  {
    slug: "network-security-mlops",
    title: "Production MLOps Pipeline for Network Security",
    shortTitle: "Network Security MLOps",
    period: "Jun - Sep 2025",
    category: "MLOps",
    status: "Completed pipeline",
    summary:
      "An end-to-end machine-learning workflow for phishing and network-security data, from ingestion to deployable inference.",
    problem:
      "Security models need more than a training notebook: data validation, repeatable training, packaging, deployment, and health checks must work together.",
    approach: [
      "Structured data ingestion, validation, transformation, model training, and evaluation as repeatable stages.",
      "Packaged inference behind an API and containerized the service for consistent deployment.",
      "Connected the repository to CI/CD practices for reproducible updates.",
    ],
    outcomes: [
      "Turned a phishing-classification experiment into a production-oriented ML workflow.",
      "Documented a reusable structure for future model retraining and deployment.",
    ],
    technologies: ["Python", "scikit-learn", "Docker", "CI/CD", "REST API"],
    links: [
      { label: "GitHub", url: "https://github.com/morty649/NetworkSecurity" },
    ],
    featured: false,
    resumeBacked: true,
    accent: "blue",
  },
  {
    slug: "hackfinder-extension",
    title: "HackFinder Browser Extension",
    shortTitle: "HackFinder",
    period: "2026",
    category: "Product engineering",
    status: "Browser extension",
    summary:
      "A Chrome extension that searches public hackathon sources and groups results by location, format, and domain.",
    problem:
      "Students and builders repeatedly search multiple sites to compare online, nearby, and domain-specific hackathons.",
    approach: [
      "Aggregated public event sources into a lightweight browser-toolbar workflow.",
      "Added geolocation, reverse geocoding, domain filters, distance categories, and source attribution.",
      "Cached repeated queries to make the extension responsive and reduce unnecessary requests.",
    ],
    outcomes: [
      "Created a focused discovery tool that keeps source links visible to users.",
      "Packaged the experience as a loadable Chrome extension rather than a separate website.",
    ],
    technologies: ["JavaScript", "Chrome Extensions", "Geolocation", "REST APIs"],
    links: [
      { label: "GitHub", url: "https://github.com/morty649/HackFinder-extension" },
    ],
    featured: false,
    resumeBacked: true,
    accent: "teal",
  },
  {
    slug: "pdf-analysis-report-system",
    title: "PDF Analysis and Conversational Reporting System",
    shortTitle: "Report-to-Chat",
    period: "2026",
    category: "Document intelligence",
    status: "Prototype",
    summary:
      "A conversational research tool for extracting grounded insights from dense financial and regulatory PDFs.",
    problem:
      "Analysts often read long reports line by line to locate a small number of decisions, risks, or comparisons.",
    approach: [
      "Parsed, cleaned, and chunked PDFs for dense and BM25 retrieval.",
      "Combined results with reciprocal-rank fusion and added a web-search fallback router.",
      "Maintained conversation summaries for contextual follow-up questions.",
    ],
    outcomes: [
      "Produced a source-focused chat workflow for financial and regulatory documents.",
      "Separated retrieval, tool routing, memory, and answer generation into explicit stages.",
    ],
    technologies: ["Python", "Streamlit", "BM25", "Embeddings", "RRF", "Groq"],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/morty649/pdf-to-analysis-report-system",
      },
    ],
    featured: false,
    resumeBacked: true,
    accent: "violet",
  },
  {
    slug: "iron-man-intelligence",
    title: "Iron Man Intelligence Engine",
    shortTitle: "Iron Man Intelligence",
    period: "2026",
    category: "Hybrid RAG",
    status: "Prototype",
    summary:
      "A domain-specific hybrid RAG system that answers questions about Iron Man (2008) from retrieved screenplay scenes.",
    problem:
      "Entity-heavy, multi-hop movie questions expose weaknesses in dense-only retrieval and make hallucinations easy to spot.",
    approach: [
      "Combined AstraDB dense retrieval with an in-memory BM25 index and weighted rank fusion.",
      "Indexed scene-level documents with location and sequence metadata.",
      "Restricted generation to retrieved scenes and surfaced those scenes in the interface.",
    ],
    outcomes: [
      "Created a compact testbed for retrieval tuning, grounding, and source transparency.",
      "Handled missing evidence explicitly instead of allowing unsupported answers.",
    ],
    technologies: ["Python", "AstraDB", "BM25", "Groq", "Streamlit", "Sentence Transformers"],
    links: [
      { label: "GitHub", url: "https://github.com/morty649/ironman-intelligence" },
    ],
    featured: false,
    resumeBacked: true,
    accent: "amber",
  },
  {
    slug: "football-analysis-yolo",
    title: "Football Analysis with YOLOv8 and OpenCV",
    shortTitle: "Football Vision Pipeline",
    period: "Jun - Jul 2025",
    category: "Computer vision",
    status: "Public project",
    summary:
      "A modular computer-vision pipeline for player tracking, team assignment, ball possession, and motion-aware match analysis.",
    problem:
      "Real match footage combines small moving objects, camera pans, team ambiguity, and temporal statistics in one difficult vision problem.",
    approach: [
      "Used YOLOv8 for player, referee, and ball detection and jersey-color clustering for team assignment.",
      "Estimated speed and distance from tracked positions and linked the ball to the controlling player.",
      "Compensated for camera motion with optical flow before producing annotated video output.",
    ],
    outcomes: [
      "Built an end-to-end pipeline that overlays player IDs, movement statistics, and ball control.",
      "Published the modular implementation and a public technical walkthrough.",
    ],
    technologies: ["Python", "YOLOv8", "OpenCV", "Optical flow", "NumPy"],
    links: [
      {
        label: "GitHub",
        url: "https://github.com/morty649/football_analysis_using_yolo_opencv",
      },
      {
        label: "Project post",
        url: "https://www.linkedin.com/posts/maruthienugula_computervision-yolov8-opencv-activity-7349128773566353408-i-3v",
      },
    ],
    featured: false,
    resumeBacked: false,
    accent: "teal",
  },
] as const;

export const FEATURED_PROJECTS = PROJECTS.filter((project) => project.featured);
export const ADDITIONAL_PROJECTS = PROJECTS.filter((project) => !project.featured);

export function getProject(slug: string) {
  return PROJECTS.find((project) => project.slug === slug);
}

export const CREDENTIALS = [
  {
    title: "Activate AI Fellows - Summer 2026",
    issuer: "Activate",
    detail: "Selected from 600+ applicants and matched with Scaled Focus.",
    href: "https://www.linkedin.com/posts/activatevcai_introducing-the-activate-ai-fellows-summer-activity-7468579766556676096-WrM_",
  },
] as const;
