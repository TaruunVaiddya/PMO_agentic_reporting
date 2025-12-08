"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputAttachments,
  PromptInputAttachment,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputMessage
} from '@/components/ai-elements/prompt-input';
import { Globe, FileText, MessageCircleQuestion, FolderOpen, Binoculars } from 'lucide-react';
import { MetallicButton } from '@/components/ui/metallic-button';
import useSWR from 'swr';
import { fetcher } from '@/lib/get-fetcher';

export type ChatMode = 'web-search' | 'report-generation' | 'data-qa' | 'deep-research' | null;

interface Collection {
  id: string;
  name: string;
  description: string;
  document_count: number;
  created_at: string;
  updated_at: string;
}

interface CollectionPosition {
  start: number;
  end: number;
}

interface ChatInputProps {
  onSubmit: (message: PromptInputMessage) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function ChatInput({
  onSubmit,
  placeholder = "What would you like to know?",
  className = "",
  disabled = false
}: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ChatMode>(null);
  const [showCollectionMenu, setShowCollectionMenu] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  // NEW STATE to track position
  const [collectionTagPosition, setCollectionTagPosition] = useState<CollectionPosition | null>(null); 
  const [collectionMenuPosition, setCollectionMenuPosition] = useState(0);
  const [shouldFocus, setShouldFocus] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch collections
  const { data } = useSWR('/collections', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  const collections: Collection[] = data?.collections ?? [];

  const handleModeToggle = (mode: ChatMode) => {
    setSelectedMode(prev => prev === mode ? null : mode);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);


    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtSymbolIndex !== -1 && lastAtSymbolIndex === cursorPosition - 1) {
      const charBeforeAt = lastAtSymbolIndex > 0 ? value[lastAtSymbolIndex - 1] : ' ';
      if (charBeforeAt === ' ' || lastAtSymbolIndex === 0) {
        setCollectionMenuPosition(lastAtSymbolIndex);
        setShowCollectionMenu(true);
      } else {
        setShowCollectionMenu(false);
      }
    } else {
      setShowCollectionMenu(false);
    }
  };

  const handleCollectionSelect = (collection: Collection) => {
    setSelectedCollection(collection);

    const collectionTag = `@${collection.name} `;
    const beforeAt = inputValue.substring(0, collectionMenuPosition);
    const afterAt = inputValue.substring(collectionMenuPosition + 1);
    const newValue = `${beforeAt}${collectionTag}${afterAt}`;

    setInputValue(newValue);
    setShowCollectionMenu(false);

    const start = collectionMenuPosition;
    const end = start + collectionTag.length;
    setCollectionTagPosition({ start, end });
    
    setShouldFocus(true); 
  };

