# Jobbee API

Jobbee API is a RESTful backend service built with **Node.js** and **Express.js**, providing job listings and user authentication functionalities.

## 🌟 Features

- User registration and login (JWT authentication)
- Role-based access control (Admin vs User)
- Job listings:
  - Create, update, delete (Admin)
  - Search and apply (Users)
- Secure inputs using middleware like `xss-clean`, `helmet`, `rate-limit`
- File upload support (for resumes)
- API documentation with Postman

## 🛠️ Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB** with **Mongoose**
- **JWT** for authentication
- **Multer** for file uploads
- **xss-clean**, **helmet**, **express-rate-limit** for security

## 🚀 Getting Started

### Prerequisites

- Node.js v14+
- MongoDB (local or Atlas)

### Installation

```bash
git clone https://github.com/yourusername/jobbee-api.git
cd jobbee-api
npm install
```

### Environment Variables

Create a `.env` file in the root directory and add the following:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/jobbee
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Run the Server

```bash
# For development
npm run dev

# For production
npm start
```

## 🧪 API Testing

Use [Postman](https://www.postman.com/) to test routes.

You can create a Postman collection with the following:

```
Title: Jobbee API Collection
Description: Test all endpoints including user, job, and admin routes.
```

## 📁 Project Structure

```
.
├── controllers
├── models
├── routes
├── middleware
├── utils
├── config
├── public
└── app.js / server.js
```

## 🔒 Security Middleware

- `helmet`: Sets secure HTTP headers
- `xss-clean`: Cleans user inputs to prevent XSS
- `express-rate-limit`: Limits repeated requests to public APIs

## 📜 License

This project is licensed under the **MIT License**.

---

### 👤 Author

**Emediong Uyobong Eshiet**  
_Uyo, Nigeria_

---
