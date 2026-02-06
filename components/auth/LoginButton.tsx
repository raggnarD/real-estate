'use client'

import { signIn, signOut, useSession } from "next-auth/react"

export default function LoginButton() {
    const { data: session } = useSession()

    if (session) {
        return (
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                    {session.user?.name || session.user?.email}
                </span>
                <button
                    onClick={() => signOut()}
                    className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
                >
                    Sign out
                </button>
            </div>
        )
    }

    return (
        <button
            onClick={() => signIn("google")}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
            Sign in with Google
        </button>
    )
}
