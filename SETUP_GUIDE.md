# SETUP AND TESTING GUIDE

## Quick Start

### 1. Start the Server

```bash
cd server
npm run dev
```

Server runs on `http://localhost:5000`

### 2. Start the Client

```bash
cd client
npm run dev
```

Client runs on `http://localhost:5173` (or as configured)

### 3. Initialize Database

```bash
cd server
npm run seed
```

This creates:

- 6 test users (2 per department: 1 HOD + 1 Volunteer)
- **NO dummy students** (start fresh with file uploads)

---

## Testing Workflow

### Step 1: HOD Login & Upload Students

1. Open client at `http://localhost:5173`
2. Click **"HOD Login"** → Login with:
   - Username: `admin`
   - Password: `admin123`
3. Click **"Upload"** in navigation
4. Download sample file or create your own CSV:

**Sample CSV (save as `students.csv`):**

```
hallTicketNumber,name,rank,department,studentPhone,parentPhone,email,category,gender
00001,Ramesh Kumar,1234,CSE,9876543210,9876543211,ramesh@student.edu,OC,Male
00002,Priya Sharma,2345,CSE,9876543220,9876543221,priya@student.edu,BC-A,Female
00003,Arun Patel,3456,AIML,9876543230,9876543231,arun@student.edu,OC,Male
00004,Neha Singh,4567,AIML,9876543240,9876543241,neha@student.edu,SC,Female
00005,Vikram Reddy,5678,CIC,9876543250,9876543251,vikram@student.edu,OC,Male
```

5. **Drag & drop** or **click to browse** and select `students.csv`
6. Click **"Upload"**
7. See success message with count of inserted students

### Step 2: Volunteer Views & Manages Students

1. **Logout** from HOD (click profile → Logout)
2. Click **"Volunteer Login"** → Login with:
   - Username: `volunteer`
   - Password: `vol123`
3. Click **"Students"** in navigation
4. See all CSE students uploaded by HOD
5. **Click on any student** to view details
6. **Update admission status:**
   - Toggle "Self Reported" ✓
   - Toggle "Documents Submitted" ✓
   - Toggle "Form Filled" ✓
   - Add remarks and save
7. See audit log showing all changes

### Step 3: Multiple Departments

Test with other departments:

**AIML Volunteer:**

- Username: `volunteer_aiml`
- Password: `vol123`
- Should see only AIML students

**CIC HOD:**

- Username: `hod_cic`
- Password: `hod123`
- Can upload CIC students

---

## File Upload Formats Supported

### CSV

```csv
hallTicketNumber,name,rank,department,studentPhone,parentPhone,email,category,gender
```

### XLSX

Same columns as CSV, first row = headers

### PDF

Table in PDF with columns:

- hallTicketNumber | name | rank | department | studentPhone | parentPhone | email | category | gender

---

## API Testing (Using cURL or Postman)

### 1. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Response:** Contains JWT token

### 2. Get Students (Use token from login)

```bash
curl -X GET http://localhost:5000/api/students \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Upload File (HOD only)

```bash
curl -X POST http://localhost:5000/api/students/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@students.csv"
```

### 4. Update Student Status

```bash
curl -X PUT http://localhost:5000/api/students/STUDENT_ID/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "selfReported": true,
    "documentsSubmitted": false,
    "formFilled": false,
    "remarks": "Pending document submission"
  }'
```

---

## Access Control Summary

| Feature               | HOD | Volunteer          |
| --------------------- | --- | ------------------ |
| Login                 | ✅  | ✅                 |
| View Students         | ✅  | ✅ (own dept only) |
| Upload Files          | ✅  | ❌                 |
| Update Student Status | ✅  | ✅                 |
| Delete Students       | ✅  | ❌                 |
| View Dashboard        | ✅  | ✅                 |

---

## Troubleshooting

### Upload fails with "Only xlsx, csv, pdf allowed"

- Check file extension
- Ensure MIME type matches

### Students not showing for Volunteer

- Verify volunteer department matches student department
- Check student has `isActive = true`

### Login fails

- Run `npm run seed` to create users
- Check username is lowercase

### Real-time updates not working

- Ensure Socket.IO is connected
- Check browser console for errors

---

## Database Structure

### Collections Created:

- `users` - HOD and Volunteer accounts (6 by default)
- `students` - Student records (created via uploads)
- `auditlogs` - All changes tracked

### No Dummy Student Data

- Database starts clean (only users)
- Students only created via HOD file uploads
- Ready for production use

---

## Next Steps

1. ✅ Upload test CSV file with students
2. ✅ Login as volunteer and manage students
3. ✅ Test updating student statuses
4. ✅ Verify audit logs show all changes
5. ✅ Test with different departments
6. ✅ Export data or create reports as needed

Happy testing! 🎉
