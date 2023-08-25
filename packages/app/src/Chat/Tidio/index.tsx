import { CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Input } from 'antd';
import twemoji from 'twemoji';
import cx from 'classnames';
import _ from 'lodash';
import { nanoid } from 'nanoid';
import { useLocalStorage } from 'react-use';

import { SocketProvider, useEvent, useSocket } from '@/socket';
import style from './index.module.css';

interface Message {
  id: string;
  type: string;
  from: {
    type: string;
    id: string;
  };
  data: {
    type: 'text';
    content: string;
  };
  createdAt: string;
}

const VISITOR_ID = nanoid();

export default function Chat() {
  const [visitorId] = useLocalStorage('LeanChat/visitorId', VISITOR_ID);

  return (
    <SocketProvider auth={{ id: visitorId }}>
      <ChatBox />
    </SocketProvider>
  );
}

function useScrollToBottom() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);
  return { containerRef, scrollToBottom };
}

function ChatBox() {
  const socket = useSocket();

  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    socket.emit('getHistory', (res: { result?: Message[] }) => {
      const messages = res.result;
      if (messages) {
        setMessages(messages);
      }
    });
  }, []);

  useEvent(socket, 'message', (message: Message) => {
    setMessages((prev) => [...prev, message]);
  });

  const handleNewMessage = (content: string) => {
    socket.emit('message', {
      data: {
        type: 'text',
        content,
      },
    });
  };

  const { containerRef, scrollToBottom } = useScrollToBottom();
  useLayoutEffect(() => scrollToBottom(), [messages]);

  return (
    <div
      className={cx('sm:absolute sm:right-12 sm:bottom-[26px]', {
        'h-screen sm:h-[600px]': true,
      })}
    >
      <div className="h-full sm:w-[372px] sm:rounded-2xl overflow-hidden flex flex-col shadow-[rgba(0,18,46,0.16)_0px_8px_36px_0px]">
        <Header />
        <div ref={containerRef} className="grow shrink px-7 overflow-y-auto pt-[10px] pb-6">
          <Messages messages={messages} />
        </div>
        <Footer onMessage={handleNewMessage} />
      </div>
    </div>
  );
}

function Header() {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgb(42, 39, 218) 0%, rgb(0, 204, 255) 100%)',
      }}
    >
      <div className="text-white flex items-center text-[22px] p-6 pb-[18px]">
        <div className="w-[52px] h-[52px] bg-white rounded-full mr-6"></div>
        <h2
          ref={(el) => {
            if (el) {
              twemoji.parse(el, {
                attributes: () => ({ width: 31, height: 31, style: 'vertical-align: sub' }),
              });
            }
          }}
        >
          Hi there 👋
        </h2>
      </div>
      <div
        className={style.onlineStatus}
        style={{
          background:
            'linear-gradient(135deg, rgba(42, 39, 218, 0.72) 0%, rgba(0, 204, 255, 0.72) 100%)',
        }}
      >
        <div className="px-7 w-full h-full flex items-center leading-5 pt-[14px] pb-5">
          <div className="bg-[#58b743] w-2 h-2 rounded-full mr-3"></div>
          <div className="text-white">We reply immediately</div>
        </div>
      </div>
    </div>
  );
}

interface FooterProps {
  onMessage: (content: string) => void;
}

function Footer({ onMessage }: FooterProps) {
  const [content, setContent] = useState('');

  const handleMessage = () => {
    if (!content) {
      return;
    }
    onMessage(content);
    setContent('');
  };

  return (
    <div className="px-7 pb-[22px] shrink-0">
      <div>
        <hr />
        <Input.TextArea
          className={style.editor}
          autoSize={{ maxRows: 3 }}
          placeholder="Enter your message..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (e.shiftKey) {
                return;
              }
              e.preventDefault();
              handleMessage();
            }
          }}
          style={{
            fontSize: 17,
            border: 0,
            borderRadius: 0,
            boxShadow: 'unset',
            padding: '20px 0 14px 0',
            lineHeight: '24px',
          }}
        />
      </div>
      <div className="h-[26px] mt-4"></div>
    </div>
  );
}

interface MessagesProps {
  messages: Message[];
}

function Messages({ messages }: MessagesProps) {
  return (
    <div className="w-full float-left">
      {messages.map((msg, key) => (
        <Message key={key} content={msg.data.content} visitor={msg.from.type === 'visitor'} />
      ))}
    </div>
  );
}

interface MessageProps {
  content: string;
  visitor?: boolean;
}

function Message({ content, visitor }: MessageProps) {
  const style: CSSProperties = {};

  if (visitor) {
    style.background = 'linear-gradient(135deg, rgb(42, 39, 218), rgb(0, 204, 255))';
    style.color = 'white';
  }

  return (
    <div
      className={cx(
        'max-w-[85%] rounded-[20px] bg-[#f0f2f7] my-0.5 px-4 py-[10px] text-[15px] leading-5 clear-both min-w-[44px]',
        {
          'float-left': !visitor,
          'float-right': visitor,
        },
      )}
      style={style}
    >
      <div ref={parseEmojiContent} className="whitespace-pre-line">
        {content}
      </div>
    </div>
  );
}

function parseEmojiContent(el?: HTMLElement | null) {
  if (!el) return;
  twemoji.parse(el, {
    attributes: () => ({
      width: 20,
      height: 20,
      style: 'vertical-align: -5px; margin: 0 2px;',
    }),
  });
}