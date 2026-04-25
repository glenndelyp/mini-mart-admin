import Sidebar from './sidebar'
import Header from './header'

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 ml-56">
        <Header />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}