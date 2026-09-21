import { useEffect, useRef, useState } from "react";
import { aiApi } from "../../api/endpoints.js";
import { readError } from "../../api/client.js";
import Button from "../../components/ui/Button.jsx";
import Modal from "../../components/ui/Modal.jsx";

const AskAIModal = ({ assignment, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const scrollRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (!assignment) return;

        setMessages([
            {
                role: "assistant",
                content: `Hi! Ask me anything about "${assignment.title}" — I know its description, deadline, submission link, and type.`
            }
        ]);
        setInput("");
        setError("");
        setLoading(false);
    }, [assignment]);

    useEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, loading]);

    useEffect(() => {
        if (assignment) {
            const id = setTimeout(() => inputRef.current?.focus(), 120);
            return () => clearTimeout(id);
        }
    }, [assignment]);

    if (!assignment) return null;

    const send = async () => {
        const question = input.trim();
        if (!question || loading) return;

        setError("");
        setInput("");

        setMessages((prev) => [
            ...prev,
            { role: "user", content: question }
        ]);
        setLoading(true);

        try {
            const { data } = await aiApi.chat(assignment.id, question);
            const sources = data.sources || [];

            setMessages((prev) => [
                ...prev,
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

            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Sorry, I couldn't process that. Try again."
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
            title="Ask AI about this assignment"
            description={assignment.title}
            footer={
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            }
        >
            <div className="flex flex-col gap-3">
                <div
                    ref={scrollRef}
                    className="max-h-[52vh] min-h-[260px] space-y-4 overflow-y-auto rounded-md bg-canvas px-4 py-4"
                >
                    {messages.map((message, index) => (
                        <MessageRow key={index} message={message} />
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="rounded-2xl rounded-tl-sm bg-surface px-4 py-2.5 shadow-xs">
                                <span className="inline-flex items-center gap-2 text-xs text-ink-muted">
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
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <p className="rounded-md bg-danger-soft px-3 py-2 text-xs text-danger">
                        {error}
                    </p>
                )}

                <div className="flex items-end gap-2">
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="Ask about the deadline, link, or details…"
                        disabled={loading}
                        className="field max-h-32 min-h-[42px] flex-1 resize-none py-2.5 leading-relaxed"
                    />
                    <Button
                        variant="accent"
                        onClick={send}
                        disabled={!input.trim() || loading}
                        className="h-[42px] shrink-0"
                    >
                        Send
                    </Button>
                </div>

                <p className="text-[10px] text-ink-faint">
                    Enter to send · Shift + Enter for a new line
                </p>
            </div>
        </Modal>
    );
};

const MessageRow = ({ message }) => {
    const isUser = message.role === "user";

    if (isUser) {
        return (
            <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-ink px-4 py-2.5 text-sm leading-relaxed text-white shadow-xs">
                    {message.content}
                </div>
            </div>
        );
    }

    const hasSources =
        message.sources && Array.isArray(message.sources) && message.sources.length > 0;

    return (
        <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-surface px-4 py-3 shadow-xs">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                    {message.content}
                </p>

                {hasSources && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-line-soft pt-2.5">
                        {message.sources.map((source, i) => (
                            <span
                                key={i}
                                className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent"
                            >
                                {source.title}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AskAIModal;