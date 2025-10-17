# 🏙️ CityPulse - Smart City Issue Reporting Platform

CityPulse is a full-stack MERN (MongoDB, Express, React, Node.js) web application that empowers citizens to report local issues (e.g., potholes, broken lights, flooding, etc.) with geolocation and images. Admins can monitor reports, update statuses, and improve city management efficiency.

---


## 🧰 Tech Stack

### 🖥 Frontend
- **React.js** (SPA, Routing)
- **React Router DOM**
- **Tailwind CSS** (for basic styling)
- **Axios** (API communication)
- **Geolocation API** (to fetch user location)

### 🔧 Backend
- **Node.js + Express.js**
- **MongoDB Atlas** (cloud-hosted DB)
- **Mongoose** (ODM for MongoDB)
- **JWT (JSON Web Tokens)** for authentication
- **Multer** for file uploads
- **Bcrypt.js** for password hashing
- **Dotenv** for secure environment config

---

## 📂 Project Structure

citypulse/
├── citypulse-frontend/ # React client
│ └── client/
│ ├── components/
│ ├── pages/
│ └── App.js
│
├── citypulse-backend/ # Node backend
│ ├── controllers/
│ ├── middleware/
│ ├── models/
│ ├── routes/
│ └── server.js




---

## 📸 Key Features

### 👤 Authentication
- Signup/Login using JWT
- Role-based access: **User** and **Admin**
- Protected routes for submitting reports and accessing the admin dashboard

### 📝 Report Management
- Submit reports with title, description, image, and auto-location
- View only **nearby reports** (within 10km radius)
- Upvote issues
- Admin can change status (Pending, In Progress, Resolved)

### 📍 Geolocation
- Uses the browser’s Geolocation API to find user's current position
- Filters reports based on proximity using the **Haversine Formula**

---

## 🧪 Challenges & How We Solved Them

| Challenge | Solution |
|----------|----------|
| Connecting to MongoDB Atlas without a password (Google signup) | Used URI with hardcoded user credentials or added DB users manually |
| Geolocation permission issues | Added fallback to show all reports if denied |
| Role-based route restriction | Built `ProtectedRoute` component and middleware checks |
| Handling file uploads in React + Express | Used `Multer` for backend and `FormData` in frontend |
| Efficient filtering of nearby reports | Implemented Haversine distance calculation on frontend |

---

## 🛡️ Security

- Passwords are hashed using **bcrypt**
- JWT is used for stateless authentication
- Sensitive environment values (DB URI, JWT secret) stored in `.env`

---

## 🔄 APIs Overview

### `POST /api/auth/signup`
- Body: `{ name, email, password }`
- Response: `{ token }`

### `POST /api/auth/login`
- Body: `{ email, password }`
- Response: `{ token }`

### `POST /api/reports`
- Headers: `Authorization: Bearer <token>`
- Body: FormData `{ title, description, category, image }`

### `PUT /api/reports/:id/upvote`
- Upvotes a report

### `PUT /api/reports/:id`
- Admin-only: Updates status

---

## 🌱 How to Run Locally

### 1. Clone the repo

[git clone https://github.com/your-username/citypulse.git](https://github.com/Rocky-Dewan/City-Pulse.git)
cd citypulse

2. Set up Backend
cd citypulse-backend
npm install


Create .env:


MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_strong_secret
PORT=3001

npm start
3. Set up Frontend
cd citypulse-frontend/client
npm install
npm start
The frontend will run at http://localhost:3000, and backend at http://localhost:3001.

📌 Future Improvements
Admin dashboard with stats and charts

Comment system on reports

Push notifications for status updates

Mobile-friendly UI

Google OAuth integration


✨ Author
👨‍💻 Rocky Dewan

📫 dewanrocky250@gmail.com

🌍 Based in Bangladesh

---

Let me know if you want this tailored for a Bengali audience, deployed version, or connected with a mobile app!


