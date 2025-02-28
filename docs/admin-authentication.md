# Admin Authentication System

This document describes the authentication system for the MetaBeast-WebAPI admin interface.

## Overview

The admin authentication system provides secure access to the admin interface, ensuring that only authorized users with admin privileges can access and manage the application's administrative features.

## Features

- **Login Interface**: A secure login page for admin users
- **JWT Authentication**: Uses JSON Web Tokens for secure authentication
- **Role-Based Access Control**: Only users with admin permission level can access admin features
- **Session Management**: Maintains user sessions with token expiration and refresh
- **Secure Logout**: Properly terminates user sessions

## Components

### 1. Authentication Script (`/public/admin/js/auth.js`)

A shared JavaScript file that provides authentication functions for all admin pages:

- `checkAuth()`: Checks if the user is logged in
- `validateToken()`: Validates the JWT token with the server
- `initAdminPage()`: Initializes admin pages with authentication checks
- `authFetch()`: A wrapper around fetch that adds authentication headers
- `addAuthHeader()`: Adds authentication headers to fetch options

### 2. Admin Middleware (`/web3/middleware/admin.middleware.js`)

Server-side middleware that protects admin routes:

- `isAdmin`: Checks if the user has admin privileges

### 3. Login Page (`/public/admin/login.html`)

The login interface that authenticates admin users:

- Validates user credentials
- Stores JWT token in localStorage
- Redirects to admin dashboard on successful login

### 4. Admin Dashboard (`/public/admin/index.html`)

The main admin interface that:

- Checks authentication on page load
- Displays user information
- Provides logout functionality
- Shows MetaMask connection statistics

### 5. MetaMask Admin Page (`/public/admin/metamask/index.html` and `app.js`)

The MetaMask connection management interface that:

- Authenticates users before showing content
- Uses the shared authentication script for API requests
- Manages MetaMask connections and removal requests

## User Creation

Admin users can be created using the `scripts/create-admin.js` script:

```bash
node scripts/create-admin.js
```

This script creates an admin user with the following default credentials:
- Username: admin
- Password: admin123

**Important**: Change the default password in production!

## Authentication Flow

1. User navigates to the admin login page
2. User enters credentials
3. Credentials are validated against the database
4. On successful login, a JWT token is generated and stored
5. User is redirected to the admin dashboard
6. All subsequent API requests include the JWT token in the Authorization header
7. Server validates the token and checks admin privileges for each request

## Security Considerations

- JWT tokens are stored in localStorage and included in all API requests
- Tokens expire after a configurable time period
- Admin routes are protected by server-side middleware
- Permission levels ensure only authorized users can access admin features
- Passwords are hashed using SHA-512 with a secret key
