# Super Admin Dashboard

## Overview
The Super Admin Dashboard is a comprehensive management interface for LearnBox administrators with full platform access. It provides tools to manage colleges, users, and monitor platform statistics.

## Features

### 1. Dashboard Overview
- **Statistics Cards**: View real-time platform metrics
  - Total Colleges
  - Total Users
  - Total Students
  - Total Admins
  
- **Recent Activity**: Quick view of recently added colleges and users

### 2. College Management
- **View All Colleges**: Browse all colleges in the platform with detailed information
- **Create New College**: Add new educational institutions to the platform
  - College Name (required)
  - College Code (required, auto-uppercase)
  - Location (optional)
  - Description (optional)
  - Active Status toggle
  
- **Edit College**: Update existing college information
- **Deactivate College**: Soft-delete colleges (can be reactivated)
- **College Statistics**: View user count, resources, modules, and MCQs per college

### 3. User Management
- **View All Users**: Browse all platform users
- **Search Users**: Filter by username, email, or name
- **Filter by Role**: 
  - All Roles
  - Students
  - College Admins
  - Super Admins
  
- **Delete User**: Remove users from the platform
- **User Details**: View user information including:
  - Username
  - Email
  - Full Name
  - Role
  - Associated College

## Access

### Route
`/superadmin`

### Authentication
Only users with the `SUPER_ADMIN` role can access this dashboard. Users are automatically redirected based on their role when logging in.

## Technology Stack

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Sonner** for toast notifications

### API Endpoints Used

#### College Management
- `GET /api/colleges` - Get all colleges
- `GET /api/colleges/:id` - Get single college
- `POST /api/colleges` - Create new college
- `PUT /api/colleges/:id` - Update college
- `DELETE /api/colleges/:id` - Delete/deactivate college

#### User Management
- `GET /api/users` - Get all users
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Navigation

The dashboard features a sidebar with three main tabs:

1. **Overview**: Platform statistics and recent activity
2. **Colleges**: Full college management interface
3. **Users**: User management and role administration

## UI Components

### College Card
Displays college information with:
- College name and code
- Location
- Active/Inactive status badge
- User and resource counts
- Edit and delete actions

### User Table
Displays user information in a sortable table with:
- Username, Email, and Full Name
- Role badges with color coding
- Associated college
- Delete action button

### College Modal
A form dialog for creating and editing colleges with:
- Input validation
- Real-time code formatting (auto-uppercase)
- Active status toggle
- Create/Update confirmation

## Styling

The dashboard uses a cohesive color scheme:
- **Primary Color**: `#7C9E9E` (Teal/Sage)
- **Success**: Green
- **Warning**: Orange
- **Error**: Red
- **Info**: Blue/Purple

Role-specific badges:
- **Super Admin**: Purple
- **College Admin**: Blue
- **Student**: Green

## State Management

The dashboard manages the following states:
- Active tab selection
- Colleges list
- Users list
- Platform statistics
- Loading state
- Modal visibility
- Form data
- Filters and search terms

## Error Handling

- Toast notifications for all API operations
- Confirmation dialogs for destructive actions
- Graceful error messages
- Loading states during data fetching

## Future Enhancements

Potential improvements:
- Bulk user import/export
- Advanced analytics dashboard
- User role modification
- College admin assignment
- Email notifications
- Audit logs
- API usage statistics
- System health monitoring
- Backup and restore functionality

## Usage Guide

### Creating a New College

1. Navigate to the "Colleges" tab
2. Click "Add New College" button
3. Fill in the required fields:
   - College Name
   - College Code
4. Optionally add location and description
5. Ensure "Active" is checked
6. Click "Create"

### Managing Users

1. Navigate to the "Users" tab
2. Use the search bar to find specific users
3. Filter by role using the dropdown
4. Click the trash icon to delete a user
5. Confirm the deletion in the popup dialog

### Editing a College

1. Navigate to the "Colleges" tab
2. Find the college you want to edit
3. Click the "Edit" button on the college card
4. Modify the fields as needed
5. Click "Update"

## Security Considerations

- All API calls require authentication
- Role-based access control enforced on backend
- Destructive actions require confirmation
- Soft-delete for data preservation
- No password exposure in UI

## Support

For issues or questions about the Super Admin Dashboard, please contact the development team or refer to the main README documentation.
