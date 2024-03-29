import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PiChatCentered, PiCaretRight, PiArrowLeftBold, PiXBold } from 'react-icons/pi';
import cx from 'classnames';

import { useAppContext } from '../AppContext';
import { useEffectEvent } from '../hooks/useEventEffect';
import { useChat, useOnInviteEvaluation } from '../chat';
import { ReplyInput } from './components/ReplyInput';
import { MessageList } from './components/MessageList';
import { Modal } from './components/Modal';
import { useWindowSize } from './hooks/useWindowSize';
import { useSessionStorage } from './hooks/useSessionStorage';
import { EvaluationDialog } from './components/EvaluationDialog';
import { Conversation, EvaluateData } from '../types';

const isEmbedded = !!(window.top && window.top !== window);

function getSendInterval(conversation: Conversation | undefined) {
  if (conversation) {
    if (conversation.operatorJoined) {
      return 2000;
    }
    if (conversation.queuedAt) {
      return 30000;
    }
  }
  return 2000;
}

export default function Modern() {
  const { iframe, emitter, getDisplay } = useAppContext();

  const [display, setDisplay] = useState(getDisplay);
  useEffect(() => {
    emitter.on('display', setDisplay);
    return () => {
      return emitter.off('display', setDisplay);
    };
  }, []);

  const windowSize = useWindowSize();

  const [show, setShow] = useState(true);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);

  const { connected, reconnecting, conversation, messages, evaluationTag, send, evaluate } =
    useChat();

  const [rawSendTime, setRawSendTime] = useSessionStorage('sendTime');
  const handleSend = (data: any) => {
    if (data.text && data.text.length > 1000) {
      return alert('内容过长');
    }
    const sendTime = Number(rawSendTime ?? '0');
    const now = Date.now();
    if (now - sendTime < getSendInterval(conversation)) {
      return alert('您发送的太快了，休息一下吧~');
    }
    send(data);
    setRawSendTime(now.toString());
  };

  useOnInviteEvaluation(() => {
    setShowEvaluationModal(true);
  });

  const evaluable = Boolean(
    conversation && conversation.operatorJoined && !conversation.evaluation,
  );

  useEffect(() => {
    iframe.style.position = 'fixed';
    iframe.style.inset = 'auto 0px 0px auto';
  }, []);

  const isMobile = isEmbedded ? windowSize.width <= 480 : true;

  const resize = useEffectEvent(() => {
    const { innerHeight, document } = window.top || window;
    if (!display) {
      document.body.style.overflow = document.body.dataset.overflow ?? '';
      return;
    }
    if (show) {
      if (isMobile) {
        document.body.style.overflow = 'hidden';
        iframe.style.width = '100vw';
        iframe.style.height = `${innerHeight}px`; // 100dvh !!!
      } else {
        document.body.style.overflow = document.body.dataset.overflow ?? '';
        iframe.style.width = '400px';
        iframe.style.height = `${Math.min(600, innerHeight)}px`;
      }
    } else {
      iframe.style.width = '80px';
      iframe.style.height = '80px';
    }
  });

  const scrollToBottom = useEffectEvent(() => {
    const messageWrapper = messageWrapperRef.current;
    if (messageWrapper) {
      messageWrapper.scrollTop = messageWrapper.scrollHeight;
    }
  });

  useEffect(resize, [windowSize, show, display]);

  const replyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (show) {
      replyRef.current?.focus();
      scrollToBottom();
    }
  }, [show]);

  const messageWrapperRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(scrollToBottom, [messages]);

  const handleClose = () => {
    if (evaluable) {
      setShowEvaluationModal(true);
      return;
    }
    emitter.emit('close');
  };

  const handleEvaluate = (data: EvaluateData) => {
    evaluate(data);
    setShowEvaluationModal(false);
  };

  return (
    <div
      className={cx('h-screen flex flex-col items-stretch', {
        'p-4': !isMobile,
      })}
    >
      {show && (
        <div
          className={cx('grow overflow-hidden flex flex-col bg-white', {
            'rounded-xl shadow-lg mb-4': !isMobile,
          })}
        >
          {isEmbedded && (
            <div className="h-[42px] bg-primary flex items-center text-text shrink-0">
              {isMobile && (
                <button className="h-10 w-10 flex" onClick={handleClose}>
                  <PiArrowLeftBold className="w-5 h-5 m-auto" />
                </button>
              )}
              <div
                className={cx('text-sm mr-auto', {
                  'ml-5': !isMobile,
                })}
              >
                在线客服
              </div>
              {!isMobile && (
                <button className="h-10 w-10 flex" onClick={handleClose}>
                  <PiXBold className="w-5 h-5 m-auto" />
                </button>
              )}
            </div>
          )}
          <div className="grow flex flex-col overflow-hidden relative">
            <div
              ref={messageWrapperRef}
              className="grow overflow-y-auto p-[10px] scrollable relative"
            >
              <MessageList messages={messages} />
            </div>
            {reconnecting && (
              <div className="text-sm text-center text-[rgb(187,192,199)] bg-white leading-8">
                连接断开，正在重连……
              </div>
            )}
            <ReplyInput
              ref={replyRef}
              disabled={!connected}
              onReplyText={(text) => handleSend({ text })}
              onReplyFile={(fileId) => handleSend({ fileId })}
              evaluable={evaluable}
              onClickEvaluate={() => setShowEvaluationModal(true)}
            />
            {showEvaluationModal && (
              <Modal>
                <EvaluationDialog
                  onEvaluate={handleEvaluate}
                  onCancel={() => setShowEvaluationModal(false)}
                  tag={evaluationTag}
                />
              </Modal>
            )}
          </div>
        </div>
      )}
      {!isMobile && (
        <button
          className={cx(
            'shrink-0 ml-auto bg-primary w-12 h-12 rounded-xl transition-transform duration-200 hover:scale-110 active:scale-90 shadow-lg',
            {
              'rotate-90': show,
            },
          )}
          onClick={() => setShow((show) => !show)}
        >
          {show ? (
            <PiCaretRight className="w-7 h-7 m-auto text-text" />
          ) : (
            <PiChatCentered className="w-7 h-7 m-auto text-text" />
          )}
        </button>
      )}
    </div>
  );
}
