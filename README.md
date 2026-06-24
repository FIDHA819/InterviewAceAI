# InterviewAce AI 🚀

AI-powered interview preparation platform that helps users practice technical and HR interviews, receive AI-generated feedback, analyze performance trends, and improve interview skills through personalized recommendations.

## 🌐 Live Demo

Frontend: https://interview-ace-ai-roan.vercel.app

Backend: https://interviewaceai-7rl9.onrender.com

---

## ✨ Features

### 🔐 Authentication

* User Registration & Login
* JWT Authentication
* Protected Routes
* Profile Management
* Password Change Functionality

### 🎤 AI Interview Simulator

* Multiple Interview Categories

  * Frontend
  * Backend
  * Full Stack
  * System Design
  * HR
  * DSA
* Difficulty Levels

  * Easy
  * Medium
  * Hard
* Dynamic Question Generation using AI

### 🤖 AI Feedback System

* Technical Score Analysis
* Communication Score Analysis
* Confidence Score Analysis
* Overall Performance Evaluation
* Personalized Improvement Suggestions

### 📊 Analytics Dashboard

* Interview History Tracking
* Performance Trends
* Category-wise Performance Analysis
* Skill Radar Chart
* Progress Monitoring
* Learning Insights

### 📄 Resume Analysis

* Resume Upload
* Resume Review
* Improvement Suggestions
* ATS Optimization Insights

### 🎯 Job Match System

* Skill Matching
* Career Recommendations
* Improvement Areas Identification

---

## 🛠️ Tech Stack

### Frontend

* React.js
* TypeScript
* Tailwind CSS
* React Router
* React Hook Form
* Recharts
* Axios


### Backend

* Node.js
* Express.js
* TypeScript
* MongoDB
* Mongoose
* JWT Authentication
* Multer

### AI Integration

* GROQ API
* LLaMA Models

### Deployment

* Vercel (Frontend)
* Render (Backend)
* MongoDB Atlas

---

## 📁 Project Structure

```bash
InterviewAceAI/
│
├── frontend/
│   ├── src/
│   │   ├── Components/
│   │   ├── Pages/
│   │   ├── Services/
│   │   ├── Hooks/
│   │   ├── Store/
│   │   ├── Types/
│   │   └── Utils/
│   │
│   └── public/
│
├── backend/
│   ├── Controllers/
│   ├── Routes/
│   ├── Models/
│   ├── Middleware/
│   ├── Services/
│   ├── Utils/
│   └── Config/
│
└── README.md
```

---

## ⚙️ Environment Variables

### Backend (.env)

```env
PORT=5000

MONGODB_URI=your_mongodb_uri

JWT_SECRET=your_jwt_secret

JWT_REFRESH_SECRET=your_refresh_secret

GROQ_API_KEY=your_groq_api_key

CLIENT_URL=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🚀 Installation

### Clone Repository

```bash
git clone https://github.com/FIDHA819/InterviewAceAI.git

cd InterviewAceAI
```

### Backend Setup

```bash
cd backend

npm install

npm run dev
```

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

---

## 📊 Key Modules

### Authentication Module

* Register User
* Login User
* Update Profile
* Change Password

### Interview Module

* Create Interview
* Generate Questions
* Save Answers
* Complete Sessions

### Analytics Module

* Performance Tracking
* Trend Analysis
* Category Statistics
* Skill Mapping

### Resume Module

* Resume Upload
* Resume Parsing
* Resume Feedback

### Job Match Module

* Skill Evaluation
* Recommendation Engine

---

## 🔒 Security Features

* JWT Authentication
* Password Hashing using bcrypt
* Protected API Routes
* CORS Protection
* Environment Variable Management

---

## 📈 Future Enhancements

* Voice-Based Mock Interviews
* Video Interview Analysis
* Real-Time AI Interviewer
* Company-Specific Interview Preparation
* Coding Assessment Platform
* AI Career Coach

---

## 👨‍💻 Author

**FIDHA FATHIMA**

Full Stack Developer | MERN Stack Developer

GitHub: https://github.com/FIDHA819

---

## 📜 License

This project is licensed under the MIT License.
