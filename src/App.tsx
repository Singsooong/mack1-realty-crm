import { RouterProvider } from '@/lib/router'
import { AppLayout } from '@/components/shared/AppLayout'
import { PageRouter } from '@/components/shared/PageRouter'
import { ThemeProvider } from '@/lib/theme'

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider>
        <AppLayout>
          <PageRouter />
        </AppLayout>
      </RouterProvider>
    </ThemeProvider>
  )
}
