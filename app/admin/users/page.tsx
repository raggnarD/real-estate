'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
    email: string
    name: string
    first_login: string
    last_login: string
    login_count: number
    api_calls: number
}

export default function AdminUsersPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (status === 'loading') return

        if (!session || session.user?.email !== 'james.kocher@gmail.com') {
            router.push('/')
            return
        }

        // Fetch users
        fetch('/api/admin/users')
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setError(data.error)
                } else {
                    setUsers(data.users || [])
                }
                setLoading(false)
            })
            .catch(err => {
                setError(err.message)
                setLoading(false)
            })
    }, [session, status, router])

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        )
    }

    if (!session || session.user?.email !== 'james.kocher@gmail.com') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl text-red-600">Access Denied</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">User Analytics</h1>
                    <p className="mt-2 text-sm text-gray-600">
                        Track sign-ins and API usage across the platform
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-800">{error}</p>
                    </div>
                )}

                <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-300">
                    <table className="min-w-full border-collapse">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-r border-gray-300">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-r border-gray-300">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-r border-gray-300">
                                    First Login
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-r border-gray-300">
                                    Last Login
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-r border-gray-300">
                                    Login Count
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b-2 border-gray-300">
                                    API Calls
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 border border-gray-300">
                                        No users tracked yet
                                    </td>
                                </tr>
                            ) : (
                                users.map((user, index) => (
                                    <tr key={user.email} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b border-r border-gray-300">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b border-r border-gray-300">
                                            {user.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b border-r border-gray-300">
                                            {new Date(user.first_login).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b border-r border-gray-300">
                                            {new Date(user.last_login).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b border-r border-gray-300 text-center">
                                            {user.login_count}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 border-b border-gray-300 text-center">
                                            {user.api_calls}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 text-sm text-gray-500">
                    Total Users: {users.length}
                </div>
            </div>
        </div>
    )
}
