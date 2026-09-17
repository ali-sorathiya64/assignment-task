import { useEffect, useRef, useState } from "react";
import { aiApi } from "../../api/endpoints.js";
import { readError } from "../../api/client.js";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";
import ChatBubble from "../../components/ui/ChatBubble.jsx";

const AskAIModal = ({ assignment, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    // Reset when assignment changes
    useEffect(() => {
        if (!assignment) return;

        setMessages([
            {
                role: "assistant",
                content: `Hi! Ask me anything about "${assignment.title}".`
            }
        ]);
        setInput("");
        setError("");
        setLoading(false);
    }, [assignment]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    // Auto-focus input when modal opens
    useEffect(() => {
        if (assignment) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [assignment]);

    if (!assignment) return null;

    const send = async () => {
        const question = input.trim();
        if (!question || loading) return;

        setError("");
        setInput("");

        setMessages((current) => [
            ...current,
            { role: "user", content: question }
        ]);
        setLoading(true);

        try {
            const { data } = await aiApi.chat(assignment.id, question);

            const sources = data.sources || [];

            setMessages((current) => [
                ...current,
                {
                    role: "assistant",
                    content: data.answer || "No response received.",
                    sources
                }
            ]);
        } catch (err) {
            const message = readError(
                err,
                "Could not reach the AI. Try again in a moment."
            );
            setError(message);

            setMessages((current) => [
                ...current,
                {
                    role: "assistant",
                    content: "Sorry, I couldn't process that. Try again.",
                    error: true
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const onKeyDown = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            send();
        }
    };

    return (
        <Modal
            open
            onClose={onClose}
            title="Ask AI"
            description={assignment.title}
            footer={
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            }
        >
            <div className="flex flex-col" style={{ height: "min(60vh, 480px)" }}>
                {/* Messages */}
                <div
                    ref={scrollRef}
                    className="flex-1 space-y-3 overflow-y-auto px-1 pb-4"
                >
                    {messages.map((message, index) => (
                        <div key={index} className="space-y-2">
                            <ChatBubble role={message.role}>
                                {message.content}
                            </ChatBubble>

                            {message.role === "assistant" &&
                                message.sources &&
                                message.sources.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pl-1">
                                        {message.sources.map((source, i) => (
                                            <span
                                                key={i}
                                                className="rounded-full border border-line bg-surface px-2 py-0.5 text-[10px] font-medium text-ink-muted"
                                            >
                                                {source.title}
                                            </span>
                                        ))}
                                    </div>
                                )}
                        </div>
                    ))}

                    {loading && (
                        <ChatBubble role="assistant">
                            <span className="inline-flex items-center gap-2 text-ink-muted">
                                <span className="flex gap-1">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-muted" />
                                    <span
                                        className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-muted"
                                        style={{ animationDelay: "150ms" }}
                                    />
                                    <span
                                        className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink-muted"
                                        style={{ animationDelay: "300ms" }}
                                    />
                                </span>
                                Thinking
                            </span>
                        </ChatBubble>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <p className="mb-2 rounded-md bg-danger-soft px-3 py-2 text-xs text-danger">
                        {error}
                    </p>
                )}

                {/* Input */}
                <div className="border-t border-line pt-3">
                    <div className="flex items-end gap-2">
                        <textarea
                            ref={inputRef}
                            rows={1}
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            onKeyDown={onKeyDown}
                            placeholder="Ask a question about this assignment..."
                            disabled={loading}
                            className="field resize-none py-2.5"
                            style={{ minHeight: "40px", maxHeight: "120px" }}
                        />
                        <Button
                            variant="accent"
                            onClick={send}
                            disabled={!input.trim() || loading}
                            loading={loading}
                            className="shrink-0"
                        >
                            Send
                        </Button>
                    </div>
                    <p className="mt-1.5 text-[10px] text-ink-faint">
                        Enter to send · Shift + Enter for a new line
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default AskAIModal;