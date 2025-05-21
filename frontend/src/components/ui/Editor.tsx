// frontend/src/components/ui/Editor.tsx
"use client";

import { useRef, useState, useEffect, forwardRef } from "react";
import { cn } from "@/utils/cn";

export interface EditorProps {
  /** Initial content value */
  value?: string;
  /** Called when the content changes */
  onChange?: (value: string) => void;
  /** Placeholder text when the editor is empty */
  placeholder?: string;
  /** Minimum height of the editor */
  minHeight?: string;
  /** Maximum height of the editor */
  maxHeight?: string;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Whether the editor has an error */
  error?: string;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Whether to auto-focus the editor on mount */
  autoFocus?: boolean;
  /** Additional class name */
  className?: string;
  /** Whether to allow markdown formatting */
  markdown?: boolean;
  /** Whether to show a toolbar */
  toolbar?: boolean;
  /** Sanitize HTML content before setting it */
  sanitize?: boolean;
}

/**
 * Rich text editor component for content editing
 */
export const Editor = forwardRef<HTMLDivElement, EditorProps>(
  (
    {
      value = "",
      onChange,
      placeholder = "Start typing...",
      minHeight = "150px",
      maxHeight = "500px",
      readOnly = false,
      error,
      disabled = false,
      autoFocus = false,
      className,
      markdown = false,
      toolbar = true,
      sanitize = true,
      ...props
    },
    ref,
  ) => {
    const editorRef = useRef<HTMLDivElement | null>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Sanitize HTML content
    const sanitizeContent = (html: string) => {
      if (!sanitize) return html;

      const doc = new DOMParser().parseFromString(html, "text/html");
      const allowedTags = [
        "p",
        "div",
        "span",
        "br",
        "b",
        "i",
        "strong",
        "em",
        "u",
        "a",
        "ul",
        "ol",
        "li",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "blockquote",
        "pre",
        "code",
      ];
      const allowedAttrs = ["href", "target", "rel", "style", "class"];

      // Recursive function to sanitize nodes
      const sanitizeNode = (node: Element) => {
        // Remove disallowed tags
        if (!allowedTags.includes(node.tagName.toLowerCase())) {
          const fragment = document.createDocumentFragment();
          while (node.firstChild) {
            fragment.appendChild(node.firstChild);
          }
          node.parentNode?.replaceChild(fragment, node);
          return;
        }

        // Remove disallowed attributes
        Array.from(node.attributes).forEach((attr) => {
          if (!allowedAttrs.includes(attr.name)) {
            node.removeAttribute(attr.name);
          }
        });

        // Process children recursively
        Array.from(node.children).forEach(sanitizeNode);
      };

      Array.from(doc.body.children).forEach(sanitizeNode);
      return doc.body.innerHTML;
    };

    // Initialize editor content
    useEffect(() => {
      if (editorRef.current && value !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = value;
      }
    }, [value]);

    // Auto-focus handling
    useEffect(() => {
      if (autoFocus && editorRef.current && !readOnly && !disabled) {
        editorRef.current.focus();

        // Place cursor at the end
        const range = document.createRange();
        const selection = window.getSelection();

        if (editorRef.current.childNodes.length > 0) {
          const lastNode =
            editorRef.current.childNodes[
              editorRef.current.childNodes.length - 1
            ];
          range.selectNodeContents(lastNode);
          range.collapse(false);
        } else {
          range.selectNodeContents(editorRef.current);
          range.collapse(false);
        }

        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }, [autoFocus, readOnly, disabled]);

    // Handle content changes
    const handleInput = () => {
      if (onChange && editorRef.current) {
        const content = sanitizeContent(editorRef.current.innerHTML);
        onChange(content);
      }
    };

    // Handle toolbar actions
    const handleFormat = (command: string, value?: string) => {
      if (readOnly || disabled) return;

      document.execCommand(command, false, value);
      handleInput();
      editorRef.current?.focus();
    };

    // Handle paste to strip formatting if needed
    const handlePaste = (e: React.ClipboardEvent) => {
      if (readOnly || disabled) return;

      // Get text representation of clipboard
      const text = e.clipboardData.getData("text/plain");

      if (!markdown) {
        // Prevent the default paste behavior
        e.preventDefault();

        // Insert text manually
        document.execCommand("insertText", false, text);
      }

      handleInput();
    };

    // Generate class names
    const editorClasses = cn(
      "prose prose-sm dark:prose-invert max-w-none p-3 outline-none transition-colors",
      "border rounded-md",
      "focus:ring-2 focus:ring-offset-1",
      {
        "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400":
          !error && !disabled,
        "border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:focus:border-red-500":
          !!error,
        "bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-70": disabled,
        "border-blue-500 dark:border-blue-400":
          isFocused && !error && !disabled,
      },
      className,
    );

    return (
      <div className="space-y-2">
        {/* Toolbar */}
        {toolbar && !readOnly && !disabled && (
          <div className="flex flex-wrap items-center gap-1 p-1 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
            <button
              type="button"
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              onClick={() => handleFormat("bold")}
              title="Bold"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </button>

            <button
              type="button"
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              onClick={() => handleFormat("italic")}
              title="Italic"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
            </button>

            <button
              type="button"
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              onClick={() => handleFormat("underline")}
              title="Underline"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                />
              </svg>
            </button>

            <div className="h-4 w-px mx-1 bg-gray-300 dark:bg-gray-600" />

            <button
              type="button"
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              onClick={() => handleFormat("insertOrderedList")}
              title="Numbered List"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <button
              type="button"
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              onClick={() => handleFormat("insertUnorderedList")}
              title="Bullet List"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </button>

            <div className="h-4 w-px mx-1 bg-gray-300 dark:bg-gray-600" />

            <button
              type="button"
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              onClick={() => {
                const url = prompt("Enter URL:");
                if (url) handleFormat("createLink", url);
              }}
              title="Insert Link"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101"
                />
              </svg>
            </button>

            <button
              type="button"
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              onClick={() => handleFormat("removeFormat")}
              title="Clear Formatting"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Editor */}
        <div
          ref={(element) => {
            // Combine refs
            editorRef.current = element;
            if (typeof ref === "function") {
              ref(element);
            } else if (ref) {
              ref.current = element;
            }
          }}
          className={editorClasses}
          contentEditable={!readOnly && !disabled}
          onInput={handleInput}
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          data-placeholder={placeholder}
          style={{
            minHeight,
            maxHeight,
            overflowY: "auto",
          }}
          {...props}
        />

        {/* Error message */}
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  },
);

Editor.displayName = "Editor";
