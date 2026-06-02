# Smart Admission Tracking & Verification System

A comprehensive system for tracking and managing student admissions with role-based access control for HODs and Volunteers.

## Features

- **HOD Dashboard**: Upload student data via CSV/XLSX/PDF files
- **Volunteer Dashboard**: Track and manage student progress
- **Real-time Updates**: Socket.IO integration for live notifications
- **Audit Logging**: Complete history of all student status changes
- **Department-based Access**: Volunteers can only see students from their department
- **Multi-format Support**: Import student data from Excel, CSV, or PDF files

## Supported Departments

- CSE (Computer Science & Engineering)
- AIML (Artificial Intelligence & Machine Learning)
- CIC (Cyber Intelligence & Computing)

## Project Structure

```
smart-admission-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── context/       # React context (Auth, Theme, etc)
│   │   ├── hooks/         # Custom React hooks
│   │   └── utils/         # Utilities and constants
│   └── package.json
│
└── server/                # Express backend
    ├── controllers/       # Route handlers
    ├── models/            # MongoDB models
    ├── routes/            # API routes
    ├── middleware/        # Express middleware (Auth, RBAC, etc)
    ├── services/          # Business logic
    ├── config/            # Configuration files
    ├── utils/             # Utility functions
    └── package.json
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd smart-admission-system
   ```

2. **Setup Server**

   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   npm install
   npm run seed  # Create test users
   npm run dev   # Start development server
   ```

3. **Setup Client**
   ```bash
   cd ../client
   npm install
   npm run dev   # Start development server
   ```

## Default Test Credentials

### CSE Department

- **HOD**: `admin` / `admin123`
- **Volunteer**: `volunteer` / `vol123`

### AIML Department

- **HOD**: `hod_aiml` / `hod123`
- **Volunteer**: `volunteer_aiml` / `vol123`

### CIC Department

- **HOD**: `hod_cic` / `hod123`
- **Volunteer**: `volunteer_cic` / `vol123`

## Workflow

### 1. HOD Uploads Student Data

1. Login as HOD (e.g., `admin` / `admin123`)
2. Navigate to **Upload** page
3. Select a file in CSV, XLSX, or PDF format
4. View preview of data (first 10 rows)
5. Click **Upload**
6. Receive summary: inserted students, duplicates skipped, errors

### 2. Volunteers Manage Students

1. Login as Volunteer (e.g., `volunteer` / `vol123`)
2. Navigate to **Students** page
3. View all students from your department
4. Search and filter by status, rank, phone, etc
5. Click on a student to view details
6. Update admission status:
   - Mark as "Self Reported"
   - Mark as "Documents Submitted"
   - Mark as "Form Filled"
7. Add remarks as needed

### 3. Tracking & Auditing

- HOD Dashboard shows department statistics and activity
- All student updates are logged with timestamp and user information
- Volunteers can see who made each change via audit logs

## File Upload Format

### Supported Column Names

The system recognizes various column name formats:

**Student Hall Ticket**

- `hallTicketNumber`, `htno`, `hall_ticket_no`, `hall ticket number`

**Name**

- `name`, `student name`, `full_name`

**Rank**

- `rank`, `eamcet rank`, `merit rank`

**Department**

- `department`, `dept`, `branch`

**Phones**

- `studentPhone`, `phone`, `mobile`, `contact`
- `parentPhone`, `parent_phone`, `guardian mobile`

**Email**

- `email`, `email_id`, `student email`

**Category**

- `category`, `caste`, `reservation`

**Gender**

- `gender` (M/Male/Female/F → normalized to Male/Female/Other)

### Example CSV Format

```
hallTicketNumber,name,rank,department,studentPhone,parentPhone,email,category,gender
00001,Ramesh Kumar,1234,CSE,9876543210,9876543211,ramesh@student.edu,OC,Male
00002,Priya Sharma,2345,AIML,9876543220,9876543221,priya@student.edu,BC-A,Female
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Students (All authenticated users)

- `GET /api/students` - List students (paginated, filterable)
- `GET /api/students/:id` - Get student details
- `PUT /api/students/:id/status` - Update student status

### Students (HOD only)

- `POST /api/students/upload` - Upload student file
- `DELETE /api/students/:id` - Delete student

### Dashboard (HOD only)

- `GET /api/dashboard/stats` - Department statistics

### Audit Logs (All authenticated users)

- `GET /api/logs` - View audit logs

## Deployment

### Production Setup

1. Set secure JWT secret in `.env`
2. Update MongoDB URI to production database
3. Set `NODE_ENV=production`
4. Build client: `npm run build`
5. Deploy to hosting service (Vercel, Heroku, AWS, etc)

## Security Notes

- Passwords are hashed using bcryptjs
- JWT tokens expire after 24 hours
- Volunteers can only access their department's data
- All changes are audited and logged
- CORS is configured for specified origins

## Troubleshooting

### Upload fails with "Cannot parse file"

- Ensure file format is supported (CSV, XLSX, PDF)
- Check column headers match expected format
- Ensure all mandatory fields are present

### Students not appearing after upload

- Verify HOD department matches student department in file
- Check for duplicate hall ticket numbers (already uploaded)
- Review upload response for specific errors

### Cannot login as Volunteer

- Run seed script: `npm run seed`
- Verify user exists in database
- Check password is correct

## Support

For issues or questions, please contact the development team.
