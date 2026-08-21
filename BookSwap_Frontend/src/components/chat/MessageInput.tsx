import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, X, CornerDownRight, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { chatService } from '../../services/chatService';
import type { Message, SendMessageRequest } from '../../types/chat';

interface MessageInputProps {
  conversationId: number;
  replyTo: Message | null;
  onClearReply: () => void;
  onSendMessage: (req: SendMessageRequest) => void;
  onTyping: (isTyping: boolean) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  replyTo,
  onClearReply,
  onSendMessage,
  onTyping,
}) => {
  const [content, setContent] = useState('');
  const [attachedUrl, setAttachedUrl] = useState<string | null>(null);
  const [attachedName, setAttachedName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-focus on reply or conversation change
  useEffect(() => {
    textareaRef.current?.focus();
  }, [conversationId, replyTo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Typing debouncing
    onTyping(true);
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, and WebP image files are supported');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must not exceed 5 MB');
      return;
    }

    try {
      setIsUploading(true);
      const res = await chatService.uploadAttachment(file);
      setAttachedUrl(res.fileUrl);
      setAttachedName(file.name);
      toast.success('Photo attached');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed && !attachedUrl) return;

    onSendMessage({
      conversationId,
      content: trimmed,
      messageType: attachedUrl ? 'IMAGE' : 'TEXT',
      replyToMessageId: replyTo?.id,
      attachmentUrls: attachedUrl ? [attachedUrl] : undefined,
    });

    setContent('');
    setAttachedUrl(null);
    setAttachedName(null);
    onClearReply();
    onTyping(false);
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
  };

  const canSend = (content.trim().length > 0 || attachedUrl !== null) && !isUploading;

  return (
    <div className="border-t border-border bg-card/80 backdrop-blur p-3 space-y-2">
      {/* 1. Reply Target Preview Bar */}
      {replyTo && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-3 py-2 text-xs border-l-4 border-primary animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="min-w-0 flex items-center gap-2">
            <CornerDownRight className="h-3.5 w-3.5 text-primary shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-foreground">
                Replying to {replyTo.sender?.name || 'User'}
              </span>
              <p className="truncate text-muted-foreground text-[11px] mt-0.5">
                {replyTo.messageType === 'IMAGE' ? '📷 Photo' : replyTo.content}
              </p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 rounded-full shrink-0 hover:bg-muted"
            onClick={onClearReply}
            title="Cancel reply"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* 2. Uploaded Attachment Preview */}
      {attachedUrl && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={attachedUrl}
              alt="Attachment Preview"
              className="h-8 w-8 rounded-md object-cover border border-primary/30 shrink-0"
            />
            <span className="font-medium text-foreground truncate text-xs">
              {attachedName || 'Attached Photo'}
            </span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 rounded-full hover:bg-destructive/10 text-destructive"
            onClick={() => {
              setAttachedUrl(null);
              setAttachedName(null);
            }}
            title="Remove attachment"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* 3. Composer Input Bar */}
      <div className="flex items-end gap-2">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
        />

        {/* Photo Upload Trigger Button */}
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-10 w-10 shrink-0 rounded-xl border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground relative"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          title="Attach Book Photo (Max 5MB)"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </Button>

        {/* Textarea */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Press Enter to send)"
            className="w-full resize-none rounded-xl border border-input bg-background/90 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs min-h-[42px] max-h-32 transition-colors"
          />
        </div>

        {/* Send Button */}
        <Button
          type="button"
          size="icon"
          className={`h-10 w-10 shrink-0 rounded-xl transition-all shadow-sm ${
            canSend
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 scale-100'
              : 'opacity-50 cursor-not-allowed'
          }`}
          onClick={handleSubmit}
          disabled={!canSend}
          title="Send Message"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
