import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, CheckCheck, CornerDownRight, Copy, Trash2, Reply, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Message } from '../../types/chat';
import { Button } from '../ui/button';

interface MessageBubbleProps {
  message: Message;
  isSelf: boolean;
  onReply: (message: Message) => void;
  onDelete: (messageId: number) => void;
  onImageClick: (url: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isSelf,
  onReply,
  onDelete,
  onImageClick,
}) => {
  const [showActions, setShowActions] = useState(false);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      toast.success('Message copied to clipboard');
    }
  };

  // 1. SYSTEM Message Styling
  if (message.messageType === 'SYSTEM') {
    return (
      <div className="flex justify-center my-3">
        <div className="rounded-full bg-muted/80 border border-border/60 px-4 py-1 text-xs text-muted-foreground font-medium shadow-2xs text-center max-w-md">
          {message.content}
        </div>
      </div>
    );
  }

  // 2. Deleted Message Styling
  if (message.deleted) {
    return (
      <div className={`flex my-1 ${isSelf ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`rounded-2xl px-4 py-2 text-xs italic text-muted-foreground/80 border border-border/40 bg-muted/30 flex items-center gap-1.5 max-w-[75%]`}
        >
          <Trash2 className="h-3 w-3" />
          <span>This message was deleted</span>
          <span className="text-[10px] ml-2 text-muted-foreground/50">
            {formatTime(message.createdAt)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`group relative flex items-end gap-1.5 my-1.5 ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl p-3 shadow-xs transition-shadow duration-200 ${
          isSelf
            ? 'bg-primary text-primary-foreground rounded-br-xs'
            : 'bg-card text-card-foreground border border-border/70 rounded-bl-xs'
        }`}
      >
        {/* Reply Quote Banner */}
        {message.replyTo && (
          <div
            className={`mb-2 rounded-lg p-2 text-xs border-l-3 transition-colors ${
              isSelf
                ? 'bg-black/15 text-primary-foreground/90 border-primary-foreground/60'
                : 'bg-muted/70 text-foreground/80 border-primary'
            }`}
          >
            <div className="flex items-center gap-1 font-bold text-[11px]">
              <CornerDownRight className="h-3 w-3" />
              <span>{message.replyTo.senderName || 'User'}</span>
            </div>
            <p className="truncate line-clamp-1 mt-0.5 text-[11px] opacity-90">
              {message.replyTo.messageType === 'IMAGE' ? '📷 Photo' : message.replyTo.content}
            </p>
          </div>
        )}

        {/* Image Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2 mb-2">
            {message.attachments.map((att, idx) => (
              <div
                key={idx}
                onClick={() => onImageClick(att.fileUrl)}
                className="group/img relative overflow-hidden rounded-xl cursor-pointer max-h-72 border border-black/10 dark:border-white/10"
              >
                <img
                  src={att.fileUrl}
                  alt={att.fileName || 'Attachment'}
                  className="w-full h-auto object-cover max-h-72 transition-transform duration-300 group-hover/img:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-white drop-shadow-md" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Text Content */}
        {message.content && (
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed select-text">
            {message.content}
          </p>
        )}

        {/* Footer: Timestamp & Delivery Status */}
        <div
          className={`flex items-center justify-end gap-1 mt-1 text-[10px] select-none ${
            isSelf ? 'text-primary-foreground/75' : 'text-muted-foreground'
          }`}
        >
          <span>{formatTime(message.createdAt)}</span>
          {isSelf && (
            <span
              className="inline-flex items-center ml-0.5"
              title={message.status === 'READ' ? 'Read' : message.status === 'DELIVERED' ? 'Delivered' : 'Sent'}
            >
              {message.status === 'READ' ? (
                <CheckCheck className="h-3.5 w-3.5 text-sky-300 dark:text-sky-400" />
              ) : message.status === 'DELIVERED' ? (
                <CheckCheck className="h-3.5 w-3.5 opacity-90" />
              ) : (
                <Check className="h-3.5 w-3.5 opacity-75" />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Floating Action Menu on Hover (Beside Bubble) */}
      <div
        className={`flex items-center gap-0.5 self-center rounded-full bg-card/95 backdrop-blur-xs border border-border shadow-md px-1 py-0.5 transition-all duration-150 shrink-0 ${
          showActions ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
          onClick={() => onReply(message)}
          title="Reply"
        >
          <Reply className="h-3.5 w-3.5" />
        </Button>

        {message.content && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
            title="Copy Text"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        )}

        {isSelf && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(message.id)}
            title="Delete Message"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};
