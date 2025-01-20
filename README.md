# EduProSphere
# live link [EduProSphere](https://eduprosphere-fa7b8.web.app/)
# EduManage Server

## Overview
The server-side component of **EduManage**, built using Node.js and Express, serves as the backbone for the application. It handles API requests, manages authentication, processes payments, and connects to the MongoDB database for seamless and efficient backend operations.

## Features
- **API Endpoints**: RESTful API for managing users, classes, and resources.
- **Authentication**: Secure user authentication using JSON Web Tokens (JWT).
- **Database Management**: Integration with MongoDB for robust data storage.
- **Payment Processing**: Stripe API for handling secure payments.
- **Environment Configuration**: Managed via `dotenv` for secure and dynamic configuration.

## Prerequisites
- **Node.js**: v16 or later
- **MongoDB**: Local or cloud-based instance
- **Stripe API Key**

## Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the server directory:
   ```bash
   cd server
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory with the following environment variables:
   ```env
   PORT=<your-port>
   MONGODB_URI=<your-mongodb-uri>
   JWT_SECRET=<your-jwt-secret>
   STRIPE_SECRET_KEY=<your-stripe-secret-key>
   ```

## Usage
### Start the Server
To start the server in production mode:
```bash
npm start
```

The server will run on the specified `PORT` (default: 3000).

## Project Structure
```
.
├── index.js          # Entry point of the application
├── config/           # Configuration files
├── routes/           # API route definitions
├── controllers/      # Request handlers
├── middlewares/      # Custom middleware functions
├── models/           # Database models
└── utils/            # Utility functions
```

## Dependencies
Key dependencies used in the project:
- **Express**: Web framework for building APIs.
- **MongoDB**: Database for storing application data.
- **dotenv**: Environment variable management.
- **cors**: Cross-origin resource sharing middleware.
- **jsonwebtoken**: JWT-based authentication.
- **stripe**: Payment processing.

## API Endpoints
### Authentication
- **POST /api/auth/register**: Register a new user.
- **POST /api/auth/login**: Log in a user and generate a JWT.

### Classes
- **GET /api/classes**: Fetch all classes.
- **POST /api/classes**: Create a new class (admin only).

### Payments
- **POST /api/payments/create**: Create a payment session with Stripe.

### Users
- **GET /api/users**: Fetch all users (admin only).

## Contribution
We welcome contributions! To contribute:
1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your feature description"
   ```
4. Push your branch and create a pull request.

## License
This project is licensed under the ISC License. See the `LICENSE` file for more details.

## Acknowledgments
- The Node.js and Express.js communities for their exceptional tools and support.
- Stripe for providing secure payment APIs.
- MongoDB for reliable database solutions.

---

Start your journey with EduManage Server to power efficient and secure educational management solutions!
