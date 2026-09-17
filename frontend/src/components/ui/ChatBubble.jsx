const ChatBubble = ({ role, children }) => {
    const isUser = role === "user";

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div
                className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
                    isUser
                        ? "bg-ink text-white"
                        : "bg-canvas text-ink-soft"
                }`}
            >
                {children}
            </div>
        </div>
    );
};

export default ChatBubble;