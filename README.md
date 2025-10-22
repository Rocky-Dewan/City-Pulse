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

| **Challenge**                                                      | **Best Practice / Optimal Solution (Secure + Scalable)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Connecting to MongoDB Atlas without a password (Google signup)** | ✅ **Use OAuth-based authentication + dynamic DB credentials:**  <br>• Never hardcode credentials. Instead, store MongoDB URI and secrets in environment variables (`.env` + `process.env.MONGO_URI`).  <br>• Use **MongoDB Atlas App Services / IAM + access tokens** to connect securely for each environment (dev, staging, prod).  <br>• For users signed in via Google, you don’t need to store DB credentials per user — just handle authentication through **JWTs (with short expiry)** and authorize via backend.  <br>• Example: <br>`mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })` |
| **Geolocation permission issues**                                  | ✅ **Graceful degradation with backend-driven filtering:**  <br>• If user denies geolocation, backend returns **general data filtered by region** or **paginated list sorted by popularity/time**.  <br>• Always request location only when necessary and explain why (improves user trust).  <br>• Optionally, use **IP-based geolocation fallback (via middleware like `geoip-lite`)** on the backend.  <br>• Ensure that sensitive coordinates are not stored or exposed publicly.                                                                                                                                                        |
| **Role-based route restriction**                                   | ✅ **Centralized Auth + Role Enforcement (Backend + Frontend):**  <br>• Use **JWTs with role claims** (e.g., `{ id, email, role: 'admin' }`).  <br>• Create a **middleware** in Express like `authorizeRoles('admin', 'moderator')` that checks `req.user.role`.  <br>• On React, use a `ProtectedRoute` that verifies token validity via API (never rely solely on frontend).  <br>• Example backend snippet:  `js  const authorizeRoles = (...roles) => (req, res, next) => { if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' }); next(); };`                                                       |
| **Handling file uploads in React + Express**                       | ✅ **Use secure, scalable file storage + validation:**  <br>• Don’t store files locally — use **Cloud Storage (AWS S3, Google Cloud Storage, or Cloudinary)**.  <br>• Validate file types and sizes in both backend and frontend.  <br>• Use **presigned URLs** to upload directly from frontend (skips sending through your server, reduces load).  <br>• Sanitize filenames and store references (URLs) in MongoDB.  <br>• Backend sample:  `js const s3 = new AWS.S3(); const url = s3.getSignedUrl('putObject', { Bucket: 'my-bucket', Key: fileName, Expires: 60 });`                                                                   |
| **Efficient filtering of nearby reports**                          | ✅ **Use geospatial indexing (MongoDB GeoJSON + `$geoNear`):**  <br>• Instead of doing distance calculations (like Haversine) on the frontend, **store coordinates as GeoJSON** (`{ type: "Point", coordinates: [lng, lat] }`).  <br>• Create an index: `db.reports.createIndex({ location: "2dsphere" })`.  <br>• Query:  `js Report.find({ location: { $near: { $geometry: { type: "Point", coordinates: [lng, lat] }, $maxDistance: 5000 } } });`  <br>• This offloads computation to MongoDB’s optimized C++ engine — much faster and scalable.  <br>• Combine with pagination or caching (Redis) if dataset grows large.                |


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

-git clone https://github.com/Rocky-Dewan/City-Pulse.git

-cd citypulse

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





