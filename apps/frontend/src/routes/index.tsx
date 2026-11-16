import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
          AdonisJS Monorepo Starter Kit
        </h1>
      </div>
    </div>
  )
}
