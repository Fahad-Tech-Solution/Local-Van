# Login Page Setup Guide

## ✅ Font Family Updated

The font family has been updated to **Inter** (matching shadcn/ui demo):
- ✅ Added Google Fonts link in `index.html`
- ✅ Updated `index.css` to use Inter font family
- ✅ Updated `tailwind.config.js` to set Inter as default sans font

## 📍 Where to Add Your Login Page Code

### 1. Login Page Component
**File Location:** `client/src/pages/Login.tsx`

A placeholder file has been created for you. Replace the content with your login page code.

**Current file structure:**
```
client/src/pages/
├── Home.tsx
└── Login.tsx  ← Add your login code here
```

### 2. Add Route to App.tsx
**File Location:** `client/src/App.tsx`

Add the login route to your routes. Update the file like this:

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import Home from './pages/Home'
import Login from './pages/Login'  // ← Import your Login component
import AdminDashboard from './features/admin/AdminDashboard'
import CustomerDashboard from './features/customer/CustomerDashboard'
import DriverDashboard from './features/driver/DriverDashboard'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />  {/* ← Add this route */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/driver" element={<DriverDashboard />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
```

### 3. Available Components for Login Page

You can use these shadcn/ui components that are already installed:

- ✅ **Button** - `@/components/ui/button`
- ✅ **Input** - `@/components/ui/input`
- ✅ **Label** - `@/components/ui/label`
- ✅ **Card** - `@/components/ui/card`
- ✅ **Dialog** - `@/components/ui/dialog`

### 4. Authentication Hook

Use the `useAuth` hook for login functionality:

```tsx
import { useAuth } from '@/hooks/useAuth'

// In your component:
const { login, isLoggingIn } = useAuth()

// Call login with credentials:
login({ email: 'admin@local-van.com', password: 'admin' })
```

### 5. Example Login Page Structure

Here's a basic structure you can follow:

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoggingIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Your login logic here
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            {/* Your form fields here */}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 6. Routes Summary

After adding the login route, your routes will be:
- `/` - Home page
- `/login` - Login page (add your code here)
- `/admin` - Admin dashboard
- `/customer` - Customer dashboard
- `/driver` - Driver dashboard

## 🎨 Styling

The Inter font is now applied globally, so all text will automatically use Inter font family matching the shadcn/ui demo.

## 📝 Next Steps

1. Open `client/src/pages/Login.tsx`
2. Add your login form code
3. Update `client/src/App.tsx` to add the `/login` route
4. Test the login functionality

Good luck! 🚀

