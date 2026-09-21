/* Site content + links. Everything the chat bot ("M.I.K.U") knows comes from here,
   so keep it factual — the bot never invents anything beyond these fields. */
window.SITE = {
  name: 'Siddhi Bhavya',
  tagline: 'Interaction Design @ ANU',

  links: {
    email: 'mailto:alongsiddhi@gmail.com',
    emailAddress: 'alongsiddhi@gmail.com',      // shown on the pop-up button when "Email" is pressed
    linkedin: 'https://www.linkedin.com/in/siddhi-bhavya/',
    instagram: 'https://www.instagram.com/alongsiddhi/?hl=en',
    resume: 'assets/resume/resume.pdf'          // TODO: drop the PDF at this path
  },

  // Sidebar + footer navigation. `lm` opens the M.I.K.U tab instead of navigating.
  nav: [
    { id: 'work',    label: 'My Work',       href: 'home.html' },
    { id: 'about',   label: 'About Me',      href: 'about.html' },
    { id: 'quests',  label: 'Side Quests',   href: 'side-quests.html' },
    { id: 'lm',      label: 'M.I.K.U',        action: 'lm' },
    { id: 'gallery', label: 'Guest Gallery', href: 'guest-gallery.html' }
  ],

  // Text is verbatim from the Figma frames.
  projects: [
    {
      id: 'syncletter', title: 'Syncletter', tag: 'Product Design', href: 'work/syncletter.html',
      blurb: 'Syncletter translates corporate jargon and idioms — helping users understand what a message means, how urgent it is, and how to reply.',
      role: 'Design, Dev', team: '', time: 'July 2026 – August 2026'
    },
    {
      id: 'nearu', title: 'NearU', tag: 'User Experience', href: 'work/nearu.html',
      blurb: 'How might we build a trusted, hyperlocal buying culture within campus communities, so student makers can be discovered by the buyers right around them instead of scattered, informal channels?',
      role: 'Design, Prototyping, Research', team: 'Siddhi Bhavya, Ridhi Lakhina', time: 'May 2026 – October 2026'
    },
    {
      id: 'ncfe', title: 'NCFE – Redesign', tag: 'Accessibility', href: 'work/ncfe-redesign.html',
      blurb: 'How might we help people with low financial awareness find and trust reliable financial guidance, when it’s currently buried behind poor navigation and no clear starting point?',
      role: 'Design , Prototyping, Research', team: '', time: 'April 2026 – July 2026'
    },
    {
      id: 'driving', title: 'Are they Driving?', tag: 'Data and Narratives', href: 'work/are-they-driving.html',
      blurb: 'What prompts my home, Kalahandi, to have more deaths than injuries from driving accidents?',
      role: 'Design, Research', team: '', time: 'June 2026 – Ongoing'
    }
  ],

  about: {
    lead: 'I am a designer who believes in user centricity, accessibility, and efficiency. I thrive on creating experiences that make lives easier, probing for the best solution.',
    interests: 'Art, apps, games, woodworking, and a chaotic love affair with robotics.',
    outside: 'Outside that… you may find me like a tinker-fairy: I create, read, skateboard, tinker with something new, or probably do photosynthesis like a plant.'
  },

  // Optional: a URL of your own server that answers { message, history, system } with { text }. Leave empty to use only the question bank (js/bank.js).
  chat: { endpoint: '' },

  gameLink: 'https://gd.games/instant-builds/b57704dd-fddb-4052-9150-03ed6a9b4f2b?authuser=0',   // "Cross the pond" — the frog and its caption on Side Quests

  sideQuests: [
    'Maybe stop focusing?', 'Album of weird sounds', 'Cross the pond (game)',
    'I once modelled for Paradyes', 'Abstract paintings?', 'Clicking pictures in VR',
    'I fried my brain', 'Baskets are my favourite', 'Sword(?)', 'El Gatto'
  ]
};
