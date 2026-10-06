# SecretSaathi

> **Talk. Assess. Get Support.**  
> A non-diagnostic student well-being self-assessment and support web application.

---

## 1. Project Overview

**SecretSaathi** is an approachable, confidential student well-being web platform designed to assist students in reflecting on common stress indicators, understanding their current state through a transparent non-diagnostic scoring scale, exploring guided conversational support, and locating campus and national crisis resources.

### Key Highlights
- **Non-Diagnostic:** Strictly provides self-reflection indicators (Low, Moderate, High) and never claims to diagnose clinical depression, anxiety, or medical disorders.
- **Privacy-First (Zero Registration):** Does not collect names, student IDs, emails, phone numbers, or passwords.
- **Predefined Rule-Based Chatbot:** Built in Vanilla JavaScript without third-party AI APIs or black-box models.
- **Transparent JSON Architecture:** All questions, scoring thresholds, and support resources are stored in structured JSON files.

---

## 2. Project Team

- **Main Developer:** Vibhash Kumar Giri
- **Other Developers:** Ankit Kumar, Samik, Krishna Mahajan

---

## 3. Technology Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend:** Node.js, Express.js
- **Data Persistence:** JSON files (`questions.json`, `resources.json`, `config.json`)
- **API Protocol:** REST (HTTP GET, POST) with `fetch()`
- **No external frameworks:** No React, Next.js, Vue, Angular, Tailwind, Bootstrap, MongoDB, or Firebase.

---

## 4. Folder Structure

```
SecretSaathi/
│
├── server.js               # Express.js REST server & static file host
├── package.json            # Node.js project manifest & start scripts
├── README.md               # Complete project documentation
│
├── data/
│   ├── config.json         # Scoring categories, thresholds, response scale
│   ├── questions.json      # 10 self-assessment questions & areas
│   └── resources.json      # Verified national helplines & campus demo resources
│
└── public/
    ├── index.html          # Landing page (hero, flow, features)
    ├── assessment.html     # Dynamic 10-question assessment runner
    ├── chatbot.html        # Predefined rule-based support chatbot
    ├── results.html        # Personalized indicator report & suggestions
    ├── resources.html      # Searchable & filterable resource directory
    ├── about.html          # Origin story, challenge, solution & team
    ├── privacy.html        # Non-diagnostic disclaimer & data privacy policy
    │
    ├── css/
    │   └── style.css       # Clean, calm, responsive design system
    │
    └── js/
        ├── main.js         # Mobile nav, active links, global utilities
        ├── assessment.js   # Assessment runner, validation & API submission
        ├── chatbot.js      # Rule-based conversation engine & keyword matcher
        ├── results.js      # Indicator badges, suggestions & resource links
        └── resources.js    # Search, category filter & resource card rendering
```

---

