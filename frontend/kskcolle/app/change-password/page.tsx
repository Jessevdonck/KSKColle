import PrivateRoute from '../components/PrivateRoute'
import PasswordChangeForm from './components/PasswordChangeForm'

export default function ChangePasswordPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PrivateRoute>
        <PasswordChangeForm />
      </PrivateRoute>
    </div>
  )
}

