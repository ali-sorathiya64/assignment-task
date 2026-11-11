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

        setMessages((prev) => [...prev, { role: "user", content: question }]);
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
                    className="scroll-thin h-72 space-y-3 overflow-y-auto rounded-lg border border-line bg-canvas px-4 py-4"
                >
                    {messages.map((message, index) => (
                        <MessageRow key={index} message={message} />
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="flex gap-1 rounded-lg rounded-tl-none border border-line bg-surface px-4 py-3">
                                {[0, 1, 2].map((i) => (
                                    <span
                                        key={i}
                                        className="h-1.5 w-1.5 animate-pulse-soft bg-accent"
                                        style={{ animationDelay: `${i * 160}ms` }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <p className="rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
                        {error}
                    </p>
                )}

                <div className="flex items-stretch gap-2">
                    <textarea
                        ref={inputRef}
                        rows={1}
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="Ask about the deadline, link, or details…"
                        disabled={loading}
                        className="field flex-1 resize-none leading-5"
                        style={{ height: "42px", maxHeight: "120px" }}
                    />
                    <Button
                        variant="accent"
                        onClick={send}
                        disabled={!input.trim() || loading}
                        className="shrink-0"
                    >
                        Send
                    </Button>
                </div>

                <p className="micro text-[10px]">
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
                <div className="max-w-[85%] rounded-lg rounded-tr-none bg-ink px-4 py-2.5 text-sm leading-relaxed text-canvas">
                    {message.content}
                </div>
            </div>
        );
    }

    const hasSources =
        message.sources &&
        Array.isArray(message.sources) &&
        message.sources.length > 0;

    return (
        <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg rounded-tl-none border border-line bg-surface px-4 py-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
                    {message.content}
                </p>

                {hasSources && (
                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-2.5">
                        {message.sources.map((source, i) => (
                            <span
                                key={i}
                                className="rounded-sm border border-accent/30 bg-accent-soft px-1.5 py-0.5 font-mono text-[10px] font-medium text-accent-ink"
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