  const handleRemoveCollection = (cursorPosition?: number) => {
    if (selectedCollection && collectionTagPosition) {
      // 1. Remove the text from the input
      const beforeTag = inputValue.substring(0, collectionTagPosition.start);
      // We assume the collection tag is followed by a space, so we find the end of the tag content
      const afterTagContentStart = collectionTagPosition.end; 
      const afterTag = inputValue.substring(afterTagContentStart);
      
      let newValue = `${beforeTag}${afterTag}`;

      // Trim extra spaces if they were at the boundaries
      if (newValue.length > 0 && newValue[newValue.length - 1] === ' ') {
        newValue = newValue.trimEnd();
      }

      // 2. Reset the state
      setSelectedCollection(null);
      setCollectionTagPosition(null);
      setInputValue(newValue);

      // 3. Adjust cursor position if necessary (optional but good for UX)
      if (textareaRef.current) {
        const newCursorPosition = collectionTagPosition.start;
        // The focus effect might run later, so we use a flag to handle it, but for a
        // direct key handler, setting selection range immediately is more reliable.
        setTimeout(() => {
          if (textareaRef.current) {
             textareaRef.current.focus();
             textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
          }
        }, 0);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Backspace' && selectedCollection && collectionTagPosition) {
      const textarea = e.target as HTMLTextAreaElement;
      const cursorPosition = textarea.selectionStart;

      // Logic: If the cursor is immediately after the tag (at 'end')
      // OR anywhere within the tag (between 'start' and 'end'), delete the whole tag.
      const isAtEndOfTag = cursorPosition === collectionTagPosition.end;
      const isWithinTag = cursorPosition > collectionTagPosition.start && cursorPosition <= collectionTagPosition.end;

      if (isAtEndOfTag || isWithinTag) {
        e.preventDefault(); // Stop the default character deletion
        handleRemoveCollection(cursorPosition);
      }
    }
  };

  // Handle focusing after collection selection
  useEffect(() => {
    if (shouldFocus) {
      const textarea = containerRef.current?.querySelector('textarea');
      if (textarea) {
        textareaRef.current = textarea; // Store the ref here for key down logic
        // Focus and set cursor at the end
        textarea.focus();
        const position = inputValue.length;
        textarea.setSelectionRange(position, position);
      }
      setShouldFocus(false);
    } else {
      // Ensure the ref is up-to-date even if shouldFocus isn't active
      const textarea = containerRef.current?.querySelector('textarea');
      if (textarea) {
        textareaRef.current = textarea;
      }
    }
  }, [shouldFocus, inputValue]);

  const handleSubmit = async (message: PromptInputMessage) => {
    if (disabled) return;

    setIsSubmitting(true);

    try {
      const messageWithMode = {
        ...message,
        mode: selectedMode,
        collection_id: selectedCollection?.id ?? null
      };
      await onSubmit(messageWithMode);
      setInputValue('');
      setSelectedCollection(null);
      setCollectionTagPosition(null); // Reset position on submit
    } catch (error) {
      console.error('Error submitting message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowCollectionMenu(false);
      }
    };

    if (showCollectionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showCollectionMenu]);

  return (
    <div className="relative" ref={containerRef}>
      {/* Selected Collection Tag placed at Top Right (Absolute Positioning) */}
      {selectedCollection && (
        <div className="absolute -top-10 right-0 z-10 p-2"> 
          <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 border border-white/20 rounded-md text-xs text-white/70 shadow-lg">
            <FolderOpen className="w-3 h-3" />
            <span className="font-medium">Collection:</span>
            <span>{selectedCollection.name}</span>
            <button
              onClick={() => handleRemoveCollection()}
              className="ml-1 hover:text-white/90 transition-colors focus:outline-none"
              type="button"
              aria-label="Remove selected collection"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <PromptInput
        onSubmit={handleSubmit}
        className={`border border-white/15 bg-black/40 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl divide-white/15 ${className}`}
        accept="image/*"
        multiple
        maxFiles={10}
        maxFileSize={10 * 1024 * 1024}
      >
        <PromptInputBody className="bg-transparent custom-scrollbar">
          <PromptInputAttachments>
            {(attachment) => (
              <PromptInputAttachment
                data={attachment}
                className="border-white/10 bg-black/10"
              />
            )}
          </PromptInputAttachments>
          <PromptInputTextarea
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown} // ADDED: Keydown handler for backspace
            ref={textareaRef} // ADDED: Direct ref for selection range manipulation
            placeholder={placeholder}
            className="text-white/90 placeholder:text-white/40 text-base bg-transparent"
            disabled={disabled}
          />
        </PromptInputBody>
        <PromptInputToolbar className="bg-black/10">
          <PromptInputTools>
            <div className="flex items-center gap-1.5">
              <MetallicButton
                type="button"
                onClick={() => handleModeToggle('web-search')}
                isActive={selectedMode === 'web-search'}
                variant="compact"
                disabled={disabled}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Web Search</span>
              </MetallicButton>

              <MetallicButton
                type="button"
                onClick={() => handleModeToggle('report-generation')}
                isActive={selectedMode === 'report-generation'}
                variant="compact"
                disabled={disabled}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Report Generation</span>
              </MetallicButton>

              <MetallicButton
                type="button"
                onClick={() => handleModeToggle('data-qa')}
                isActive={selectedMode === 'data-qa'}
                variant="compact"
                disabled={disabled}
              >
                <MessageCircleQuestion className="h-3.5 w-3.5" />
                <span>Data Q&A</span>
              </MetallicButton>

               <MetallicButton
                type="button"
                onClick={() => handleModeToggle('deep-research')}
                isActive={selectedMode === 'deep-research'}
                variant="compact"
                disabled={disabled}
              >
                <Binoculars className="h-3.5 w-3.5" />
                <span>Deep Research</span>
              </MetallicButton>
            </div>
          </PromptInputTools>
          <PromptInputSubmit
            disabled={(!inputValue.trim() && !isSubmitting) || disabled}
            status={isSubmitting ? 'submitted' : 'ready'}
            className="bg-white hover:bg-white/90 text-black rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          />
        </PromptInputToolbar>
      </PromptInput>

      {/* Collection Selection Menu */}
      {showCollectionMenu && (
        <div
          ref={menuRef}
          className="absolute bottom-full left-0 mb-2 w-96 max-h-80 bg-black/95 backdrop-blur-md border border-white/15 rounded-lg shadow-2xl overflow-hidden z-50"
        >
          <div className="p-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Select a collection</span>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {collections.length > 0 ? (
              collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => handleCollectionSelect(collection)}
                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                >
                  <div className="w-8 h-8 rounded-md bg-gradient-to-t from-white/5 to-white/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="w-4 h-4 text-white/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-medium text-white/90 truncate">
                        {collection.name}
                      </h4>
                      <span className="text-xs text-white/40 flex-shrink-0">
                        {collection.document_count} docs
                      </span>
                    </div>
                    <p className="text-xs text-white/50 line-clamp-1">
                      {collection.description}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-sm text-white/50">
                <FolderOpen className="w-8 h-8 text-white/30 mx-auto mb-2" />
                <p>No collections available</p>
                <p className="text-xs text-white/30 mt-1">
                  Create a collection in the Library first
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}