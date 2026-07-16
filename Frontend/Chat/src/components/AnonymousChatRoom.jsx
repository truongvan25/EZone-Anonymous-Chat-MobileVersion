import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Lock, AlertTriangle, LogOut, Send, ChevronDown, MessageSquareDashed, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import CartoonAvatar from '@/components/CartoonAvatar.jsx';
import { createChatConnection } from '@/services/chatService';
import ChatBubble from '@/components/ChatBubble.jsx';
import ActionButton from '@/components/ActionButton.jsx';
import TypingIndicator from '@/components/TypingIndicator.jsx';
import { getMessages } from '@/services/messageService';
import { createReport } from '@/services/reportService';
import { requestReveal, getRevealedIdentity, getRevealStatus } from '@/services/revealService';
import { BASE_URL, API_BASE_URL } from '@/constants/config';

const AnonymousChatRoom = () => {
    const navigate = useNavigate();
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get("roomId");
    const userId = params.get("userId") || localStorage.getItem("userId");
    const [currentUserId, setCurrentUserId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [messageCount, setMessageCount] = useState(0);
    const [showLeaveDialog, setShowLeaveDialog] = useState(false);
    const [showIdentityDialog, setShowIdentityDialog] = useState(false);
    const [revealedIdentity, setRevealedIdentity] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [currentRoomId, setCurrentRoomId] = useState(null);

    // Report Modal State
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportDetails, setReportDetails] = useState('');

    const chatBodyRef = useRef(null);
    const connectionRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    // const isIdentityUnlocked = messageCount >= 4;
    const isIdentityUnlocked = true;

    const isReportValid = reportReason !== '' && (reportDetails.length === 0 || reportDetails.length >= 10);

    // Auto-scroll to bottom on new messages or typing state change
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);

        const roomId = params.get("roomId");

        if (!roomId) {
            navigate(`/waiting?userId=${userId}`);
            return;
        }

        let resolvedUserId = params.get("userId");

        if (!resolvedUserId) {
            resolvedUserId = localStorage.getItem("userId");
        }

        if (!resolvedUserId) {
            navigate("/");
            return;
        }

        setCurrentUserId(parseInt(resolvedUserId));
        setCurrentRoomId(parseInt(roomId));

        const connection = createChatConnection();

        connectionRef.current = connection;

        connection.on("ReceiveMessage", (data) => {
            const senderId = parseInt(data.senderId ?? data.SenderId);
            const message = data.message ?? data.Message;

            const newMessage = {
                id: Date.now(),
                text: message,
                isOwn: senderId === parseInt(resolvedUserId),
                timestamp: new Date().toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit"
                })
            };

            setMessages((prev) => [...prev, newMessage]);
        });

        connection.on("UserTyping", () => {
            setIsTyping(true);

            clearTimeout(typingTimeoutRef.current);

            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
            }, 1500);
        });

        connection.on("PartnerDisconnected", () => {
            toast.error("Aww, they left. Let's find another match!");

            setTimeout(() => {
                navigate(`/waiting?userId=${resolvedUserId}`);
            }, 1500);
        });

        connection.on("ViolationDetected", (message) => {
            toast.error(message);
            navigate("/");
        });

        connection.start()
            .then(async () => {
                console.log("SignalR Connected in ChatRoom");

                await connection.invoke("JoinRoom", parseInt(roomId));
                console.log("Joined room:", roomId);
            })
            .catch((err) => {
                console.error("SignalR error:", err);
                toast.error("Oops, connection lost!");
            });

        return () => {
            connection.stop();
        };
    }, [navigate]);

    const handleSendMessage = async () => {
        if (inputValue.trim() === "") return;

        const messageToSend = inputValue.trim();
        setInputValue("");

        try {
            await connectionRef.current.invoke("SendMessage", messageToSend);
        } catch (err) {
            console.error(err);
            toast.error("Failed to send");
        }
    };

    const handleToggleTyping = () => {
        if (isTyping) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            setIsTyping(false);
        } else {
            setIsTyping(true);
            // Auto clear after some time to prevent getting stuck
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
            }, 5000);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleRequestIdentity = async () => {
        try {
            const userId =
                parseInt(
                    new URLSearchParams(window.location.search)
                        .get("userId")
                );

            const status = await getRevealStatus(currentRoomId);
            console.log('[WEB][Reveal] status before request:', status);

            const room = await requestReveal(
                currentRoomId,
                userId
            );
            console.log('[WEB][Reveal] requestReveal response:', room);

            if (room.isRevealed) {
                const identity =
                    await getRevealedIdentity(
                        currentRoomId,
                        userId
                    );

                setRevealedIdentity(identity);
                setShowIdentityDialog(true);

                toast.success("Say hello to your match!");
            }
            else {
                toast.success("You showed yours, now it's their turn!");
            }
        }
        catch (err) {
            console.error('[WEB][Reveal] error:', err);
            toast.error(err || "Too soon to unmask!");
        }
    };

    const handleAcceptIdentityReveal = async () => {
        await connectionRef.current.invoke("AcceptIdentityReveal");
    };

    const handleReportOpenChange = (open) => {
        setShowReportDialog(open);
        if (!open) {
            // Reset form on close
            setReportReason('');
            setReportDetails('');
        }
    };

    const handleConfirmReport = async () => {

        if (!isReportValid) return;

        try {
            const reporterId =
                parseInt(
                    new URLSearchParams(window.location.search)
                        .get("userId")
                );

            const reportedUserId =
                await connectionRef.current.invoke("GetPartnerUserId");

            await createReport({
                roomId: currentRoomId,
                reporterId: reporterId,
                reportedUserId: reportedUserId,
                violatingMessage: reportDetails || "Reported from chat UI",
                reason: reportReason
            });

            toast.success("Report submitted!");

            setShowReportDialog(false);
            setReportReason('');
            setReportDetails('');
        }
        catch (err) {
            console.error(err);
            toast.error("Oops! Something went wrong with the report");
        }
    };

    const handleLeave = () => {
        setShowLeaveDialog(true);
    };

    const handleConfirmLeave = async () => {
        setShowLeaveDialog(false);

        try {
            await connectionRef.current.invoke("LeaveRoom");

            toast.success("Left the chat");

            setTimeout(() => {
                navigate(`/waiting?userId=${userId}`);
            }, 1000);
        }
        catch (err) {
            console.error(err);
            toast.error("Can't leave room");
        }
    };

    const handleFindNew = () => {
        navigate(`/waiting?userId=${userId}`);
    };

    const logout = async () => {
        const token = localStorage.getItem("token");

        try {
            if (connectionRef.current) {
                await connectionRef.current.stop();
            }

            await fetch(`${API_BASE_URL}/Auth/logout`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
        } catch (error) {
            console.log("Logout error:", error);
        }

        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("fullname");
        localStorage.removeItem("roles");

        window.location.href = `${BASE_URL}/login.html`;
    };

    return (
        <>
            <Helmet>
                <title>EZone</title>
                <meta name="description" content="Step into the Zone. Match your anonymous alter-ego in style!" />
            </Helmet>

            {/* Fixed Background Layer with Crowd Illustration */}
            <div
                className="fixed inset-0 z-0 bg-crowd-pattern"
            >
                {/* Semi-transparent white overlay for readability (20% opacity) */}
                <div className="absolute inset-0 bg-white/20 pointer-events-none" />
            </div>

            {/* Main Content Layer (Relative & Z-10 to sit above background) */}
            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <header className="bg-primary text-primary-foreground cartoon-border-sm cartoon-shadow p-4 sm:p-6">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <div>
                            <CartoonAvatar size="md" />
                            <p className="mt-2 text-sm opacity-90 font-medium">EZone: Go Anonymous</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={logout}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white text-primary font-bold rounded-lg cartoon-border-sm cartoon-shadow-sm hover:scale-105 active:scale-95 transition-transform"
                            >
                                <Users className="w-4 h-4" />
                                Out-Zone
                            </button>
                            {/* Demo Typing Toggle */}
                            <button
                                onClick={handleToggleTyping}
                                title="Test Typing Indicator"
                                className="p-2 bg-primary-foreground/20 rounded-full hover:bg-primary-foreground/30 transition-colors"
                            >
                                <MessageSquareDashed className="w-5 h-5 text-primary-foreground" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Chat Body */}
                <main className="flex-1 overflow-hidden flex flex-col max-w-4xl w-full mx-auto">
                    <div
                        ref={chatBodyRef}
                        className="flex-1 overflow-y-auto p-4 sm:p-6"
                    >
                        {messages.map((message) => (
                            <ChatBubble
                                key={message.id}
                                message={message.text}
                                isOwn={message.isOwn === true}
                                timestamp={message.timestamp}
                            />
                        ))}

                        {/* Typing Indicator integrated here */}
                        <TypingIndicator isTyping={isTyping} />
                    </div>

                    {/* Footer */}
                    <footer className="bg-muted cartoon-border-sm cartoon-shadow-sm p-4 sm:p-6">
                        {/* Action Buttons */}
                        <div className="flex gap-2 mb-4 justify-center flex-wrap">
                            <ActionButton
                                icon={Lock}
                                label="Zone Reveal"
                                onClick={handleRequestIdentity}
                                disabled={!isIdentityUnlocked}
                                variant="primary"
                            />
                            <ActionButton
                                icon={AlertTriangle}
                                label="Zone Report"
                                onClick={() => setShowReportDialog(true)}
                                variant="danger"
                            />
                            <ActionButton
                                icon={LogOut}
                                label="Leave Zone"
                                onClick={handleConfirmLeave}
                                variant="secondary"
                            />
                            <button
                                onClick={handleConfirmLeave}
                                className="sm:hidden flex items-center gap-2 px-4 py-2 bg-white text-primary font-bold rounded-lg cartoon-border-sm cartoon-shadow-sm hover:scale-105 active:scale-95 transition-transform"
                            >
                                <Users className="w-4 h-4" />
                                Leave Zone
                            </button>
                        </div>

                        {/* Message Input */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => {

                                    setInputValue(e.target.value);

                                    if (connectionRef.current) {
                                        connectionRef.current.invoke("Typing");
                                    }
                                }}
                                onKeyPress={handleKeyPress}
                                placeholder="Chat here..."
                                className="flex-1 px-4 py-3 rounded-lg cartoon-border-sm cartoon-shadow-sm bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 outline-none transition-all duration-200"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim()}
                                className={`px-4 py-3 rounded-lg cartoon-border-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${inputValue.trim()
                                    ? 'bg-primary text-primary-foreground cartoon-shadow-sm hover:scale-105 active:scale-95'
                                    : 'bg-muted-foreground/20 text-muted-foreground opacity-50 cursor-not-allowed'
                                    }`}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>

                        {!isIdentityUnlocked && (
                            <p className="text-xs text-muted-foreground mt-2 text-center font-medium">
                                Send {Math.max(0, 4 - messageCount)} more messages to unlock unmasking
                            </p>
                        )}
                    </footer>
                </main>

                {/* Report Dialog - Custom Cartoon Styling */}
                <Dialog open={showReportDialog} onOpenChange={handleReportOpenChange}>
                    <DialogContent className="cartoon-border cartoon-shadow-lg bg-background sm:max-w-md p-6">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-extrabold text-foreground">Report User</DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                Help us keep EZone clean. What's the issue?
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col gap-5 py-4">
                            {/* Reason Dropdown */}
                            <div className="flex flex-col gap-2">
                                <label htmlFor="report-reason" className="text-sm font-bold text-foreground">
                                    Whatâ€™s breaking the Zone? <span className="text-destructive">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        id="report-reason"
                                        value={reportReason}
                                        onChange={(e) => setReportReason(e.target.value)}
                                        className="w-full appearance-none p-3 pr-10 rounded-lg cartoon-border-sm cartoon-shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--form-focus))] transition-shadow"
                                    >
                                        <option value="" disabled>-- Select the issue --</option>
                                        <option value="spam">Spam or Ads</option>
                                        <option value="offensive">Toxic / Rude talk</option>
                                        <option value="inappropriate">Inappropriate behavior</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-3.5 h-5 w-5 pointer-events-none text-foreground opacity-70" />
                                </div>
                            </div>

                            {/* Details Textarea */}
                            <div className="flex flex-col gap-2">
                                <label htmlFor="report-details" className="text-sm font-bold text-foreground">
                                    Tell us more... (Optional)
                                </label>
                                <textarea
                                    id="report-details"
                                    value={reportDetails}
                                    onChange={(e) => setReportDetails(e.target.value)}
                                    placeholder="Please describe the reason for your report..."
                                    className="w-full min-h-[120px] p-3 rounded-lg cartoon-border-sm cartoon-shadow-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--form-focus))] resize-y transition-shadow"
                                />
                                {reportDetails.length > 0 && reportDetails.length < 10 && (
                                    <p className="text-sm text-destructive font-medium animate-fade-in">
                                        Please enter at least 10 characters.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-2">
                            <button
                                onClick={() => handleReportOpenChange(false)}
                                className="px-5 py-2.5 rounded-lg cartoon-border-sm cartoon-shadow-sm font-bold bg-gray-200 text-gray-800 hover:scale-105 active:scale-95 transition-transform"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmReport}
                                disabled={!isReportValid}
                                className={`px-5 py-2.5 rounded-lg cartoon-border-sm cartoon-shadow-sm font-bold transition-all ${isReportValid
                                    ? 'bg-[hsl(var(--report-button))] text-[hsl(var(--report-button-foreground))] hover:scale-105 active:scale-95 cursor-pointer'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400 shadow-none'
                                    }`}
                            >
                                Report Now
                            </button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Leave Dialog */}
                <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
                    <AlertDialogContent className="cartoon-border cartoon-shadow-lg">
                        <AlertDialogHeader>
                            <AlertDialogTitle>Leave Now</AlertDialogTitle>
                            <AlertDialogDescription>
                                This chat will vanish forever. Are you sure you want to exit?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="cartoon-border-sm hover:scale-105 active:scale-95 transition-transform font-bold">á»ž Láº¡i</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleConfirmLeave}
                                className="bg-secondary text-secondary-foreground cartoon-border-sm cartoon-shadow-sm hover:bg-secondary/90 hover:scale-105 active:scale-95 transition-transform font-bold"
                            >
                                Leave
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Identity Dialog */}
                <Dialog open={showIdentityDialog} onOpenChange={setShowIdentityDialog}>
                    <DialogContent className="cartoon-border cartoon-shadow-lg">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Identity Unlocked!</DialogTitle>
                            <DialogDescription>
                                Identity reveal accepted!
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-6">
                            {revealedIdentity ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-24 h-24 rounded-full cartoon-border cartoon-shadow bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-5xl animate-bounce-in">
                                        {revealedIdentity.avatarUrl ? (
                                            <img
                                                src={`${BASE_URL}${revealedIdentity.avatarUrl}`}
                                                alt="Avatar"
                                                className="w-full h-full object-cover rounded-full"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-5xl rounded-full">
                                                ðŸ‘¤
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-center animate-slide-up">
                                        <h3 className="text-xl font-bold">
                                            {revealedIdentity.fullname}
                                        </h3>

                                        <p className="text-sm text-muted-foreground mt-1 font-medium">
                                            Major: {revealedIdentity.majorCode || "N/A"}
                                        </p>

                                        <p className="text-sm text-muted-foreground font-medium">
                                            Gender: {revealedIdentity.gender || "N/A"}
                                        </p>

                                        {revealedIdentity.socialLink && (
                                            <p className="text-sm text-primary font-bold mt-2">
                                                {revealedIdentity.socialLink}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center font-medium">
                                    Pending identity reveal...
                                </p>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
};

export default AnonymousChatRoom;