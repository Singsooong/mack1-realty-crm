import { RouterProvider } from '@/lib/router'
import { AppLayout } from '@/components/shared/AppLayout'
import { PageRouter } from '@/components/shared/PageRouter'
import { ThemeProvider } from '@/lib/theme'
import { AuthProvider, ProtectedRoute } from '@/context/AuthContext'
import { Toaster } from 'sonner'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider>
          <ProtectedRoute>
            <AppLayout>
              <PageRouter />
            </AppLayout>
          </ProtectedRoute>
        </RouterProvider>
      </AuthProvider>
      <Toaster richColors position="top-right" />
    </ThemeProvider>
  )
}
