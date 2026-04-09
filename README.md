# Smart Meet Pro - Video Conferencing Platform

A full-stack MERN (MongoDB, Express.js, React.js, Node.js) video conferencing and real-time chat application similar to Zoom/Google Meet.

## Features

### Authentication
- User registration and login system
- JWT (JSON Web Token) authentication
- Password hashing with bcrypt
- Protected private routes
- Secure logout functionality

### Video Conferencing
- WebRTC-based video calling
- Real-time video/audio communication
- Screen sharing capability
- Camera and microphone controls
- Multiple participants support
- Grid layout for video streams

### Real-time Chat
- Socket.io powered messaging
- Instant message delivery
- Chat history with timestamps
- Participant list
- Message notifications

### Meeting Management
- Create meeting rooms with unique IDs
- Join meetings using Room ID
- Meeting dashboard
- Participant management
- Meeting history

### Modern UI/UX
- Responsive design with Tailwind CSS
- Modern, clean interface
- Loading states and error handling
- Mobile-friendly design
- Smooth animations and transitions

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React.js** - UI framework
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Socket.io Client** - Real-time client
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-meet-pro
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment Setup**
   
   In the `server` directory, create a `.env` file:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/smart-meet-pro
   JWT_SECRET=your_jwt_secret_key_here_change_in_production
   NODE_ENV=development
   ```

5. **Start MongoDB**
   - For local MongoDB: `mongod`
   - Or use MongoDB Atlas and update the `MONGODB_URI` in `.env`

## Running the Application

### Start Backend Server
```bash
cd server
npm start
# For development with auto-reload
npm run dev
```

### Start Frontend Development Server
```bash
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Usage

1. **Register a new account** or login with existing credentials
2. **Create a meeting** from the dashboard or join using a Room ID
3. **Start video call** with camera and microphone controls
4. **Chat with participants** in real-time during meetings
5. **Share your screen** for presentations
6. **Manage participants** and meeting settings

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Meetings
- `POST /api/meeting/create` - Create new meeting
- `POST /api/meeting/join` - Join meeting by Room ID
- `GET /api/meeting/:roomId` - Get meeting details
- `GET /api/meeting/user/meetings` - Get user's meetings
- `POST /api/meeting/:roomId/leave` - Leave meeting
- `POST /api/meeting/:roomId/end` - End meeting (host only)

## Socket Events

### Client to Server
- `join-room` - Join a meeting room
- `leave-room` - Leave a meeting room
- `send-message` - Send chat message
- `offer` - WebRTC offer
- `answer` - WebRTC answer
- `ice-candidate` - WebRTC ICE candidate
- `toggle-video` - Toggle video on/off
- `toggle-audio` - Toggle audio on/off

### Server to Client
- `new-message` - Receive chat message
- `user-joined` - User joined meeting
- `user-left` - User left meeting
- `room-users` - Updated participant list
- `offer` - WebRTC offer
- `answer` - WebRTC answer
- `ice-candidate` - WebRTC ICE candidate
- `error` - Error message

## Project Structure

```
smart-meet-pro/
client/
  public/
    index.html
  src/
    components/
      Navbar.js
      ProtectedRoute.js
    context/
      AuthContext.js
      SocketContext.js
    pages/
      Login.js
      Register.js
      Dashboard.js
      VideoCall.js
      Chat.js
    App.js
    index.js
    index.css
  package.json
  tailwind.config.js
  postcss.config.js
server/
  middleware/
    auth.js
  models/
    User.js
    Meeting.js
  routes/
    auth.js
    meeting.js
    chat.js
  .env
  package.json
  server.js
README.md
```

## Deployment

### Frontend (Vercel/Netlify)
1. Build the frontend: `cd client && npm run build`
2. Deploy the `build` folder to Vercel or Netlify
3. Update the `proxy` in package.json if needed

### Backend (Render/Railway)
1. Deploy the server folder to Render or Railway
2. Set environment variables in the deployment platform
3. Update MongoDB connection string for production

### Database (MongoDB Atlas)
1. Create a free MongoDB Atlas cluster
2. Add your deployment IP to the whitelist
3. Update the `MONGODB_URI` in environment variables

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the existing issues
2. Create a new issue with detailed description
3. Include steps to reproduce any bugs

## Future Enhancements

- [ ] Recording meetings
- [ ] Virtual backgrounds
- [ ] Breakout rooms
- [ ] Meeting scheduling
- [ ] File sharing in chat
- [ ] Reactions and emojis
- [ ] Advanced moderation tools
- [ ] Integration with calendar apps
- [ ] Mobile app development

---

**Smart Meet Pro** - Professional video conferencing made simple.
