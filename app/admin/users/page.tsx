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

type SortField = 'email' | 'name' | 'first_login' | 'last_login' | 'login_count' | 'api_calls'
type SortDirection = 'asc' | 'desc'

export default function AdminUsersPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [sortField, setSortField] = useState<SortField>('last_login')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

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

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    const sortedUsers = [...users].sort((a, b) => {
        let aVal: any = a[sortField]
        let bVal: any = b[sortField]

        // Handle dates
        if (sortField === 'first_login' || sortField === 'last_login') {
            aVal = new Date(aVal).getTime()
            bVal = new Date(bVal).getTime()
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
        return 0
    })

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) {
            return <span className="text-gray-400 ml-1">⇅</span>
        }
        return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
    }

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-xl font-medium text-gray-700">Loading...</div>
            </div>
        )
    }

    if (!session || session.user?.email !== 'james.kocher@gmail.com') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-xl font-semibold text-red-600">Access Denied</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">User Analytics</h1>
                    <p className="mt-2 text-gray-600">
                        Track sign-ins and API usage • Total Users: <span className="font-semibold text-blue-600">{users.length}</span>
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                        <p className="text-red-800 font-medium">{error}</p>
                    </div>
                )}

                <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                                    <th
                                        onClick={() => handleSort('email')}
                                        className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                                    >
                                        Email <SortIcon field="email" />
                                    </th>
                                    <th
                                        onClick={() => handleSort('name')}
                                        className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                                    >
                                        Name <SortIcon field="name" />
                                    </th>
                                    <th
                                        onClick={() => handleSort('first_login')}
                                        className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                                    >
                                        First Login <SortIcon field="first_login" />
                                    </th>
                                    <th
                                        onClick={() => handleSort('last_login')}
                                        className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                                    >
                                        Last Login <SortIcon field="last_login" />
                                    </th>
                                    <th
                                        onClick={() => handleSort('login_count')}
                                        className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                                    >
                                        Logins <SortIcon field="login_count" />
                                    </th>
                                    <th
                                        onClick={() => handleSort('api_calls')}
                                        className="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider cursor-pointer hover:bg-blue-700 transition-colors"
                                    >
                                        API Calls <SortIcon field="api_calls" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {sortedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            <div className="text-lg">No users tracked yet</div>
                                            <div className="text-sm mt-2">Users will appear here after they sign in</div>
                                        </td>
                                    </tr>
                                ) : (
                                    sortedUsers.map((user, index) => (
                                        <tr
                                            key={user.email}
                                            className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                                } hover:bg-blue-50 transition-colors`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {user.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(user.first_login).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {new Date(user.last_login).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                    {user.login_count}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                    {user.api_calls}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