## 5. Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.0.0 or higher recommended)
- [npm](https://www.npmjs.com/) (installed automatically with Node.js)

### Step 1: Install Dependencies
Open your terminal in the project root directory and run:
```bash
npm install
```

### Step 2: Environment Configuration
Create your local environment file by copying `.env.example`:
```bash
cp .env.example .env
```
Default parameters in `.env`:
- `PORT=3000` (Server listening port)
- `NODE_ENV=development`
- `CORS_ORIGIN=*` (Universal cross-origin access for dev servers)
- `API_BASE_URL=http://localhost:3000`

### Step 3: Start the Application
Run the standard Node start script:
```bash
npm start
```
or for development:
```bash
npm run dev
```

### Step 4: Open in Browser
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 6. REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check endpoint returning service status, uptime, and port. |
| `GET` | `/api/config` | Retrieves application metadata, response options, and scoring thresholds. |
| `GET` | `/api/questions` | Retrieves the list of 10 student well-being questions and response scale. |
| `GET` | `/api/resources` | Returns support resources. Accepts optional query parameters: `?category=...` and `?search=...`. |
| `GET` | `/api/resources/:id` | Returns single resource details matching the specified ID. |
| `POST` | `/api/assessment` | Calculates total assessment score, assigns indicator category, suggestions, and matched resources. |
| `POST` | `/api/score` | Alias endpoint for `/api/assessment`. |
| `GET` | `/api/chat/options` | Returns initial chatbot greeting and available topic prompts. |
| `POST` | `/api/chat` | Handles user messages, topic selections, crisis safety routing, and suggestions. |

### Example POST `/api/score` Request:
```json
{
  "answers": [
    { "questionId": 1, "score": 2 },
    { "questionId": 2, "score": 1 },
    { "questionId": 3, "score": 3 },
    { "questionId": 4, "score": 2 },
    { "questionId": 5, "score": 1 },
    { "questionId": 6, "score": 2 },
    { "questionId": 7, "score": 0 },
    { "questionId": 8, "score": 1 },
    { "questionId": 9, "score": 2 },
    { "questionId": 10, "score": 2 }
  ]
}
```

### Example Response:
```json
{
  "success": true,
  "totalScore": 16,
  "maxPossibleScore": 40,
  "answeredCount": 10,
  "category": "Moderate Stress Indicator",
  "tag": "Moderate",
  "badgeClass": "indicator-moderate",
  "summary": "Your responses suggest recurring stress that may be affecting your focus, energy, or peace of mind.",
  "suggestions": [
    "Take regular study breaks (such as 5-10 minutes every hour) to avoid cognitive fatigue.",
    "Maintain a consistent sleep routine aiming for 7-8 hours of quality rest.",
    "Talk to someone you trust—a friend, family member, or mentor—about what you are feeling."
  ],
  "recommendedResources": [ ... ],
  "disclaimer": "SecretSaathi is a non-diagnostic self-reflection tool..."
}
```

---

## 7. How Assessment Scoring Works

1. **Response Values:**
   - **Never:** 0 points
   - **Rarely:** 1 point
   - **Sometimes:** 2 points
   - **Often:** 3 points
   - **Very Often:** 4 points

2. **Total Score:**
   - 10 questions &times; max 4 points = 40 possible points.

3. **Configurable Thresholds (defined in `data/config.json`):**
   - **Low Stress Indicator:** 0 – 12 points
   - **Moderate Stress Indicator:** 13 – 24 points
   - **High Stress Indicator:** 25 – 40 points

4. **Category Output:**
   - Maps to non-diagnostic guidance, actionable tips, and targeted support resources (e.g. peer mentorship for Low/Moderate, counselling & emergency helplines for High).

---

## 8. Modifying Questions and Resources Later

### Adding or Editing Questions
Edit [`data/questions.json`](data/questions.json). Each question has this simple format:
```json
{
  "id": 11,
  "category": "New Category Name",
  "question": "Your question text here?",
  "hint": "Helpful guidance or context for the student."
}
```
The frontend automatically retrieves and renders however many questions exist in this file.

### Adding or Updating Support Resources
Edit [`data/resources.json`](data/resources.json). Each resource entry has this structure:
```json
{
  "id": "campus-wellness-desk",
  "name": "Campus Wellness Desk",
  "category": "College Counselling",
  "type": "Campus Support",
  "description": "On-campus student counselling and wellness guidance.",
  "phone": "+91 98765 00000",
  "website": "https://yourcollege.edu/wellness",
  "availability": "Mon - Fri, 9:00 AM - 5:00 PM",
  "location": "Student Centre, Room 201",
  "isDemo": false
}
```
Set `isDemo: false` for official verified helplines or real campus offices.

### Changing Scoring Thresholds
Edit [`data/config.json`](data/config.json) to adjust the `minScore` and `maxScore` ranges, suggestion lists, or category titles.

---

## 9. Non-Diagnostic Disclaimer

> **SecretSaathi is NOT a medical or psychiatric diagnostic service.**  
> It does not provide clinical diagnoses, psychiatric prescriptions, or psychotherapy. Results are generated strictly for self-reflection and general awareness. Anyone experiencing acute emotional distress or severe crisis should contact national emergency services (**112**) or call the 24/7 toll-free Tele-MANAS helpline (**14416**).
