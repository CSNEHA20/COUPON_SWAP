'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Message } from '@/types'
import { Send, ArrowLeft, Loader2 } from 'lucide-react'

export default function ChatPage() {
    const params = useParams()
    const router = useRouter()
    const targetUserId = params.userId as string

    const [loading, setLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        const initChat = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setCurrentUser(user)

            // Fetch existing messages
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
                .order('created_at', { ascending: true })

            if (data) setMessages(data)
            setLoading(false)

            // Realtime subscription
            // We subscribe to ANY insert on public:messages
            // Filter logic is usually client-side handling or restricted row-level subscription
            // Standard supabase realtime: .on('postgres_changes', ...)
            const channel = supabase
                .channel('realtime_chat')
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                    },
                    (payload) => {
                        const newMsg = payload.new as Message
                        // Check if this message belongs to this conversation
                        if (
                            (newMsg.sender_id === user.id && newMsg.receiver_id === targetUserId) ||
                            (newMsg.sender_id === targetUserId && newMsg.receiver_id === user.id)
                        ) {
                            // Verify we don't duplicate if we inserted it ourselves optimistically (optional, but React state handles generic append)
                            // Simple check: if we just sent it, we might have added it? 
                            // For simplicity, we'll just Append if ID not in list (if we fetch)
                            // But usually we just append.
                            setMessages((prev) => {
                                if (prev.find(m => m.id === newMsg.id)) return prev
                                return [...prev, newMsg]
                            })
                        }
                    }
                )
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }

        initChat()
    }, [router, targetUserId])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !currentUser) return

        setSending(true)
        const content = newMessage.trim()
        setNewMessage('') // Clear input immediately

        // Optimistic UI? Maybe later. For now, wait for DB or subscription.

        const { error } = await supabase.from('messages').insert({
            sender_id: currentUser.id,
            receiver_id: targetUserId,
            content,
        })

        if (error) {
            alert('Failed to send message')
            setNewMessage(content) // revert
        }
        setSending(false)
    }

    if (loading) {
        return <div className="flex h-screen justify-center items-center"><Loader2 className="animate-spin text-indigo-600" /></div>
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-50 max-w-4xl mx-auto border-x border-gray-200 shadow-sm">
            {/* Chat Header */}
            <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center shadow-sm z-10">
                <Link href="/profile" className="mr-3 text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    {/* Ideally fetch target user name, but effective anonymity or quick hack: */}
                    <h2 className="text-lg font-semibold text-gray-800">Chat</h2>
                    <span className="text-xs text-green-500 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        Online
                    </span>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-gray-400 text-sm">
                        No messages yet. Say hello!
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === currentUser.id
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${isMe
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                    }`}>
                                    <p className="text-sm">{msg.content}</p>
                                    <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white p-4 border-t border-gray-200">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border-gray-300 rounded-full focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2 border shadow-sm"
                    />
                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim()}
                        className="bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    )
}
