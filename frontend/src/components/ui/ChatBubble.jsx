const ChatBubble = ({ role, children }) => {
    const isUser = role === "user";

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div
                className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${
                    isUser
                        ? "rounded-lg rounded-tr-none bg-ink text-canvas"
                        : "rounded-lg rounded-tl-none border border-line bg-surface text-ink-soft"
                }`}
            >
                {children}
            </div>
        </div>
    );
};

export default ChatBubble;