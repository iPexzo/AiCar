# Car AI Backend

A Node.js/Express backend API for the Car AI Assistant application, built with TypeScript and MongoDB.

## Features

- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **Car Analysis**: Store and manage car problem analysis requests
- **File Upload**: Multer middleware for image uploads
- **Security**: Helmet, CORS, rate limiting, and input validation
- **Database**: MongoDB with Mongoose ODM
- **TypeScript**: Full TypeScript support with strict type checking

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB
- **ORM**: Mongoose
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer
- **Validation**: express-validator
- **Security**: Helmet, CORS, rate limiting

## Project Structure

```
BE/
├── src/
│   ├── config/
│   │   └── database.ts          # MongoDB connection
│   ├── models/
│   │   ├── User.ts             # User model
│   │   └── CarAnalysis.ts      # Car analysis model
│   ├── middleware/
│   │   ├── auth.ts             # JWT authentication
│   │   └── upload.ts           # File upload handling
│   ├── routes/
│   │   ├── auth.ts             # Authentication routes
│   │   └── carAnalysis.ts      # Car analysis routes
│   └── server.ts               # Main server file
├── uploads/                    # File upload directory
├── dist/                       # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd CarAi/BE
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the BE directory:

   ```env
   # Server Configuration
   PORT=8001
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/car_ai_db

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d

   # File Upload Configuration
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=./uploads

   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

## Development

### Available Scripts

- **Build**: `npm run build` - Compile TypeScript to JavaScript
- **Start**: `npm start` - Run the compiled server
- **Dev**: `npm run dev` - Run with nodemon for development

### Development Server

```bash
npm run dev
```

The server will start on `http://localhost:8001`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Car Analysis

- `GET /api/analyses` - Get all analyses for authenticated user
- `GET /api/analyses/:id` - Get specific analysis
- `POST /api/analyses` - Create new analysis (with file upload)
- `PATCH /api/analyses/:id/status` - Update analysis status (admin only)
- `DELETE /api/analyses/:id` - Delete analysis

### Health Check

- `GET /health` - Server health status

## Database Models

### User Model

- `username` (unique)
- `email` (unique)
- `password` (hashed)
- `role` (user/admin)
- `isActive`
- `createdAt`, `updatedAt`

### Car Analysis Model

- `userId` (reference to User)
- `carDetails` (brand, model, year, engineType, transmission, mileage)
- `problemDescription`
- `images` (array of file paths)
- `aiAnalysis` (diagnosis, recommendations, severity, estimatedCost)
- `status` (pending/analyzed/completed)
- `createdAt`, `updatedAt`

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: express-validator for request validation
- **Rate Limiting**: Prevents abuse
- **CORS**: Configurable cross-origin requests
- **Helmet**: Security headers
- **File Upload Security**: File type and size validation

## Error Handling

- Global error handler for unhandled exceptions
- Validation error responses
- Proper HTTP status codes
- Development vs production error details

## File Upload

- Supports multiple image uploads (max 5 files)
- File size limit: 10MB per file
- Only image files allowed
- Files stored in `uploads/` directory
- Static file serving for uploaded images

## Contributing

1. Follow TypeScript best practices
2. Use proper error handling
3. Add input validation for all endpoints
4. Test your changes thoroughly
5. Update documentation as needed

## License

MIT License
