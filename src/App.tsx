import { RouterProvider } from '@/lib/router'
import { AppLayout } from '@/components/shared/AppLayout'
import { PageRouter } from '@/components/shared/PageRouter'

export default function App() {
  return (
    <RouterProvider>
      <AppLayout>
        <PageRouter />
      </AppLayout>
    </RouterProvider>
  )
}
