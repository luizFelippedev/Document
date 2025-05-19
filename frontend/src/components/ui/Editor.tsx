// frontend/src/components/ui/Editor.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';
import { 
  Bold, Italic, Underline, List, ListOrdered, Link, Code, Image,
  AlignLeft, AlignCenter, AlignRight, Quote, Heading1, Heading2, Heading3,
  Type, Strikethrough, ChevronDown, X
} from 'lucide-react';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  readOnly?: boolean;
  error?: string;
  className?: string;
  toolbarClassName?: string;
  editorClassName?: string;
}

export const Editor = ({
  value,
  onChange,
  placeholder = 'Start writing...',
  minHeight = '200px',
  readOnly = false,
  error,
  className,
  toolbarClassName,
  editorClassName,
}: EditorProps) => {
  const { resolvedTheme } = useTheme();
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  
  // Initialize the editor with the initial value
  useEffect(() => {
    if (editorRef.current && value) {
      editorRef.current.innerHTML = value;
    }
  }, []);
  
  // Handle content changes
  const handleContentChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };
  
  // Focus editor
  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };
  
  // Execute command on the document
  const execCommand = (command: string, value?: string) => {
    if (readOnly) return;
    
    document.execCommand(command, false, value);
    handleContentChange();
    focusEditor();
  };
  
  // Handle button click for commands
  const handleButtonClick = (command: string, value?: string) => {
    execCommand(command, value);
  };
  
  // Handle link insertion
  const handleAddLink = () => {
    if (!linkUrl) return;
    
    const selectedText = window.getSelection()?.toString();
    const text = linkText || selectedText || linkUrl;
    
    execCommand('insertHTML', `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`);
    
    setLinkUrl('');
    setLinkText('');
    setShowLinkInput(false);
  };
  
  // Handle image insertion
  const handleAddImage = () => {
    if (!imageUrl) return;
    
    execCommand('insertHTML', `<img src="${imageUrl}" alt="${imageAlt}" style="max-width: 100%; height: auto;" />`);
    
    setImageUrl('');
    setImageAlt('');
    setShowImageInput(false);
  };
  
  // Button group for common text formatting
  const textFormatButtons = [
    { icon: <Bold size={16} />, command: 'bold', title: 'Bold (Ctrl+B)' },
    { icon: <Italic size={16} />, command: 'italic', title: 'Italic (Ctrl+I)' },
    { icon: <Underline size={16} />, command: 'underline', title: 'Underline (Ctrl+U)' },
    { icon: <Strikethrough size={16} />, command: 'strikeThrough', title: 'Strikethrough' },
  ];
  
  // Button group for alignment
  const alignmentButtons = [
    { icon: <AlignLeft size={16} />, command: 'justifyLeft', title: 'Align Left' },
    { icon: <AlignCenter size={16} />, command: 'justifyCenter', title: 'Align Center' },
    { icon: <AlignRight size={16} />, command: 'justifyRight', title: 'Align Right' },
  ];
  
  // Button group for lists
  const listButtons = [
    { icon: <List size={16} />, command: 'insertUnorderedList', title: 'Bullet List' },
    { icon: <ListOrdered size={16} />, command: 'insertOrderedList', title: 'Numbered List' },
  ];
  
  // Heading options
  const headingOptions = [
    { label: 'Normal Text', command: 'formatBlock', value: 'p' },
    { label: 'Heading 1', command: 'formatBlock', value: 'h1', icon: <Heading1 size={16} /> },
    { label: 'Heading 2', command: 'formatBlock', value: 'h2', icon: <Heading2 size={16} /> },
    { label: 'Heading 3', command: 'formatBlock', value: 'h3', icon: <Heading3 size={16} /> },
  ];
  
  return (
    <div className={cn(
      'border rounded-md overflow-hidden',
      error 
        ? 'border-red-500 dark:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20 dark:focus-within:ring-red-500/20' 
        : 'border-gray-300 dark:border-gray-600 focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:focus-within:ring-blue-500/20',
      className
    )}>
      {/* Toolbar */}
      <div className={cn(
        'flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800',
        readOnly && 'hidden',
        toolbarClassName
      )}>
        {/* Format dropdown button */}
        <div className="relative mr-1">
          <button
            type="button"
            className={cn(
              'flex items-center h-8 px-2 rounded',
              'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
              showHeadingDropdown && 'bg-gray-200 dark:bg-gray-700'
            )}
            onClick={() => setShowHeadingDropdown(!showHeadingDropdown)}
          >
            <Type size={16} className="mr-1" />
            <span className="text-sm">Text</span>
            <ChevronDown size={14} className="ml-1" />
          </button>
          
          {showHeadingDropdown && (
            <div className="absolute z-10 mt-1 w-48 py-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
              {headingOptions.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  onClick={() => {
                    handleButtonClick(option.command, option.value);
                    setShowHeadingDropdown(false);
                  }}
                >
                  {option.icon || <Type size={16} />}
                  <span className="ml-2">{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Text formatting */}
        <div className="flex items-center border-r border-gray-300 dark:border-gray-600 pr-1 mr-1">
          {textFormatButtons.map((button, index) => (
            <button
              key={index}
              type="button"
              className="p-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              onClick={() => handleButtonClick(button.command)}
              title={button.title}
            >
              {button.icon}
            </button>
          ))}
        </div>
        
        {/* Lists */}
        <div className="flex items-center border-r border-gray-300 dark:border-gray-600 pr-1 mr-1">
          {listButtons.map((button, index) => (
            <button
              key={index}
              type="button"
              className="p-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              onClick={() => handleButtonClick(button.command)}
              title={button.title}
            >
              {button.icon}
            </button>
          ))}
        </div>
        
        {/* Alignment */}
        <div className="flex items-center border-r border-gray-300 dark:border-gray-600 pr-1 mr-1">
          {alignmentButtons.map((button, index) => (
            <button
              key={index}
              type="button"
              className="p-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              onClick={() => handleButtonClick(button.command)}
              title={button.title}
            >
              {button.icon}
            </button>
          ))}
        </div>
        
        {/* Special tools */}
        <div className="flex items-center">
          {/* Quote button */}
          <button
            type="button"
            className="p-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            onClick={() => handleButtonClick('formatBlock', 'blockquote')}
            title="Quote"
          >
            <Quote size={16} />
          </button>
          
          {/* Code button */}
          <button
            type="button"
            className="p-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            onClick={() => handleButtonClick('formatBlock', 'pre')}
            title="Code Block"
          >
            <Code size={16} />
          </button>
          
          {/* Link button */}
          <div className="relative">
            <button
              type="button"
              className={cn(
                'p-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded',
                showLinkInput && 'bg-gray-200 dark:bg-gray-700'
              )}
              onClick={() => setShowLinkInput(!showLinkInput)}
              title="Insert Link"
            >
              <Link size={16} />
            </button>
            
            {showLinkInput && (
              <div className="absolute z-10 mt-1 w-72 p-3 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Insert Link</h3>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    onClick={() => setShowLinkInput(false)}
                  >
                    <X size={14} />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="https://example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Text (optional)</label>
                    <input
                      type="text"
                      value={linkText}
                      onChange={(e) => setLinkText(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Link text"
                    />
                  </div>
                  
                  <div className="flex justify-end mt-3">
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                      onClick={handleAddLink}
                    >
                      Insert Link
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Image button */}
          <div className="relative">
            <button
              type="button"
              className={cn(
                'p-1.5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded',
                showImageInput && 'bg-gray-200 dark:bg-gray-700'
              )}
              onClick={() => setShowImageInput(!showImageInput)}
              title="Insert Image"
            >
              <Image size={16} />
            </button>
            
            {showImageInput && (
              <div className="absolute z-10 mt-1 w-72 p-3 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Insert Image</h3>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    onClick={() => setShowImageInput(false)}
                  >
                    <X size={14} />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Alt Text</label>
                    <input
                      type="text"
                      value={imageAlt}
                      onChange={(e) => setImageAlt(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Image description"
                    />
                  </div>
                  
                  <div className="flex justify-end mt-3">
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                      onClick={handleAddImage}
                    >
                      Insert Image
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Editor content area */}
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        className={cn(
          'p-3 outline-none overflow-auto',
          'prose dark:prose-invert prose-sm max-w-none',
          'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
          editorClassName
        )}
        style={{ minHeight }}
        placeholder={placeholder}
        onInput={handleContentChange}
        onBlur={handleContentChange}
        dangerouslySetInnerHTML={{ __html: value }}
      ></div>
      
      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      
      <style jsx global>{`
        [contenteditable=true]:empty:before {
          content: attr(placeholder);
          color: ${resolvedTheme === 'dark' ? '#9ca3af' : '#9ca3af'};
          font-style: italic;
        }
      `}</style>
    </div>
  );
};