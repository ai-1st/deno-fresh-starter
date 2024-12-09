# Sign In / Sign Up Functionality

## Data Structure

### User Object
```typescript
interface User {
    ulid: string;           // ULID
    login: string;     // Unique username
    password: string;   // Encrypted password
}
```

### Session Structure
* Index 0: User ID (ULID)
* Index 1: login

## Implementation Details

### Sign Up Flow
1. User fills in login and password
2. Server validates Username availability
3. Server creates user record
4. Server sets session cookie

### Sign In Flow
1. Client sends login and password as POST request
2. Server verifies credentials
3. Server generates session cookie
4. Server sets user in session

## Routes

### /login
* GET: Renders sign in form
* POST: Handles sign in 

### /signup
* GET: Renders sign up form
* POST: Handles sign up 

